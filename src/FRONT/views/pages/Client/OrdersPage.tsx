import React, { useEffect, useState } from "react";
import { useAuth } from "../../components/login/AuthContext";
import { useNavigate } from "react-router-dom";
import styles from "./checkout.module.css";

const OrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [toCancelId, setToCancelId] = useState<string | null>(null);
    const navigate = useNavigate();
    const { user, userType, isAuthenticated } = useAuth();

    useEffect(() => {
        const load = async () => {
            try {
                const raw = localStorage.getItem("bs_orders_v1");
                const arr = raw ? JSON.parse(raw) : [];

                // intentar cargar sucursales para resolver códigos a objetos
                let branches: any[] = [];
                try {
                    const res = await fetch('/sucursales');
                    if (res.ok) branches = await res.json();
                } catch (err) {
                    // no bloquear por fallo en sucursales
                    console.warn('No se pudieron cargar sucursales para OrdersPage', err);
                }

                const branchMap: Record<string, any> = {};
                (branches || []).forEach((b: any) => {
                    if (b.codSucursal) branchMap[b.codSucursal] = b;
                });

                const normalized = (arr || []).map((o: any) => {
                    // migrar estados antiguos en inglés a español para compatibilidad
                    const s = o?.status;
                    if (s === 'cancelled') return { ...o, status: 'Cancelado' };
                    if (s === 'confirmed') return { ...o, status: 'Confirmado' };
                    return o;
                });

                const resolved = (normalized || []).map((o: any) => {
                    // si branch es string (código), intentar resolver
                    if (o && typeof o.branch === 'string' && branchMap[o.branch]) {
                        return { ...o, _branchInfo: branchMap[o.branch] };
                    }
                    // si branch es objeto, usarlo
                    if (o && o.branch && typeof o.branch === 'object') {
                        return { ...o, _branchInfo: o.branch };
                    }
                    return { ...o, _branchInfo: null };
                }).reverse();

                // filtrar según ownership: admins ven todo, clientes sólo sus pedidos
                let filtered = resolved;
                if (isAuthenticated && userType === 'client') {
                    const uid = user?.codUsuario;
                    const email = user?.email;
                    filtered = resolved.filter((o: any) => {
                        if (o.buyerId && uid) return o.buyerId === uid;
                        // fallback: comparar por email si no hay buyerId
                        if (o.buyer?.email && email) return o.buyer.email === email;
                        return false;
                    });
                } else if (!isAuthenticated) {
                    // no autenticado: no mostrar pedidos
                    filtered = [];
                }

                setOrders(filtered);
            } catch (err) {
                console.error(err);
                setOrders([]);
            }
        };

        load();
    }, []);

    const cancelOrder = (orderId: string) => {
        try {
            const raw = localStorage.getItem("bs_orders_v1");
            const arr = raw ? JSON.parse(raw) : [];
            const updated = arr.map((o: any) => {
                if (o.id === orderId) {
                    return { ...o, status: "Cancelado", cancelledAt: new Date().toISOString() };
                }
                return o;
            });
            localStorage.setItem("bs_orders_v1", JSON.stringify(updated));
            // actualizar UI: resolver de nuevo para mantener _branchInfo y volver a filtrar por ownership
            const resolved = updated.map((o: any) => ({ ...o, _branchInfo: o.branch && typeof o.branch === 'object' ? o.branch : o._branchInfo })).reverse();

            let filtered = resolved;
            if (isAuthenticated && userType === 'client') {
                const uid = user?.codUsuario;
                const email = user?.email;
                filtered = resolved.filter((o: any) => {
                    if (o.buyerId && uid) return o.buyerId === uid;
                    if (o.buyer?.email && email) return o.buyer.email === email;
                    return false;
                });
            } else if (!isAuthenticated) {
                filtered = [];
            }

            setOrders(filtered);
        } catch (err) {
            console.error(err);
        } finally {
            setModalOpen(false);
            setToCancelId(null);
        }
    };

    const openCancelModal = (orderId: string) => {
        setToCancelId(orderId);
        setModalOpen(true);
    };

    const confirmCancel = () => {
        if (toCancelId) cancelOrder(toCancelId);
    };

    return (
        <div className={styles.container}>
            <h2>Mis Pedidos</h2>
            {!isAuthenticated ? (
                <div>Debes iniciar sesión para ver tus pedidos.</div>
            ) : orders.length === 0 ? (
                <div>No hay pedidos registrados.</div>
            ) : (
                <ul className={styles.list}>
                    {orders.map((o) => (
                        <li key={o.id} className={styles.item} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                <div>
                                    <div style={{ fontWeight: 700 }}>{o.id}</div>
                                    <div>Comprador: {o.buyer?.firstName} {o.buyer?.lastName}</div>
                                    <div>Retiro: {new Date(o.pickupAt).toLocaleDateString()}</div>
                                    <div>
                                        Sucursal: {
                                            o._branchInfo
                                                ? `${o._branchInfo.nombre}${o._branchInfo.calle ? ` - ${o._branchInfo.calle}` : ''}${o._branchInfo.altura ? ` ${o._branchInfo.altura}` : ''}`
                                                : (typeof o.branch === 'object' ? o.branch.nombre : o.branch)
                                        }
                                    </div>
                                    <div>Estado: {o.status || 'Confirmado'}</div>
                                    {o.status === 'Cancelado' && <div>Cancelado: {new Date(o.cancelledAt).toLocaleString()}</div>}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700 }}>${o.total?.toFixed ? o.total.toFixed(2) : o.total}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <button className={styles.payBtn} onClick={() => navigate('/order-confirmation', { state: { order: o, orderId: o.id } })}>Ver</button>
                                        {o.status !== 'Cancelado' && (
                                            <button className={styles.clearBtn} onClick={() => openCancelModal(o.id)}>Cancelar</button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: 8 }}>
                                <small>{(o.items || []).map((it: any) => `${it.name} x${it.quantity}`).join(' • ')}</small>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            {modalOpen && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modal} role="dialog" aria-modal="true">
                        <h3>Confirmar cancelación</h3>
                        <p>¿Estás seguro que deseas cancelar el pedido {toCancelId} ?</p>
                        <div className={styles.modalActions}>
                            <button className={styles.clearBtn} onClick={() => { setModalOpen(false); setToCancelId(null); }}>Cancelar</button>
                            <button className={styles.payBtn} onClick={confirmCancel}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
