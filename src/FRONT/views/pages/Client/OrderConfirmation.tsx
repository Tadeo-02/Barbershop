import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./checkout.module.css";

interface BranchInfo {
    codSucursal: string;
    nombre: string;
    calle?: string;
    altura?: string | number;
}

const OrderConfirmation: React.FC = () => {
    const { state } = useLocation();
    const navigate = useNavigate();

    // state expected: { orderId, pickupAt, order }
    const orderFromState = state?.order;
    const initialOrderId = state?.orderId || orderFromState?.id;
    const initialPickupAt = state?.pickupAt || orderFromState?.pickupAt;

    const [order, setOrder] = useState<any>(orderFromState || null);
    const [branchInfo, setBranchInfo] = useState<BranchInfo | null>(null);

    // Si no tenemos información de sucursal en la orden (solo tenemos el código),
    // intentar cargar las sucursales y buscar la coincidencia.
    useEffect(() => {
        const loadBranch = async () => {
            try {
                // Si order tiene branch como objeto con nombre, usarlo
                if (order && typeof order.branch === "object") {
                    setBranchInfo(order.branch as BranchInfo);
                    return;
                }

                const branchCode = order?.branch || (state?.order?.branch as string) || null;
                if (!branchCode) return;

                const res = await fetch("/sucursales");
                if (!res.ok) throw new Error("No se pudieron cargar las sucursales");
                const data = await res.json();
                const found = (data || []).find((b: any) => b.codSucursal === branchCode);
                if (found) setBranchInfo(found as BranchInfo);
            } catch (err) {
                console.error("Error cargando sucursal:", err);
            }
        };

        loadBranch();
    }, [order, state]);
    // Fallback: si no venimos con order en state, leer el último pedido de localStorage
    useEffect(() => {
        if (order) return;
        try {
            const raw = localStorage.getItem("bs_orders_v1");
            const arr = raw ? JSON.parse(raw) : [];
            if (arr && arr.length > 0) {
                // tomar el último y normalizar posibles estados antiguos
                const last = arr[arr.length - 1];
                if (last) {
                    if (last.status === 'cancelled') last.status = 'Cancelado';
                    if (last.status === 'confirmed') last.status = 'Confirmado';
                }
                setOrder(last);
            }
        } catch (err) {
            console.error(err);
        }
    }, [order]);

    const effectiveOrderId = initialOrderId || order?.id;
    const effectivePickupAt = initialPickupAt || order?.pickupAt;

    if (!order && !effectiveOrderId) {
        return (
            <div className={styles.container}>
                <h2>Pedido no encontrado</h2>
                <p>No se encontró información del pedido. Revisa el historial o intenta nuevamente.</p>
                <button onClick={() => navigate('/')}>Volver al inicio</button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h2>Confirmación de pedido</h2>
            <div className={styles.content}>
                <section className={styles.summarySection}>
                    <h3>Pedido confirmado</h3>
                    <p><strong>Número de pedido:</strong> {effectiveOrderId || order?.id}</p>
                    <p><strong>Retiro estimado:</strong> {(() => {
                        try {
                            const dateStr = effectivePickupAt || order?.pickupAt;
                            return dateStr ? new Date(dateStr).toLocaleDateString() : '-';
                        } catch (e) {
                            console.error('Error formateando fecha de pickup', e);
                            return '-';
                        }
                    })()}</p>
                    <p>
                        <strong>Sucursal:</strong>{" "}
                        {branchInfo ? (
                            `${branchInfo.nombre}${branchInfo.calle ? ` - ${branchInfo.calle}` : ""}${branchInfo.altura ? ` ${branchInfo.altura}` : ""}`
                        ) : order?.branch ? (
                            typeof order.branch === 'object' ?
                                `${order.branch.nombre}${order.branch.calle ? ` - ${order.branch.calle}` : ""}${order.branch.altura ? ` ${order.branch.altura}` : ""}`
                                : order.branch
                        ) : (
                            "-"
                        )}
                    </p>
                    <p><strong>Total:</strong> ${order?.total?.toFixed ? order.total.toFixed(2) : (order?.total ?? '-')}</p>
                    <p><strong>Estado:</strong> {order?.status || 'Confirmado'}</p>
                    {order?.status === 'Cancelado' && (
                        <p><strong>Cancelado:</strong> {order?.cancelledAt ? new Date(order.cancelledAt).toLocaleString() : '-'}</p>
                    )}

                    <h4>Productos</h4>
                    <ul className={styles.list}>
                        {(order?.items || []).map((it: any) => (
                            <li key={it.productId} className={styles.item}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontWeight: 600 }}>{it.name}</div>
                                    <div>Cantidad: {it.quantity} — ${ (it.price * it.quantity).toFixed(2) }</div>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div style={{ marginTop: 20 }}>
                        <button className={styles.payBtn} onClick={() => navigate('/')}>Volver al inicio</button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default OrderConfirmation;
