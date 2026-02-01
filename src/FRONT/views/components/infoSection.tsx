import React, { useEffect, useState, useMemo } from "react";
import styles from "./infoSection.module.css";
import toast from "react-hot-toast";
import { z } from "zod";
import { BranchWithIdSchema } from "../../../BACK/Schemas/branchesSchema";

/*
1) Schema Zod (BranchWithIdSchema); validación del contrato de datos entre backend y frontend,
   evita que datos mal formados rompan la UI y mantiene integridad de datos en tiempo de ejecución.
2) z.infer<typeof BranchWithIdSchema>; tipado fuerte a partir del schema,
   evita desync entre tipos de TypeScript y la validación real de los datos.
3) Validación individual por item (parse por sucursal);
   permite descartar entradas inválidas sin fallar toda la operación (fail-soft UI).
4) Manejo de errores de validación con logging;
   mejora la observabilidad de errores y facilita detectar inconsistencias del backend.
5) Fallback seguro de respuesta (Array.isArray || response.data);
   previene crashes si el backend cambia la forma del payload.
6) useState separado (sucursales / loadingSucursales);
   permite estados claros: loading, empty y success, mejorando la UX y la mantenibilidad.
7) useEffect con fetch único;
   carga controlada de datos al montar el componente, sin efectos secundarios innecesarios.
8) useMemo para renderizado de tarjetas;
   evita re-renders innecesarios y deja explícita la dependencia del render en el estado sucursales.
9) Estados de UI explícitos (loading / empty / success);
   previene estados inconsistentes y mejora la experiencia del usuario ante fallos o datos vacíos.
10) Componente read-only (sin mutaciones);
    reduce superficie de errores, elimina problemas de concurrencia y no requiere locks de frontend.
*/


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
