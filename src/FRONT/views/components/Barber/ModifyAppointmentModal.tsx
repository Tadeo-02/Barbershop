import React, { useState, useEffect } from "react";
import barberStyles from "../Client/appointmentsByBarber.module.css";

interface Appointment {
  id: string;
  fecha: string;
  hora: string;
  codBarbero: string;
  barberNombre?: string;
  barberApellido?: string;
  codCliente: string;
  clienteNombre?: string;
  clienteApellido?: string;
  fechaTurno?: string;
  horaDesde?: string;
  horaHasta?: string;
}

interface ModifyAppointmentModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (modifiedAppointment: Appointment) => void;
}

const ModifyAppointmentModal: React.FC<ModifyAppointmentModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    fecha: "",
    hora: "",
  });

  // Cuando se abre el modal, cargar los datos del turno
  useEffect(() => {
    if (appointment) {
      setFormData({
        fecha: appointment.fecha || "",
        hora: appointment.hora || "",
      });
    }
  }, [appointment]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    if (!appointment) return;

    const modifiedAppointment: Appointment = {
      ...appointment,
      fecha: formData.fecha,
      hora: formData.hora,
      fechaTurno: formData.fecha,
      horaDesde: formData.hora,
      horaHasta: formData.hora, // Simplificado por ahora
    };

    onSave(modifiedAppointment);
    onClose();
  };

  const horarios = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
  ];

  if (!isOpen || !appointment) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 12,
          minWidth: 400,
          maxWidth: "90vw",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{ margin: "0 0 20px 0", color: "#2d3748", fontSize: "1.3rem" }}
        >
          Modificar Turno
        </h3>

        <div style={{ marginBottom: 16 }}>
          <strong>Cliente:</strong> {appointment.clienteNombre}{" "}
          {appointment.clienteApellido}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
            Fecha:
          </label>
          <input
            type="date"
            name="fecha"
            value={formData.fecha}
            onChange={handleInputChange}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "2px solid #e2e8f0",
              borderRadius: "6px",
              fontSize: "0.95rem",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>
            Hora:
          </label>
          <select
            name="hora"
            value={formData.hora}
            onChange={handleInputChange}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "2px solid #e2e8f0",
              borderRadius: "6px",
              fontSize: "0.95rem",
              boxSizing: "border-box",
            }}
          >
            <option value="">Seleccionar hora</option>
            {horarios.map((hora) => (
              <option key={hora} value={hora}>
                {hora}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            className={barberStyles.pageButton}
            onClick={onClose}
            style={{
              background: "#e2e8f0",
              color: "#4a5568",
              padding: "10px 20px",
              borderRadius: "6px",
            }}
          >
            Cancelar
          </button>
          <button
            className={barberStyles.pageButton}
            onClick={handleSave}
            style={{
              background: "#38a169",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "6px",
            }}
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModifyAppointmentModal;
