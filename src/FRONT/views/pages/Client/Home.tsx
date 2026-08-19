import { useEffect, useState } from "react";
import { FaCut, FaRegCalendarAlt, FaRegClock } from "react-icons/fa";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/user/AuthContext";
import styles from "./home.module.css";
import { isAbortError, useAbortController } from "../../components/shared/useAbortController";
import { apiFetch } from "../../lib/apiFetch";
import { getResponseMessage, readJsonSafely } from "../../lib/apiResponse";
import { handleAbortOrConnectionError } from "../../lib/toastUtils";
import {
  getTurnoDateTime,
  unwrapAppointments,
} from "../../components/shared/appointments";

interface AppointmentSummary {
  codTurno: string;
  fechaTurno: string;
  horaDesde: string;
  horaHasta: string;
  estado: string;
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

interface LoyaltyProgress {
  currentCategory: string;
  currentDiscount: number;
  nextCategory: string | null;
  countCurrent: number | null;
  countRequired: number | null;
  daysCurrent: number | null;
  daysRequired: number | null;
  progress: number | null;
  isMaxCategory: boolean;
  discountCycle?: number | null;
  turnsUntilNextDiscount?: number | null;
  discountProgress?: number | null;
  discountTurnsRequired?: number | null;
  discountTurnsCompleted?: number | null;
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
  const { user } = useAuth();
  const { renew: renewNextTurnoAbort, abort: abortNextTurnoAbort } =
    useAbortController();
  const { renew: renewLoyaltyAbort, abort: abortLoyaltyAbort } =
    useAbortController();

  const [nextTurno, setNextTurno] = useState<AppointmentSummary | null>(null);
  const [loadingNextTurno, setLoadingNextTurno] = useState(false);
  const [hasCheckedNextTurno, setHasCheckedNextTurno] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [loyaltyProgress, setLoyaltyProgress] =
    useState<LoyaltyProgress | null>(null);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);

  const greetingName = user?.nombre?.trim();
  const greeting = greetingName ? `Hola, ${greetingName}!` : "Hola!";

  const handleSolicitarTurno = () => {
    navigate("/branches");
  };

  const handleCancelarTurno = (codTurno: string) => {
    if (isCancelling) return;
    toast(
      (t) => (
        <div className={styles.modalContainer}>
          <p className={styles.modalTitle}>
            ¿Estás seguro de que deseas cancelar esta reserva?
          </p>
          <div className={styles.modalButtons}>
            <button
              onClick={() => toast.dismiss(t.id)}
              className={styles.buttonCancel}
            >
              Atrás
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                void confirmedCancelarTurno(codTurno);
              }}
              className={styles.buttonConfirm}
            >
              Cancelar
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
  };

