import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./receiptViewer.module.css";
import toast from "react-hot-toast";

const ReceiptViewer: React.FC = () => {
  const { codTurno } = useParams<{ codTurno: string }>();
  const navigate = useNavigate();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voucherType, setVoucherType] = useState<string | null>(null);
  const [voucherNumber, setVoucherNumber] = useState<string | null>(null);
  const [cae, setCae] = useState<string | null>(null);

  useEffect(() => {
    if (!codTurno) {
      setError("Código de turno no proporcionado");
      setLoading(false);
      return;
    }

    let blobUrl: string | null = null;

    const fetchPdf = async () => {
      try {
        const response = await fetch(`/facturacion/recibo/${codTurno}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.message ||
              `Error al obtener el recibo (${response.status})`,
          );
        }

        // Read billing metadata from headers
        setVoucherType(response.headers.get("X-Voucher-Type"));
        setVoucherNumber(response.headers.get("X-Voucher-Number"));
        setCae(response.headers.get("X-CAE"));

        const blob = await response.blob();
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

    fetchPdf();

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
          <h2 className={styles.title}>{voucherType || "Recibo de Pago"}</h2>
          {voucherNumber && (
            <span className={styles.voucherInfo}>N° {voucherNumber}</span>
          )}
          {cae && <span className={styles.voucherInfo}>CAE: {cae}</span>}
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
