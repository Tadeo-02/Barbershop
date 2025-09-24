import React, { useState } from "react"; //useEffect,
import { useNavigate } from "react-router-dom";
import styles from "./schedules.module.css";
import toast from "react-hot-toast"; //importamos libreria de alertas

// Definir el tipo Barbero
// interface Barbero {
//   codUsuario: number;
//   nombre: string;
//   apellido: string;
// }

const CreateSchedule: React.FC = () => {
  const navigate = useNavigate();
  const [codBarbero, setCodBarbero] = useState("8093abc3-8d16-11f0-8740-525400cc2535");
  const [fecha, setFecha] = useState("");
  const [horaDesde, setHoraDesde] = useState("08:00");
  const [horaHasta, setHoraHasta] = useState("17:00");
  const [estado, setEstado] = useState("disponible");
  // const [barberos, setBarberos] = useState<Barbero[]>([]);
  // const [loading, setLoading] = useState(true);

  // Cargar barberos al montar el componente
  // useEffect(() => {
  //   fetch("/usuarios")
  //     .then((res) => res.json())
  //     .then((data) => {
  //       // setBarberos(data);
  //       console.log("Barberos recibidos:", data);
  //     })
  //     .catch((error) => {
  //       console.error("Error al obtener barberos:", error);
  //       toast.error("Error al cargar los barberos");
  //     })
  //     .finally(() => {
  //       setLoading(false);
  //     });
  // }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Creando Horario...");
    try {
      console.log(
        "Enviando POST a /schedules con datos horario:",
        codBarbero,
        fecha,
        horaDesde,
        horaHasta,
        estado
      );
      const response = await fetch("/horarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codBarbero,
          fecha,
          horaDesde,
          horaHasta,
          estado,
        }),
      });
      console.log("Después de fetch, status:", response.status);

      const text = await response.text();
      console.log("Respuesta cruda del backend:", text);

      let data;
      if (text) {
        try {
          data = JSON.parse(text);
          console.log("Después de JSON.parse, data:", data);
        } catch (parseError) {
          toast.error("Error al parsear JSON:");
          throw parseError;
        }
      } else {
        toast.error("Respuesta vacía del backend");
        // alert("El servidor no devolvió respuesta.");
        return;
      }

      if (response.ok) {
        toast.success(data.message || "Horario creado exitosamente", {
          id: toastId,
        });
        setCodBarbero("8093abc3-8d16-11f0-8740-525400cc2535");
        setFecha("");
        setHoraDesde("08:00");
        setHoraHasta("20:00");
        setEstado("disponible");
        navigate("/Admin/SchedulesPage");
      } else {
        toast.error(data.message || "Error al crear horario", { id: toastId });
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      toast.error("Error de conexión con el servidor", { id: toastId });
    }
  };

  // Mostrar loading mientras cargan los barberos
  // if (loading) {
  //   return <div className={styles.loadingState}>Cargando barberos...</div>;
  // }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Crear Turno</h1>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="fecha">
            Fecha:
          </label>
          <input
            className={styles.formInput}
            type="date"
            name="fecha"
            id="fecha"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
        </div>
        {/* <div>
          <label htmlFor="codBarbero">Barbero:</label>
          <select
            className={styles.formInput}
            name="codBarbero"
            id="codBarbero"
            value={codBarbero}
            onChange={(e) => setCodBarbero(e.target.value)}
            required
          >
            <option value="">Seleccione un barbero</option>
            {barberos.map((barbero) => (
              <option key={barbero.codUsuario} value={barbero.codUsuario}>
                {barbero.apellido}, {barbero.nombre}
              </option>
            ))}
          </select>
        </div> */}
        <button
          className={`${styles.button} ${styles.buttonSuccess}`}
          type="submit"
        >
          Guardar Turno
        </button>
      </form>
    </div>
  );
};

export default CreateSchedule;
