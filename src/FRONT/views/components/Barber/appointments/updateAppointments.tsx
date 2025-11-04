import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./endAppointments.module.css";
import { useAuth } from "../../login/AuthContext.tsx";

interface TurnoRaw {
  codTurno: string;
  fechaTurno: string;
  codBarbero: string;
  codCliente: string;
  // may include related objects depending on backend
  usuarios_turnos_codClienteTousuarios?: {
    codUsuario: string;
    nombre?: string;
    apellido?: string;
    dni?: string;
  } | null;
}

interface Turno extends TurnoRaw {
  clienteNombre?: string;
  clienteDni?: string;
  estado?: string;
  metodoPago?: string;
  codCorte?: string;
  nombreCorte?: string;
}

// Generador de turnos ficticios para testing/preview
const createMockTurnos = (codBarbero: string, count = 6): Turno[] => {
  const mockNames = [
    { nombre: "Carlos", apellido: "González", dni: "12345678" },
    { nombre: "María", apellido: "Pérez", dni: "23456789" },
    { nombre: "Lucía", apellido: "Ramírez", dni: "34567890" },
    { nombre: "Pedro", apellido: "López", dni: "45678901" },
    { nombre: "Ana", apellido: "García", dni: "56789012" },
    { nombre: "José", apellido: "Fernández", dni: "67890123" },
  ];

  const today = new Date();
  const turnos: Turno[] = [];

  for (let i = 0; i < count; i++) {
    const fecha = new Date(today);
    fecha.setDate(today.getDate() + Math.floor(i / 3)); // algunos en distintos días
    const cliente = mockNames[i % mockNames.length];

    turnos.push({
      codTurno: `mock-${codBarbero}-${i}`,
      fechaTurno: fecha.toISOString(),
      codBarbero,
      codCliente: `mock-cliente-${i}`,
      usuarios_turnos_codClienteTousuarios: {
        codUsuario: `mock-cliente-${i}`,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        dni: cliente.dni,
      },
      clienteNombre: `${cliente.nombre} ${cliente.apellido}`,
      clienteDni: cliente.dni,
    });
  }

  return turnos;
};

