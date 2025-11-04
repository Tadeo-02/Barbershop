import React, { useEffect, useState } from "react";
import styles from "./infoSection.module.css";
import toast from "react-hot-toast";

interface Sucursal {
    codSucursal: string;
    nombre: string;
    calle: string;
    altura: number;
}


const InfoSection: React.FC = () => {
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [loadingSucursales, setLoadingSucursales] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Cargar sucursales
                const  [sucursalesResponse] = await Promise.all([
                    fetch("/sucursales"),
                ]);

                if (sucursalesResponse.ok) {
                    const sucursalesData = await sucursalesResponse.json();
                    const list = Array.isArray(sucursalesData)
                        ? sucursalesData
                        : sucursalesData?.data || [];
                    setSucursales(list);
                    console.log("Sucursales recibidas:", sucursalesData);
                } else {
                toast.error("Error al cargar las sucursales");
                }
            } catch (error) {
                console.error("Error al obtener datos:", error);
                toast.error("Error al cargar los datos");
            } finally {
                setLoadingSucursales(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            <div className={styles.infoSection}>
                <h2 className={styles.infoSectionTitle}>Sucursales</h2>
                <p className={styles.infoSectionContent}>Elegí tu sucursal favorita.</p>

                {loadingSucursales ? (
                    <div className={styles.loadingState}>Cargando sucursales...</div>
                ) : sucursales.length === 0 ? (
                    <div className={styles.emptyState}>No hay sucursales disponibles.</div>
                ) : (
                    <div className={styles.cardsGrid}>
                        {sucursales.map((sucursal) => {
                            const address = `${sucursal.calle}${sucursal.altura ? ' ' + sucursal.altura : ''}`.trim();
                            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

                            return (
                                <div key={sucursal.codSucursal} className={styles.sucursalContainer}>
                                    <a className={styles.sucursalLink} href={mapsUrl} target="_blank" rel="noopener noreferrer">
                                        <h3>{sucursal.nombre}</h3>
                                        <p className={styles.sucursalInfo}>Dirección: {sucursal.calle}{sucursal.altura ? `, ${sucursal.altura}` : ''}</p>
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InfoSection;