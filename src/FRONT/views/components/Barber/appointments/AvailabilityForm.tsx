import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import listStyles from "./barberAppointments.module.css";
import styles from "./barberAvailability.module.css";

export interface AvailabilityFormValues {
  desdeFecha: string;
  desdeHora: string;
  hastaFecha: string;
  hastaHora: string;
  motivo: string;
}

interface AvailabilityFormProps {
  initialValues?: Partial<AvailabilityFormValues>;
  onSubmit: (values: AvailabilityFormValues) => void | Promise<void>;
  submitLabel?: string;
  submitClassName?: string;
  disabled?: boolean;
  idPrefix?: string;
  resetKey?: number;
  confirmTitle?: string;
  confirmMessage?: string;
  confirmConfirmLabel?: string;
  confirmCancelLabel?: string;
}

const defaultValues: AvailabilityFormValues = {
  desdeFecha: "",
  desdeHora: "",
  hastaFecha: "",
  hastaHora: "",
  motivo: "",
};

const AvailabilityForm: React.FC<AvailabilityFormProps> = ({
  initialValues,
  onSubmit,
  submitLabel = "Registrar Ausencia",
  submitClassName,
  disabled = false,
  idPrefix = "availability",
  resetKey = 0,
  confirmTitle = "Confirmar ausencia",
  confirmMessage = "Estas seguro de que deseas continuar? Todos los turnos registrados entre esas fechas seran cancelados.",
  confirmConfirmLabel = "Continuar",
  confirmCancelLabel = "Cancelar",
}) => {
  const [values, setValues] = useState<AvailabilityFormValues>({
    ...defaultValues,
    ...initialValues,
  });

  useEffect(() => {
    setValues({
      ...defaultValues,
      ...initialValues,
    });
  }, [
    resetKey,
    initialValues?.desdeFecha,
    initialValues?.desdeHora,
    initialValues?.hastaFecha,
    initialValues?.hastaHora,
    initialValues?.motivo,
  ]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (disabled) return;

    const { desdeFecha, desdeHora, hastaFecha, hastaHora, motivo } = values;

    if (!desdeFecha || !desdeHora || !hastaFecha || !hastaHora) {
      toast.error("Completa fecha y hora");
      return;
    }

    const motivoTrimmed = motivo.trim();
    if (!motivoTrimmed) {
      toast.error("El motivo es requerido");
      return;
    }

    if (motivoTrimmed.length > 250) {
      toast.error("El motivo no puede superar 250 caracteres");
      return;
    }

    const fechaDesde = new Date(`${desdeFecha}T${desdeHora}:00Z`);
    const fechaHasta = new Date(`${hastaFecha}T${hastaHora}:00Z`);

    if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
      toast.error("Fecha u hora invalida");
      return;
    }

    if (fechaDesde >= fechaHasta) {
      toast.error("La fecha/hora Desde debe ser anterior a Hasta");
      return;
    }

    if (fechaHasta.getTime() < Date.now()) {
      toast.error("La fecha/hora Hasta no puede estar en el pasado");
      return;
    }

    const shouldContinue = await new Promise<boolean>((resolve) => {
      toast(
        (t) => (
          <div className={listStyles.modalContainer}>
            <p className={listStyles.modalTitle}>{confirmTitle}</p>
            <p style={{ margin: "0 0 16px 0", color: "white" }}>
              {confirmMessage}
            </p>
            <div className={listStyles.modalButtons}>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className={listStyles.buttonCancel}
              >
                {confirmCancelLabel}
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className={listStyles.buttonConfirm}
              >
                {confirmConfirmLabel}
              </button>
            </div>
          </div>
        ),
        {
          duration: Infinity,
          style: {
            minWidth: "350px",
            padding: "24px",
          },
        },
      );
    });

    if (!shouldContinue) return;

    await onSubmit({
      ...values,
      motivo: motivoTrimmed,
    });
  };

  const submitClassNameResolved = submitClassName || styles.submitButton;
  const desdeFechaId = `${idPrefix}-desde-fecha`;
  const desdeHoraId = `${idPrefix}-desde-hora`;
  const hastaFechaId = `${idPrefix}-hasta-fecha`;
  const hastaHoraId = `${idPrefix}-hasta-hora`;
  const motivoId = `${idPrefix}-motivo`;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <fieldset disabled={disabled}>
        <div className={styles.rangeSection}>
          <h2 className={styles.sectionTitle}>Desde</h2>
          <div className={styles.fieldsRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor={desdeFechaId}>
                Fecha
              </label>
              <input
                id={desdeFechaId}
                name="desdeFecha"
                type="date"
                className={styles.input}
                value={values.desdeFecha}
                max={values.hastaFecha || undefined}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor={desdeHoraId}>
                Hora
              </label>
              <input
                id={desdeHoraId}
                name="desdeHora"
                type="time"
                className={styles.input}
                value={values.desdeHora}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>
        <br />
        <div className={styles.rangeSection}>
          <h2 className={styles.sectionTitle}>Hasta</h2>
          <div className={styles.fieldsRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor={hastaFechaId}>
                Fecha
              </label>
              <input
                id={hastaFechaId}
                name="hastaFecha"
                type="date"
                className={styles.input}
                value={values.hastaFecha}
                min={values.desdeFecha || undefined}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor={hastaHoraId}>
                Hora
              </label>
              <input
                id={hastaHoraId}
                name="hastaHora"
                type="time"
                className={styles.input}
                value={values.hastaHora}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>
        <br />
        <hr className={styles.divider} />
        <br />  
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor={motivoId}>
            Motivo
          </label>
          <textarea
            id={motivoId}
            name="motivo"
            className={styles.textarea}
            placeholder="Ej: Vacaciones"
            value={values.motivo}
            onChange={handleChange}
            required
            maxLength={250}
          />
        </div>
        <br />
        <button type="submit" className={submitClassNameResolved}>
          {submitLabel}
        </button>
      </fieldset>
    </form>
  );
};

export default AvailabilityForm;
