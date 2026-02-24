import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./receiptViewer.module.css";
import toast from "react-hot-toast";

interface BillingData {
  codTurno: string;
  estado: string;
  precioTurno: number | null;
  metodoPago: string | null;
  servicio: string;
  facturado: boolean;
  cae: string | null;
  caeFchVto: string | null;
  voucherNumber: number | null;
  voucherNumberFormatted: string | null;
  tipoComprobante: number | null;
  voucherType: string | null;
  puntoDeVenta: number;
}

const ReceiptViewer: React.FC = () => {
  const { codTurno } = useParams<{ codTurno: string }>();
  const navigate = useNavigate();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingData, setBillingData] = useState<BillingData | null>(null);

  useEffect(() => {
    if (!codTurno) {
      setError("Código de turno no proporcionado");
      setLoading(false);
      return;
    }

    let blobUrl: string | null = null;

    const fetchData = async () => {
      try {
        // 1. Obtener datos de facturación desde la DB
        const metaResponse = await fetch(
          `/facturacion/datos-turno/${codTurno}`,
        );
        if (!metaResponse.ok) {
          const errorData = await metaResponse.json().catch(() => null);
          throw new Error(
            errorData?.message ||
              `Error al obtener datos de facturación (${metaResponse.status})`,
          );
        }
        const metaJson = await metaResponse.json();
        setBillingData(metaJson.data);

        // 2. Obtener el PDF
        const pdfResponse = await fetch(`/facturacion/recibo/${codTurno}`);
        if (!pdfResponse.ok) {
          const errorData = await pdfResponse.json().catch(() => null);
          throw new Error(
            errorData?.message ||
              `Error al obtener el recibo (${pdfResponse.status})`,
          );
        }

        const blob = await pdfResponse.blob();
        blobUrl = URL.createObjectURL(blob);
        setPdfUrl(blobUrl);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error desconocido";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [codTurno]);

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `recibo_${codTurno}.pdf`;
    link.click();
  };

  const handleBack = () => {
    navigate("/client/appointments");
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <p>Cargando recibo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>{error}</p>
          <button className={styles.backButton} onClick={handleBack}>
            Volver a mis turnos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button className={styles.backButton} onClick={handleBack}>
          ← Volver
        </button>
        <div className={styles.titleBlock}>
          <h2 className={styles.title}>
            {billingData?.voucherType || "Recibo de Pago"}
          </h2>
          {billingData?.voucherNumberFormatted && (
            <span className={styles.voucherInfo}>
              N° {billingData.voucherNumberFormatted}
            </span>
          )}
          {billingData?.cae && (
            <span className={styles.voucherInfo}>CAE: {billingData.cae}</span>
          )}
          {billingData?.caeFchVto && (
            <span className={styles.voucherInfo}>
              Vto. CAE: {billingData.caeFchVto}
            </span>
          )}
          {billingData?.servicio && (
            <span className={styles.voucherInfo}>
              Servicio: {billingData.servicio}
            </span>
          )}
        </div>
        <button className={styles.downloadButton} onClick={handleDownload}>
          Descargar PDF
        </button>
      </div>
      <div className={styles.pdfWrapper}>
        {pdfUrl && (
          <iframe
            src={pdfUrl}
            className={styles.pdfFrame}
            title="Recibo de pago"
          />
        )}
      </div>
    </div>
  );
};

export default ReceiptViewer;