  const confirmedCancelarTurno = async (codTurno: string) => {
    if (isCancelling) return;
    setIsCancelling(true);
    const toastId = toast.loading("Cancelando turno...");

    try {
      const response = await apiFetch(`/turnos/${codTurno}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        await readJsonSafely(response);
        toast.success("Turno cancelado correctamente", {
          id: toastId,
          duration: 2000,
        });
        setNextTurno(null);
      } else if (response.status === 404) {
        toast.error("Turno no encontrado", { id: toastId, duration: 2000 });
      } else {
        const errorData = await readJsonSafely(response);
        toast.error(
          getResponseMessage(errorData, "Error al cancelar el turno") ??
            "Error al cancelar el turno",
          { id: toastId, duration: 2000 },
        );
      }
    } catch (error) {
      if (handleAbortOrConnectionError(error, toastId, "Error de conexión con el servidor")) {
        return;
      }
      console.error("Error en la solicitud:", error);
    } finally {
      setIsCancelling(false);
    }
  };

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

useEffect(() => {
    const loadNextTurno = async () => {
      if (!user?.codUsuario) {
        setNextTurno(null);
        setLoadingNextTurno(false);
        setHasCheckedNextTurno(true);
        return;
      }

      const controller = renewNextTurnoAbort();
      setHasCheckedNextTurno(false);
      setLoadingNextTurno(true);

      try {
        const res = await apiFetch(`/turnos/user/${user.codUsuario}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        const turnosArray = unwrapAppointments<AppointmentSummary>(data);

        const now = new Date();
        const upcoming = turnosArray
          .map((turno) => {
            const dateTime = getTurnoDateTime(turno);
            return dateTime ? { turno, dateTime } : null;
          })
          .filter(
            (item): item is { turno: AppointmentSummary; dateTime: Date } =>
              !!item &&
              item.turno.estado === "Programado" &&
              item.dateTime >= now,
          )
          .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

        setNextTurno(upcoming[0]?.turno ?? null);
      } catch (error) {
        if (isAbortError(error)) return;
        console.error("Error fetching next appointment:", error);
        setNextTurno(null);
      } finally {
        setLoadingNextTurno(false);
        setHasCheckedNextTurno(true);
      }
    };

    void loadNextTurno();
    return abortNextTurnoAbort;
  }, [user?.codUsuario, renewNextTurnoAbort, abortNextTurnoAbort]);


  useEffect(() => {
    const loadLoyaltyProgress = async () => {
      if (!user?.codUsuario) {
        setLoyaltyProgress(null);
        setLoadingLoyalty(false);
        return;
      }

      const controller = renewLoyaltyAbort();
      setLoadingLoyalty(true);

      try {
        const res = await apiFetch(`/usuarios/profiles/${user.codUsuario}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        const profile = data?.success && data.data ? data.data : data;
        setLoyaltyProgress(profile?.loyaltyProgress ?? null);
      } catch (error) {
        if (isAbortError(error)) return;
        console.error("Error fetching loyalty progress:", error);
        setLoyaltyProgress(null);
      } finally {
        setLoadingLoyalty(false);
      }
    };

    void loadLoyaltyProgress();
    return abortLoyaltyAbort;
  }, [user?.codUsuario, renewLoyaltyAbort, abortLoyaltyAbort]);

  const barber = nextTurno?.usuarios_turnos_codBarberoTousuarios;
  const branch = barber?.sucursales;
  const showNextTurnoLoading = loadingNextTurno || !hasCheckedNextTurno;
  const dateBadge = nextTurno ? getDateBadge(nextTurno.fechaTurno) : null;
  const currentDiscount = loyaltyProgress?.currentDiscount ?? null;

  const remainingTurns = loyaltyProgress?.turnsUntilNextDiscount ?? null;
  const discountTurnsRequired = loyaltyProgress?.discountTurnsRequired ?? null;
  const discountTurnsCompleted = loyaltyProgress?.discountTurnsCompleted ?? null;
  const discountProgressPercent = loyaltyProgress?.discountProgress != null
    ? Math.round(loyaltyProgress.discountProgress * 100)
    : null;

  const isInitialCategory =
    loyaltyProgress?.currentCategory?.trim().toLowerCase() === "inicial";

  return (
    <div className={styles.homeContainer}>
      <section className={styles.welcomeSection}>
        <div className={styles.welcomeHeader}>
          <div className={styles.welcomeText}>
            <h2 className={styles.welcomeTitle}>{greeting}</h2>
            <p className={styles.welcomeSubtitle}>
              Bienvenido a tu barbería de confianza
            </p>
          </div>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleSolicitarTurno}
          >
            <FaRegCalendarAlt
              className={styles.buttonIcon}
              aria-hidden="true"
            />
            Solicitar Turno
          </button>
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
                    {branch?.nombre || "Sucursal por confirmar"}
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
                    {barber
                      ? `${barber.nombre} ${barber.apellido}`
                      : "Barbero por confirmar"}
                  </span>
                </div>
                <div className={styles.turnoActions}>
                  <button
                    type="button"
                    className={`${styles.turnoButton} ${styles.turnoButtonSubtle}`}
                    onClick={() => handleCancelarTurno(nextTurno.codTurno)}
                    disabled={isCancelling}
                  >
                    Cancelar Turno
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className={styles.cardEmpty}>No tenés turnos programados.</p>
          )}
        </div>
      </section>

      <section className={styles.loyaltySection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Tu próximo descuento</h3>
        </div>

        <div className={styles.loyaltyCard}>
          {loadingLoyalty ? (
            <p className={styles.cardEmpty}>Cargando descuento...</p>
          ) : isInitialCategory ? (
            <div className={styles.discountContent}>
              <p className={styles.loyaltyMessage}>
                ¡Seguí solicitando turnos y sumando actividad para subir de
                categoría y desbloquear nuevos beneficios exclusivos!
              </p>
            </div>
          ) : remainingTurns === null ? (
            <p className={styles.cardEmpty}>Sin información disponible.</p>
          ) : (
            <>
              <div className={styles.discountContent}>
                <p className={styles.discountTurns}>
                  <span className={styles.discountTurnsCount}>
                    {discountTurnsRequired !== null &&
                    discountTurnsCompleted !== null
                      ? `${discountTurnsCompleted} de ${discountTurnsRequired}`
                      : "-"}
                  </span>
                </p>
                <p className={styles.discountDescription}>
                  Para tu próximo {currentDiscount}% de descuento
                </p>
                {remainingTurns === 0 && (
                  <p className={styles.progressPercentage}>
                    ¡Listo! En tu próximo turno se aplicará el descuento.
                  </p>
                )}
              </div>

              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${discountProgressPercent ?? 0}%` }}
                />
              </div>
              {typeof discountProgressPercent === "number" && (
                <p className={styles.progressPercentage}>
                  {discountProgressPercent}% completado
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
