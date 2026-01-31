import React, { useEffect, useState, useMemo } from "react";
import styles from "./infoSection.module.css";
import toast from "react-hot-toast";
import { z } from "zod";
import { BranchWithIdSchema } from "../../../BACK/Schemas/branchesSchema";

// Infer the TypeScript type from the schema
//! Validacion frontend con schema zod
type Sucursal = z.infer<typeof BranchWithIdSchema>;

const InfoSection: React.FC = () => {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loadingSucursales, setLoadingSucursales] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar sucursales
        const [sucursalesResponse] = await Promise.all([fetch("/sucursales")]);

        if (sucursalesResponse.ok) {
          const sucursalesData = await sucursalesResponse.json();
          const list = Array.isArray(sucursalesData)
            ? sucursalesData
            : sucursalesData?.data || [];

          // Validate each sucursal against the schema
          //! Parsing es otra validacion frontend de la libreria zod
          const validatedSucursales: Sucursal[] = [];
          for (const sucursal of list) {
            try {
              const validated = BranchWithIdSchema.parse(sucursal); 
              validatedSucursales.push(validated);
            } catch (validationError) {
              console.error(
                "Invalid sucursal data:",
                sucursal,
                validationError,
              );
              // Skip invalid entries but don't fail the entire operation
            }
          }

          setSucursales(validatedSucursales);
          console.log("Sucursales recibidas:", validatedSucursales);
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

  // Memoize the cards rendering to avoid unnecessary re-renders
  const sucursalesCards = useMemo(() => {
    return sucursales.map((sucursal) => {
      const address =
        `${sucursal.calle}${sucursal.altura ? " " + sucursal.altura : ""}`.trim();
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

      return (
        <div key={sucursal.codSucursal} className={styles.sucursalContainer}>
          <a
            className={styles.sucursalLink}
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3>{sucursal.nombre}</h3>
            <p className={styles.sucursalInfo}>
              Dirección: {sucursal.calle}
              {sucursal.altura ? `, ${sucursal.altura}` : ""}
            </p>
          </a>
        </div>
      );
    });
  }, [sucursales]);

  return (
    <div>
      <div className={styles.infoSection}>
        <h2 className={styles.infoSectionTitle}>Sucursales</h2>
        <p className={styles.infoSectionContent}>Elegí tu sucursal favorita.</p>

        {loadingSucursales ? (
          <div className={styles.loadingState}>Cargando sucursales...</div>
        ) : sucursales.length === 0 ? (
          <div className={styles.emptyState}>
            No hay sucursales disponibles.
          </div>
        ) : (
          <div className={styles.cardsGrid}>{sucursalesCards}</div>
        )}
      </div>
    </div>
  );
};

export default InfoSection;
