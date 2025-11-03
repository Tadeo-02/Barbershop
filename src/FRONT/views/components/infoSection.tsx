import React, { useEffect, useState } from "react";
import styles from "./infoSection.module.css";
import toast from "react-hot-toast";

interface Sucursal {
    codSucursal: string;
    nombre: string;
    calle: string;
    altura: number;
}

interface Barbero {
    codUsuario?: string;
    id?: string;
    nombre: string;
    apellido?: string;
    telefono?: string;
    sucursalCod?: string;
}

const InfoSection: React.FC = () => {
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [loadingSucursales, setLoadingSucursales] = useState(true);

    const [barberos, setBarberos] = useState<Barbero[]>([]);
    const [loadingBarberos, setLoadingBarberos] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Cargar barberos y sucursales en paralelo
                const [barberosResponse, sucursalesResponse] = await Promise.all([
                    fetch("/usuarios?type=barber"),
                    fetch("/sucursales"),
                ]);

                if (barberosResponse.ok) {
                    const barberosData = await barberosResponse.json();
                    // Puede venir directamente el array o en data
                    const list = Array.isArray(barberosData)
                        ? barberosData
                        : barberosData?.data || [];
                    setBarberos(list);
                    console.log("Barberos recibidos:", barberosData);
                } else {
                toast.error("Error al cargar los barberos");
                }

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
                setLoadingBarberos(false);
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
                        {sucursales.map((sucursal) => (
                            <div key={sucursal.codSucursal} className={styles.sucursalContainer}>
                                <h3>{sucursal.nombre}</h3>
                                <p className={styles.sucursalInfo}>Dirección: {sucursal.calle}{sucursal.altura ? `, ${sucursal.altura}` : ''}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.infoSection}>
                <h2 className={styles.infoSectionTitle}>Barberos</h2>
                <p className={styles.infoSectionContent}>Descubrí a nuestros barberos.</p>
                {loadingBarberos ? (
                    <div className={styles.loadingState}>Cargando barberos...</div>
                ) : barberos.length === 0 ? (
                    <div className={styles.emptyState}>No hay barberos disponibles.</div>
                ) : (
                    <div className={styles.cardsGrid}>
                        {barberos.map((barbero, idx) => (
                            <div key={barbero.codUsuario ?? barbero.id ?? idx} className={styles.barberoContainer}>
                                <h3>{barbero.nombre} {barbero.apellido ?? ''}</h3>
                                <p className={styles.barberoInfo}>Teléfono: {barbero.telefono}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InfoSection;