import { useEffect, useState } from "react";
import { FaCut, FaRegClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/login/AuthContext.tsx";
import styles from "./HomePageBarber.module.css";

interface Appointment {
  codTurno: string;
  fechaTurno: string;
  horaDesde: string;
  horaHasta: string;
  estado: string;
  usuarios_turnos_codClienteTousuarios?: {
    nombre: string;
    apellido: string;
  };
  usuarios_turnos_codBarberoTousuarios?: {
    nombre: string;
    apellido: string;
    sucursales?: {
      nombre: string;
      calle: string;
      altura: number;
    } | null;
  };
}

const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userType, user } = useAuth();
  const [nextTurno, setNextTurno] = useState<Appointment | null>(null);
  const [loadingNextTurno, setLoadingNextTurno] = useState(false);
  const [hasCheckedNextTurno, setHasCheckedNextTurno] = useState(false);

  const greetingName = user?.nombre?.trim();
  const greeting = greetingName ? `Hola, ${greetingName}!` : "Hola!";

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!isAuthenticated && !savedUser) {
      navigate("/login");
      return;
    }

    if (isAuthenticated && userType && userType !== "barber") {
      navigate("/");
    }
  }, [isAuthenticated, userType, navigate]);

  useEffect(() => {
    if (!user?.codUsuario) {
      setNextTurno(null);
      setLoadingNextTurno(false);
      setHasCheckedNextTurno(true);
      return;
    }

    const controller = new AbortController();
    setHasCheckedNextTurno(false);
    setLoadingNextTurno(true);

    fetch(`/turnos/user/${user.codUsuario}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        let turnosArray: Appointment[] = [];

        if (data && data.success && Array.isArray(data.data)) {
          turnosArray = data.data;
        } else if (Array.isArray(data)) {
          turnosArray = data;
        }

        const now = new Date();
        const upcoming = turnosArray
          .map((turno) => {
            const datePart = turno.fechaTurno.split("T")[0];
            const [year, month, day] = datePart
              .split("-")
              .map((value) => Number(value));
            const startTime = new Date(turno.horaDesde);

            if (!year || !month || !day || Number.isNaN(startTime.getTime())) {
              return null;
            }

            const hours = startTime.getUTCHours();
            const minutes = startTime.getUTCMinutes();
            return {
              turno,
              dateTime: new Date(year, month - 1, day, hours, minutes, 0, 0),
            };
          })
          .filter(
            (item): item is { turno: Appointment; dateTime: Date } =>
              !!item &&
              item.turno.estado === "Programado" &&
              item.dateTime >= now,
          )
          .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

        setNextTurno(upcoming[0]?.turno ?? null);
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        console.error("Error fetching next appointment:", error);
        setNextTurno(null);
      })
      .finally(() => {
        setLoadingNextTurno(false);
        setHasCheckedNextTurno(true);
      });

    return () => controller.abort();
  }, [user?.codUsuario]);

  const formatTime = (timeString: string): string => {
    const date = new Date(timeString);
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const getDateBadge = (dateString: string) => {
    const [year, month, day] = dateString.split("T")[0].split("-");
    const monthIndex = Number(month);
    const monthLabel =
      monthIndex >= 1 && monthIndex <= 12 ? MONTH_LABELS[monthIndex - 1] : "";
    const dayLabel = day ? String(Number(day)) : "";
    return {
      monthLabel,
      dayLabel,
      fullDate: year && month && day ? `${day}/${month}/${year}` : "",
    };
  };

  const handleVerTurnos = () => {
    navigate("/Barber/BranchAppointments");
  };

  const handleMisTurnos = () => {
    navigate("/Barber/MyAppointments");
  };

  const handleMisAusencias = () => {
    navigate("/Barber/availability");
  };

  const barberBranch =
    nextTurno?.usuarios_turnos_codBarberoTousuarios?.sucursales;
  const client = nextTurno?.usuarios_turnos_codClienteTousuarios;
  const dateBadge = nextTurno ? getDateBadge(nextTurno.fechaTurno) : null;
  const showNextTurnoLoading = loadingNextTurno || !hasCheckedNextTurno;

  return (
    <div className={styles.homeContainer}>
      <section className={styles.welcomeSection}>
        <div className={styles.welcomeHeader}>
          <div className={styles.welcomeText}>
            <h2 className={styles.welcomeTitle}>{greeting}</h2>
            <p className={styles.welcomeSubtitle}>
              Gestioná tus turnos, tu disponibilidad y la jornada de hoy.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.nextTurnoSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitleLight}>Próximo Turno</h3>
        </div>

        <div className={styles.turnoCard}>
          {showNextTurnoLoading ? (
            <p className={styles.cardEmpty}>Cargando próximo turno...</p>
          ) : nextTurno ? (
            <div className={styles.turnoCardContent}>
              <div className={styles.turnoDateBadge}>
                <span className={styles.turnoDateMonth}>
                  {dateBadge?.monthLabel}
                </span>
                <span className={styles.turnoDateDay}>
                  {dateBadge?.dayLabel}
                </span>
              </div>

              <div className={styles.turnoInfo}>
                <div className={styles.turnoInfoRow}>
                  <span className={styles.turnoInfoText}>
                    {barberBranch?.nombre || "Sucursal por confirmar"}
                  </span>
                </div>
                <div className={styles.turnoInfoRow}>
                  <FaRegClock
                    className={styles.turnoInfoIcon}
                    aria-hidden="true"
                  />
                  <span className={styles.turnoInfoText}>
                    {formatTime(nextTurno.horaDesde)} -{" "}
                    {formatTime(nextTurno.horaHasta)}
                  </span>
                </div>
                <div className={styles.turnoInfoRow}>
                  <FaCut className={styles.turnoInfoIcon} aria-hidden="true" />
                  <span className={styles.turnoInfoText}>
                    {client
                      ? `${client.nombre} ${client.apellido}`
                      : "Cliente por confirmar"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className={styles.cardEmpty}>No tenés turnos programados.</p>
          )}
        </div>
      </section>

      <div className={styles.optionsContainer}>
        <button className={styles.optionButton} onClick={handleVerTurnos}>
          Atender Turnos
        </button>
        <button className={styles.optionButton} onClick={handleMisTurnos}>
          Mis Turnos
        </button>
        <button className={styles.optionButton} onClick={handleMisAusencias}>
          Registrar Ausencia
        </button>
      </div>
    </div>
  );
};

export default Home;
