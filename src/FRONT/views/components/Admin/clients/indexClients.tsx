import React, { useEffect, useState } from "react";
import styles from "./indexClients.module.css";
import toast from "react-hot-toast";

interface Cliente {
    codUsuario: string;
    dni: string;
    nombre: string;
    apellido: string;
    telefono?: string | null;
    email?: string | null;
    cuil?: string | null;
    codSucursal?: string | null;
}

interface ClienteProfile extends Cliente {
    categoriaActual?: {
        codCategoria: string;
        nombreCategoria: string;
        descCategoria?: string;
        descuentoCorte?: number;
        descuentoProducto?: number;
        fechaInicio?: string | Date;
    } | null;
}

const IndexClients = () => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedClient, setExpandedClient] = useState<string | null>(null);
    const [profilesCache, setProfilesCache] = useState<Record<string, ClienteProfile>>({});
    const [categorias, setCategorias] = useState<Array<{codCategoria: string; nombreCategoria: string}>>([]);
    const [selectedCategoria, setSelectedCategoria] = useState<string>("all");
    const [visibleClients, setVisibleClients] = useState<Cliente[]>([]);

    useEffect(() => {
        const fetchClientes = async () => {
            try {
                const response = await fetch(`/usuarios?type=client`);
                if (!response.ok) {
                    const text = await response.text().catch(() => "");
                    console.error("/usuarios error body:", text);
                    throw new Error(`HTTP ${response.status} - ${text}`);
                }
                const data = await response.json();

                // backend devuelve un array de usuarios directamente
                if (Array.isArray(data)) {
                    setClientes(data as Cliente[]);
                    setVisibleClients(data as Cliente[]);
                } else if (data && Array.isArray((data as any).data)) {
                    setClientes((data as any).data as Cliente[]);
                    setVisibleClients((data as any).data as Cliente[]);
                } else {
                    setClientes([]);
                }
            } catch (error) {
                console.error("Error fetching clients:", error);
                toast.error("Error al cargar los clientes");
                setClientes([]);
            } finally {
                setLoading(false);
            }
        };

        fetchClientes();
    }, []);

    const fetchProfile = async (codUsuario: string) => {
        try {
            // evitar volver a buscar si ya está en caché
            if (profilesCache[codUsuario]) return profilesCache[codUsuario];

            const res = await fetch(`/usuarios/profiles/${codUsuario}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();

            // backend wraps profile in { success: true, data: user }
            const profile: ClienteProfile = (json && json.data) || json;
            setProfilesCache((prev) => ({ ...prev, [codUsuario]: profile }));
            return profile;
        } catch (error) {
            console.error("Error fetching profile:", error);
            toast.error("No se pudo obtener el perfil");
            return null;
        }
    };

    const toggleExpand = async (codUsuario: string) => {
        if (expandedClient === codUsuario) {
            setExpandedClient(null);
            return;
        }

        await fetchProfile(codUsuario);
        setExpandedClient(codUsuario);
    };

    // fetch categories para el filtrado
    useEffect(() => {
        const fetchCategorias = async () => {
            try {
                    const res = await fetch(`/categorias`);
                    if (!res.ok) {
                        const text = await res.text().catch(() => "");
                        console.error("/categorias error body:", text);
                        throw new Error(`HTTP ${res.status} - ${text}`);
                    }
                    const json = await res.json();
                setCategorias(Array.isArray(json) ? json : (json.data || []));
            } catch (error) {
                console.error("Error fetching categorias:", error);
            }
        };

        fetchCategorias();
    }, []);

    useEffect(() => {
        const applyFilter = async () => {
            if (selectedCategoria === "all") {
                setVisibleClients(clientes);
                return;
            }

            const needFetch = clientes.filter((c) => !profilesCache[c.codUsuario]);

            try {
                await Promise.all(needFetch.map((c) => fetchProfile(c.codUsuario)));
            } catch (error) {
            }

            const filtered = clientes.filter((c) => {
                const prof = profilesCache[c.codUsuario];
                return prof?.categoriaActual?.codCategoria === selectedCategoria;
            });

            setVisibleClients(filtered);
        };

        applyFilter();
    }, [selectedCategoria, clientes]);

    if (loading) return <div className={styles.loading}>Cargando clientes...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.headerRow}>
                    <h2 className={styles.title}>Listado de Clientes</h2>
                    <br />
                    <div className={styles.filterRow}>
                        <label className={styles.filterLabel} htmlFor="categoriaSelect">Filtrar por categoría:</label>
                        <select
                            id="categoriaSelect"
                            className={styles.select}
                            value={selectedCategoria}
                            onChange={(e) => setSelectedCategoria(e.target.value)}
                        >
                            <option value="all">Todas</option>
                            {categorias.map((cat) => (
                                <option key={cat.codCategoria} value={cat.codCategoria}>{cat.nombreCategoria}</option>
                            ))}
                        </select>
                        <div className={styles.countBadge}>{visibleClients.length}</div>
                    </div>
                </div>

                <div className={styles.cardList}>
                    {visibleClients.length === 0 ? (
                        <div className={styles.empty}>No hay clientes</div>
                    ) : (
                        visibleClients.map((cliente) => (
                            <div key={cliente.codUsuario} className={styles.clientCard}>
                                <div className={styles.clientTop}>
                                    <div>
                                        <div className={styles.smallMuted}>DNI: {cliente.dni}</div>
                                        <div>{cliente.nombre} {cliente.apellido}</div>
                                    </div>
                                    <div className={styles.actions}>
                                        <button type="button" className={`${styles.btn} ${styles.btnView}`} onClick={() => toggleExpand(cliente.codUsuario)}>
                                            {expandedClient === cliente.codUsuario ? "Ver menos" : "Ver más"}
                                        </button>
                                    </div>
                                </div>

                                {expandedClient === cliente.codUsuario && (
                                    <div className={styles.clientProfile}>
                                        {profilesCache[cliente.codUsuario] ? (
                                            <div className={styles.profileInner}>
                                                <p><strong>Nombre:</strong> {profilesCache[cliente.codUsuario].nombre} {profilesCache[cliente.codUsuario].apellido}</p>
                                                <p><strong>DNI:</strong> {profilesCache[cliente.codUsuario].dni}</p>
                                                <p><strong>Teléfono:</strong> {profilesCache[cliente.codUsuario].telefono ?? "-"}</p>
                                                <p><strong>Email:</strong> {profilesCache[cliente.codUsuario].email ?? "-"}</p>
                                                <p><strong>Categoría actual:</strong> {profilesCache[cliente.codUsuario].categoriaActual?.nombreCategoria ?? "-"}</p>
                                                <p><strong>Fecha inicio categoría:</strong> {profilesCache[cliente.codUsuario].categoriaActual?.fechaInicio ? String(profilesCache[cliente.codUsuario].categoriaActual?.fechaInicio) : "-"}</p>
                                            </div>
                                        ) : (
                                            <div>Cargando perfil...</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* desktop */}
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>DNI</th>
                                <th>Nombre</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleClients.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className={styles.empty}>No hay clientes</td>
                                </tr>
                            ) : (
                                visibleClients.map((cliente) => (
                                    <React.Fragment key={cliente.codUsuario}>
                                        <tr>
                                            <td className={styles.code}>{cliente.codUsuario}</td>
                                            <td>{cliente.dni}</td>
                                            <td>{cliente.nombre} {cliente.apellido}</td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <button type="button" className={`${styles.btn} ${styles.btnView}`} onClick={() => toggleExpand(cliente.codUsuario)}>
                                                        {expandedClient === cliente.codUsuario ? "Ver menos" : "Ver más"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {expandedClient === cliente.codUsuario && (
                                            <tr>
                                                <td colSpan={6}>
                                                    <div className={styles.clientProfile}>
                                                        {profilesCache[cliente.codUsuario] ? (
                                                            <div className={styles.profileInner}>
                                                                <p><strong>Nombre:</strong> {profilesCache[cliente.codUsuario].nombre} {profilesCache[cliente.codUsuario].apellido}</p>
                                                                <p><strong>DNI:</strong> {profilesCache[cliente.codUsuario].dni}</p>
                                                                <p><strong>Teléfono:</strong> {profilesCache[cliente.codUsuario].telefono ?? "-"}</p>
                                                                <p><strong>Email:</strong> {profilesCache[cliente.codUsuario].email ?? "-"}</p>
                                                                <p><strong>Categoría actual:</strong> {profilesCache[cliente.codUsuario].categoriaActual?.nombreCategoria ?? "-"}</p>
                                                                <p><strong>Fecha inicio categoría:</strong> {profilesCache[cliente.codUsuario].categoriaActual?.fechaInicio ? String(profilesCache[cliente.codUsuario].categoriaActual?.fechaInicio) : "-"}</p>
                                                            </div>
                                                        ) : (
                                                            <div>Cargando perfil...</div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default IndexClients;