const IndexAppointments = () => {
  const { user } = useAuth();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<Turno>>>({});

  const tiposCorte = [
    { codCorte: "corte-1", nombreCorte: "Corte clásico" },
    { codCorte: "corte-2", nombreCorte: "Degradado" },
    { codCorte: "corte-3", nombreCorte: "Barba" },
  ];
  const metodosPago = ["Efectivo", "Tarjeta", "MercadoPago", "Transferencia"];
  const estados = ["Pendiente", "Confirmado", "Completado", "Cancelado"];

  // Usar siempre datos ficticios (sin fetch al backend)
  useEffect(() => {
    const key = `mock_turnos_${user?.codUsuario || "mock"}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setTurnos(JSON.parse(saved));
        return;
      } catch {}
    }

    const mock = createMockTurnos(user?.codUsuario || "mock-barbero", 8);
    setTurnos(mock);
    localStorage.setItem(key, JSON.stringify(mock));
  }, [user]);

  // helpers para edición local
  const startEdit = (t: Turno) => {
    setEditingId(t.codTurno);
    setDrafts((d) => ({
      ...d,
      [t.codTurno]: {
        estado: t.estado || estados[0],
        metodoPago: t.metodoPago || metodosPago[0],
        codCorte: t.codCorte || tiposCorte[0].codCorte,
        nombreCorte: t.nombreCorte || tiposCorte[0].nombreCorte,
      },
    }));
  };

  const changeDraft = (codTurno: string, field: keyof Turno, value: any) => {
    setDrafts((d) => ({
      ...d,
      [codTurno]: { ...(d[codTurno] || {}), [field]: value },
    }));
  };

  const cancelEdit = (codTurno: string) => {
    setEditingId(null);
    setDrafts((d) => {
      const next = { ...d };
      delete next[codTurno];
      return next;
    });
  };

  const saveEdit = (codTurno: string) => {
    const draft = drafts[codTurno];
    if (!draft) return;
    setTurnos((prev) => {
      const next = prev.map((t) =>
        t.codTurno === codTurno ? { ...t, ...draft } : t
      );
      try {
        const key = `mock_turnos_${user?.codUsuario || "mock"}`;
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      return next;
    });
    cancelEdit(codTurno);
  };

  const filtered = useMemo(() => {
    if (!query) return turnos;
    const q = query.toLowerCase();
    return turnos.filter((t) => {
      const cod = String(t.codTurno || "").toLowerCase();
      const nombre = String(t.clienteNombre || "").toLowerCase();
      const dni = String(
        t.clienteDni || t.usuarios_turnos_codClienteTousuarios?.dni || ""
      ).toLowerCase();
      return cod.includes(q) || nombre.includes(q) || dni.includes(q);
    });
  }, [query, turnos]);

  return (
    <div className={styles.indexAppointments}>
      <h2>Mis Turnos</h2>

      <div style={{ marginBottom: 12 }}>
        <input
          className={styles.searchInput}
          placeholder="Buscar por código, nombre o DNI"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay turnos disponibles.</p>
        </div>
      ) : (
        <ul>
          {filtered.map((turno) => {
            const isEditing = editingId === turno.codTurno;
            const draft = drafts[turno.codTurno] || {};
            return (
              <li key={turno.codTurno}>
                <div className={styles.appointmentInfo}>
                  <div className={styles.appointmentTitle}>
                    Turno #{turno.codTurno}
                  </div>
                  <div className={styles.appointmentCode}>
                    Código: {turno.codTurno}
                  </div>
                  <div className={styles.appointmentDetails}>
                    <span className={styles.appointmentDate}>
                      Fecha: {new Date(turno.fechaTurno).toLocaleDateString()}
                    </span>
                    {turno.clienteNombre && (
                      <div>Cliente: {turno.clienteNombre}</div>
                    )}
                    {turno.clienteDni && <div>DNI: {turno.clienteDni}</div>}
                    {turno.estado && <div>Estado: {turno.estado}</div>}
                    {turno.metodoPago && <div>Método: {turno.metodoPago}</div>}
                    {turno.nombreCorte && <div>Corte: {turno.nombreCorte}</div>}
                  </div>
                </div>
                <div className={styles.actionButtons}>
                  {!isEditing ? (
                    <>
                      <button
                        className={`${styles.button} ${styles.buttonPrimary}`}
                        onClick={() => startEdit(turno)}
                      >
                        Editar
                      </button>
                      <Link
                        to={`/appointments/${turno.codTurno}`}
                        className={`${styles.button} ${styles.buttonPrimary}`}
                      >
                        Ver Detalles
                      </Link>
                    </>
                  ) : (
                    <div className={styles.editControls}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          width: "100%",
                        }}
                      >
                        <select
                          className={styles.editSelect}
                          value={String(draft.estado || "")}
                          onChange={(e) =>
                            changeDraft(
                              turno.codTurno,
                              "estado",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Seleccionar estado</option>
                          {estados.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>

                        <select
                          className={styles.editSelect}
                          value={String(draft.metodoPago || "")}
                          onChange={(e) =>
                            changeDraft(
                              turno.codTurno,
                              "metodoPago",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Seleccionar método</option>
                          {metodosPago.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>

                        <select
                          className={styles.editSelect}
                          value={String(draft.codCorte || "")}
                          onChange={(e) => {
                            const sel = tiposCorte.find(
                              (tc) => tc.codCorte === e.target.value
                            );
                            changeDraft(
                              turno.codTurno,
                              "codCorte",
                              e.target.value
                            );
                            changeDraft(
                              turno.codTurno,
                              "nombreCorte",
                              sel?.nombreCorte || ""
                            );
                          }}
                        >
                          <option value="">Seleccionar corte</option>
                          {tiposCorte.map((tc) => (
                            <option key={tc.codCorte} value={tc.codCorte}>
                              {tc.nombreCorte}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.actionButtons}>
                        <button
                          className={`${styles.button} ${styles.buttonSuccess}`}
                          onClick={() => saveEdit(turno.codTurno)}
                        >
                          Guardar
                        </button>
                        <button
                          className={`${styles.button} ${styles.buttonDanger}`}
                          onClick={() => cancelEdit(turno.codTurno)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default IndexAppointments;
