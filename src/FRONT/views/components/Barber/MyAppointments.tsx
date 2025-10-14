import React, { useState, useEffect } from "react";
import { useAuth } from "../login/AuthContext";
import barberStyles from "../Client/appointmentsByBarber.module.css";
import ModifyAppointmentModal from "./ModifyAppointmentModal";

const MyAppointments: React.FC = () => {
  const auth = useAuth();
  const { reservations, removeReservation, addReservation, user } = auth;
  const [toCancel, setToCancel] = useState<any | null>(null);
  const [toModify, setToModify] = useState<any | null>(null);

  // Crear turnos donde YO soy el barbero que atiende a clientes
  useEffect(() => {
    if (user) {
      // Buscar si ya tengo turnos como barbero
      const myBarberAppointments =
        reservations?.filter((r) => r.codBarbero === user.codUsuario) || [];

      // Limpiar turnos antiguos que no tienen email/telefono o tienen IDs viejos
      const needsUpdate = myBarberAppointments.some(
        (r) =>
          !r.clienteEmail ||
          !r.clienteTelefono ||
          r.id.includes("turno-barbero")
      );

      if (myBarberAppointments.length === 0 || needsUpdate) {
        // Limpiar turnos antiguos primero
        myBarberAppointments.forEach((appointment) => {
          removeReservation(appointment.id);
        });
        const sampleAppointments = [
          {
            id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            fecha: "2025-10-15",
            hora: "09:00",
            codBarbero: user.codUsuario,
            barberNombre: user.nombre,
            barberApellido: user.apellido,
            codCliente: "cliente-001",
            clienteNombre: "Juan",
            clienteApellido: "Pérez",
            clienteEmail: "juan.perez@gmail.com",
            clienteTelefono: "+54 9 341 5123456",
            tipoCorte: "Corte clásico",
            precioTurno: 2500,
            fechaTurno: "2025-10-15",
            horaDesde: "09:00",
            horaHasta: "09:30",
          },
          {
            id: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
            fecha: "2025-10-15",
            hora: "14:30",
            codBarbero: user.codUsuario,
            barberNombre: user.nombre,
            barberApellido: user.apellido,
            codCliente: "cliente-002",
            clienteNombre: "María",
            clienteApellido: "González",
            clienteEmail: "maria.gonzalez@hotmail.com",
            clienteTelefono: "+54 9 341 7891234",
            codCorte: "corte-002",
            tipoCorte: "Corte con barba",
            precioTurno: 3200,
            fechaTurno: "2025-10-15",
            horaDesde: "14:30",
            horaHasta: "15:00",
          },
          {
            id: "c3d4e5f6-g7h8-9012-cdef-345678901234",
            fecha: "2025-10-16",
            hora: "11:00",
            codBarbero: user.codUsuario,
            barberNombre: user.nombre,
            barberApellido: user.apellido,
            codCliente: "cliente-003",
            clienteNombre: "Carlos",
            clienteApellido: "López",
            clienteEmail: "carlos.lopez@outlook.com",
            clienteTelefono: "+54 9 341 2567890",
            tipoCorte: "Corte degradado",
            precioTurno: 2800,
            fechaTurno: "2025-10-16",
            horaDesde: "11:00",
            horaHasta: "11:30",
          },
        ];

        sampleAppointments.forEach((appointment) => {
          addReservation(appointment);
        });
      }
    }
  }, [reservations, user, addReservation, removeReservation]);

  if (!reservations || reservations.length === 0) {
    return (
      <div className={barberStyles.appointmentsContainer}>
        <div className={barberStyles.emptyState}>
          <p>No tenés turnos pendientes.</p>
        </div>
      </div>
    );
  }

  // Filtrar solo los turnos donde el usuario actual es el barbero
  const barberAppointments = reservations.filter(
    (r) => r.codBarbero === user?.codUsuario
  );

  // defensive: deduplicate reservations by id
  const deduped = [];
  const seen = new Set<string>();
  for (const r of barberAppointments) {
    try {
      const key =
        r && r.id ? `id:${r.id}` : `k:${r.fecha}|${r.hora}|${r.codBarbero}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(r);
    } catch {
      deduped.push(r);
    }
  }

  const confirmCancel = () => {
    if (!toCancel) return;
    removeReservation(toCancel.id);
    setToCancel(null);
  };

  const handleModifyAppointment = (modifiedAppointment: any) => {
    // Remover el turno original
    removeReservation(toModify.id);
    // Agregar el turno modificado
    addReservation(modifiedAppointment);
    setToModify(null);
  };

  // Debug: ver qué datos tenemos
  console.log("Turnos filtrados:", deduped);

  return (
    <div className={barberStyles.appointmentsContainer}>
      <h2>Mis turnos pendientes</h2>
      <div className={barberStyles.appointmentList}>
        {deduped.map((r) => (
          <div key={r.id} className={barberStyles.appointmentItem}>
            <div
              style={{
                marginTop: 6,
                color: "#4a5568",
                fontSize: "0.85rem",
                fontStyle: "italic",
              }}
            >
              Código Turno: {r.id}
            </div>
            <div className={barberStyles.appointmentDate}>
              {r.fecha} - {r.hora}
            </div>
            <div className={barberStyles.appointmentHour}>
              Cliente:{" "}
              {r.clienteNombre && r.clienteApellido
                ? `${r.clienteNombre} ${r.clienteApellido}`
                : r.codCliente || "Cliente sin nombre"}
            </div>

            {r.clienteEmail && (
              <div style={{ marginTop: 4, color: "#666", fontSize: "0.9rem" }}>
                Email: {r.clienteEmail}
              </div>
            )}

            {r.clienteTelefono && (
              <div style={{ marginTop: 4, color: "#666", fontSize: "0.9rem" }}>
                Teléfono: {r.clienteTelefono}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                className={barberStyles.pageButton}
                onClick={() => setToModify(r)}
                style={{ background: "#38a169", color: "#fff" }}
              >
                Modificar
              </button>
              <button
                className={barberStyles.pageButton}
                onClick={() => setToCancel(r)}
              >
                Cancelar
              </button>
            </div>
          </div>
        ))}
      </div>

      {toCancel && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
          onClick={() => setToCancel(null)}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 8,
              minWidth: 300,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Confirmar cancelación</h3>
            <p>
              ¿Estás seguro que querés cancelar el turno del {toCancel.fecha} a
              las {toCancel.hora} con {toCancel.clienteNombre}{" "}
              {toCancel.clienteApellido}?
            </p>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 12,
              }}
            >
              <button
                className={barberStyles.pageButton}
                onClick={() => setToCancel(null)}
              >
                Cerrar
              </button>
              <button
                className={barberStyles.pageButton}
                onClick={confirmCancel}
                style={{ background: "#e53e3e", color: "#fff" }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <ModifyAppointmentModal
        appointment={toModify}
        isOpen={!!toModify}
        onClose={() => setToModify(null)}
        onSave={handleModifyAppointment}
      />
    </div>
  );
};

export default MyAppointments;
