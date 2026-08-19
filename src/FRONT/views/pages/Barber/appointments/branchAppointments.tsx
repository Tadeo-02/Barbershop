import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../components/user/AuthContext";
import styles from "./branchAppointments.module.css";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { createResolver } from "../../../lib/zodFormResolver";
import { z } from "zod";
import type { AppointmentFull } from "../../../components/shared/appointments";
import { formatDate, formatTime } from "../../../components/shared/appointments";
import {
  isAbortError,
  useAbortController,
} from "../../../components/shared/useAbortController";
import { apiFetch } from "../../../lib/apiFetch.ts";
import { getResponseMessage, readJsonSafely, unwrapArray } from "../../../lib/apiResponse";
import { handleAbortOrConnectionError } from "../../../lib/toastUtils";
import { ensureAuthenticatedUser } from "../../../lib/authUtils";
import type { Haircut } from "../../../../types/haircut";

// (legacy per-item form state removed — CheckoutForm keeps its own state for each appointment, so we don't need to manage it here)

// --- CheckoutForm component: Wraps the payment form with react-hook-form + Zod. ---
const CheckoutForm: React.FC<{
  codTurno: string;
  codCliente: string;
  initial: { codCorte: string; precioTurno: number; metodoPago: string };
  allCortes: Haircut[];
  onCompleted: () => Promise<void>;
}> = ({ codTurno, codCliente, initial, allCortes, onCompleted }) => {
  const navigate = useNavigate();
  const [descuentoInfo, setDescuentoInfo] = useState<{
    descuento: number;
    nombreCategoria: string;
    turnsUntilNextDiscount?: number | null;
    isThisTurnEligible?: boolean | null;
  } | null>(null);
  const [loadingCategoria, setLoadingCategoria] = useState(true);
  const loadedClientRef = useRef<string | null>(null);
  const { renew: renewCheckoutAbort } = useAbortController();

  // load category of the client (only once per client)
  useEffect(() => {

    if (loadedClientRef.current === codCliente) {
      setLoadingCategoria(false);
      return;
    }

    const loadClientCategory = async () => {
      try {
        const res = await apiFetch(`/usuarios/profiles/${codCliente}`);
        if (res.ok) {
          const responseData = await res.json();
          const userData = responseData.data || responseData;
          console.log("🔍 Datos del usuario con categoría:", userData);
          if (userData.categoriaActual) {
            setDescuentoInfo({
              descuento: userData.categoriaActual.descuentoCorte || 0,
              nombreCategoria:
                userData.categoriaActual.nombreCategoria || "Sin categoría",
              turnsUntilNextDiscount:
                userData.loyaltyProgress?.turnsUntilNextDiscount ?? null,
              isThisTurnEligible:
                userData.loyaltyProgress?.isThisTurnEligible ?? null,
            });
            console.log(
              `✅ Categoría cargada: ${userData.categoriaActual.nombreCategoria} - Descuento: ${userData.categoriaActual.descuentoCorte}%`,
            );
          } else {
            console.warn("❌ Sin categoría actual para el cliente");
            setDescuentoInfo({
              descuento: 0,
              nombreCategoria: "Sin categoría",
            });
          }
        } else {
          console.error("Error en respuesta:", res.status);
        }
      } catch (error) {
        console.error("Error cargando categoría:", error);
      } finally {
        loadedClientRef.current = codCliente;
        setLoadingCategoria(false);
      }
    };
    void loadClientCategory();
  }, [codCliente]);

  const CheckoutSchema = z.object({
    codCorte: z.string().min(1, "Seleccione un corte"),
    precioTurno: z.number().positive("El precio debe ser mayor a 0"),
    metodoPago: z.string().min(1, "Seleccione método de pago"),
  });

  type CheckoutValues = z.infer<typeof CheckoutSchema>;

  const { register, handleSubmit, setValue, watch, trigger, formState } =
    useForm<CheckoutValues>({
      resolver: createResolver(CheckoutSchema),
      defaultValues: {
        codCorte: initial.codCorte || "",
        precioTurno: initial.precioTurno || 0,
        metodoPago: initial.metodoPago || "",
      },
    });

  const doSubmit = async (values: CheckoutValues) => {
    if (formState.isSubmitting) return;

    const toastId = toast.loading("Finalizando turno...");

    const controller = renewCheckoutAbort();

    try {
      // send the price base - the backend will apply the discount
      const payload = {
        codCorte: values.codCorte,
        precioTurno: watchedPrecio, // Precio base
        metodoPago: values.metodoPago,
      };

      const response = await apiFetch(`/turnos/${codTurno}/checkout`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (response.ok) {
        const resData = await readJsonSafely<any>(response);
        const facturacion = resData?.data?.facturacion;
        if (facturacion?.CAE && facturacion?.voucher_number) {
          toast.success("Turno cobrado y facturado", {
            id: toastId,
            duration: 2000,
          });
          // Popup asking to view the receipt
          toast(
            (t) => (
              <div className={styles.modalContainer}>
                <p className={styles.modalTitle}>¿Ver Factura?</p>
                <p className={styles.modalDescription}>
                  El turno fue cobrado y facturado exitosamente.
                  <br />
                  <span style={{ fontSize: "0.85em" }}>
                    CAE: {facturacion.CAE}
                  </span>
                </p>
                <div className={styles.modalButtons}>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className={styles.modalButtonCancel}
                  >
                    No
                  </button>
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      navigate(`/Barber/appointments/recibo/${codTurno}`);
                    }}
                    className={styles.modalButtonConfirm}
                  >
                    Sí, ver factura
                  </button>
                </div>
              </div>
            ),
            {
              duration: Infinity,
              style: {
                minWidth: "400px",
                maxWidth: "500px",
                padding: "24px",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
                background: "var(--color-white)",
              },
            },
          );
        } else {
          toast(
            (t) => (
              <div className={styles.modalContainer}>
                <p className={styles.modalTitle}>Turno cobrado con éxito</p>
                {/* <p className={styles.modalDescription}>
                  <span style={{ color: "var(--color-warning-alt)" }}>
                    Factura pendiente
                    {facturacionError ? `: ${facturacionError}` : ""}
                  </span>
                  <br />
                  Podés facturar manualmente desde el botón "Facturar (ARCA)"
                </p> */}
                <div className={styles.modalButtons}>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className={styles.modalButtonCancel}
                  >
                    Entendido
                  </button>
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      navigate(`/Barber/appointments/recibo/${codTurno}`);
                    }}
                    className={styles.modalButtonConfirm}
                  >
                    Ver Recibo
                  </button>
                </div>
              </div>
            ),
            {
              duration: Infinity,
              style: {
                minWidth: "400px",
                maxWidth: "500px",
                padding: "24px",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
                background: "var(--color-white)",
              },
            },
          );
        }
        await onCompleted();
      } else if (response.status === 404) {
        toast.error("Turno no encontrado", { id: toastId, duration: 2000 });
      } else {
        const errorData = await readJsonSafely(response);
        toast.error(
          getResponseMessage(errorData, "Error al finalizar el turno") ??
            "Error al finalizar el turno",
          { id: toastId, duration: 2000 },
        );
      }
    } catch (error: unknown) {
      if (handleAbortOrConnectionError(error, toastId, "Error de conexión al finalizar el turno")) {
        console.log("Checkout request aborted");
        return;
      }
      console.error("Fetch error:", error);
    }
  };

  const confirmAndSubmit = async () => {
    const isValid = await trigger();
    if (!isValid) {
      toast.error("Completá todos los campos antes de continuar");
      return;
    }

    toast(
      (t) => (
        <div className={styles.modalContainer}>
          <p className={styles.modalTitle}>Completar servicio</p>
          <p className={styles.modalDescription}>
            ¿Confirmar que el servicio ha sido completado y proceder con el
            cobro?
          </p>
          <div className={styles.modalButtons}>
            <button
              onClick={() => toast.dismiss(t.id)}
              className={styles.modalButtonCancel}
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                void handleSubmit(doSubmit)();
              }}
              className={styles.modalButtonConfirm}
            >
              Confirmar cobro
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: {
          minWidth: "400px",
          maxWidth: "500px",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
          background: "var(--color-white)",
        },
      },
    );
  };

  // Keep price in sync when codCorte changes using react-hook-form watch
  const watchedCodCorte = watch("codCorte");
  const watchedPrecio = watch("precioTurno");
  const watchedMetodoPago = watch("metodoPago");

  useEffect(() => {
    const selected = allCortes.find((c) => c.codCorte === watchedCodCorte);
    if (selected) setValue("precioTurno", selected.valorBase);
  }, [watchedCodCorte, allCortes, setValue]);

  // calculate final price with discount if applicable

  const precioFinal =
    descuentoInfo &&
    descuentoInfo.descuento > 0 &&
    descuentoInfo.isThisTurnEligible
      ? watchedPrecio * (1 - descuentoInfo.descuento / 100)
      : watchedPrecio;

  const descuentoAplicado =
    descuentoInfo &&
    descuentoInfo.descuento > 0 &&
    descuentoInfo.isThisTurnEligible
      ? watchedPrecio - precioFinal
      : 0;

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <fieldset disabled={formState.isSubmitting || loadingCategoria}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor={`codCorte-${codTurno}`}>
            Tipo de Corte:
          </label>
          <select
            id={`codCorte-${codTurno}`}
            className={styles.formSelect}
            {...register("codCorte")}
          >
            <option value="">Seleccione un corte</option>
            {allCortes.map((cut) => (
              <option key={cut.codCorte} value={cut.codCorte}>
                {cut.nombreCorte} - ${cut.valorBase}
              </option>
            ))}
          </select>
          {formState.errors.codCorte && (
            <div className={styles.fieldError}>
              {String(formState.errors.codCorte.message)}
            </div>
          )}
        </div>

        {/* price with discount section */}
        <div className={styles.formGroup}>
          <span className={styles.formLabel}>Información de Pago:</span>
          <div className={styles.priceInfo}>
            <div className={styles.priceLine}>
              <span className={styles.priceLabel}>Precio Base:</span>
              <span className={styles.priceValue}>
                ${watchedPrecio.toFixed(2)}
              </span>
            </div>

            {descuentoInfo &&
              descuentoInfo.descuento > 0 &&
              descuentoInfo.isThisTurnEligible && (
                <>
                  <div className={styles.categoryBadge}>
                    <span className={styles.categoryName}>
                      Categoría: {descuentoInfo.nombreCategoria}
                    </span>
                    <span className={styles.discountBadge}>
                      -{descuentoInfo.descuento}%
                    </span>
                  </div>
                  <div
                    className={styles.priceLine}
                    style={{ color: "var(--color-danger-alt)" }}
                  >
                    <span className={styles.priceLabel}>Descuento:</span>
                    <span className={styles.priceValue}>
                      -${descuentoAplicado.toFixed(2)}
                    </span>
                  </div>
                  <div
                    className={styles.priceLine}
                    style={{
                      borderTop: "2px solid var(--color-gray-150)",
                      paddingTop: "8px",
                    }}
                  >
                    <span
                      className={styles.priceLabel}
                      style={{ fontWeight: "bold" }}
                    >
                      TOTAL A COBRAR:
                    </span>
                    <span
                      className={styles.priceValue}
                      style={{ fontWeight: "bold", color: "var(--color-success-alt)" }}
                    >
                      ${precioFinal.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label
            className={styles.formLabel}
            htmlFor={`precioTurno-${codTurno}`}
          >
            Precio a Cobrar:
          </label>
          <input
            id={`precioTurno-${codTurno}`}
            type="number"
            className={styles.formInput}
            step="0.01"
            min="0"
            value={precioFinal.toFixed(2)}
            readOnly
            style={{ backgroundColor: "var(--color-surface-light-23)", cursor: "not-allowed" }}
          />
        </div>

        <div className={styles.formGroup}>
          <label
            className={styles.formLabel}
            htmlFor={`metodoPago-${codTurno}`}
          >
            Método de Pago:
          </label>
          <select
            id={`metodoPago-${codTurno}`}
            className={styles.formSelect}
            {...register("metodoPago")}
          >
            <option value="">Seleccione método</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Transferencia">Transferencia</option>
            <option value="QR">QR</option>
          </select>
          {formState.errors.metodoPago && (
            <div className={styles.fieldError}>
              {String(formState.errors.metodoPago.message)}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={confirmAndSubmit}
          className={`${styles.button} ${styles.buttonSuccess}`}
          disabled={
            formState.isSubmitting || !watchedCodCorte || !watchedMetodoPago
          }
        >
          {formState.isSubmitting ? "Procesando..." : "Completar y cobrar"}
        </button>
      </fieldset>
    </form>
  );
};

const BranchAppointments: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [turnos, setTurnos] = useState<AppointmentFull[]>([]);
  const [allCortes, setAllCortes] = useState<Haircut[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { renew: renewTurnosAbort, abort: abortTurnosAbort } =
    useAbortController();
  const { renew: renewSubmitAbort } = useAbortController();
  const { renew: renewCortesAbort, abort: abortCortesAbort } =
    useAbortController();

  const navigate = useNavigate();
  // Client-side search state (search by barber or client name)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>(searchQuery);
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Debounce search input to avoid recalculating on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    // give time to AuthContext to load from localStorage
    const timer = setTimeout(() => {
      setAuthChecked(true);

      if (!ensureAuthenticatedUser(isAuthenticated, user, navigate, {
        message: "Debes iniciar sesión como barbero para ver los turnos",
        redirectTo: "/login",
        requireSucursal: true,
      })) {
        return;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, navigate]);

  const loadTurnos = async () => {
    if (!user) return;
    const controller = renewTurnosAbort();
    setLoading(true);

    try {
      const endpoint = `/turnos/branch/${user.codSucursal}`;
      const res = await apiFetch(endpoint, { signal: controller.signal });

      console.log("Response status:", res.status);
      console.log("Response headers:", res.headers.get("content-type"));

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await readJsonSafely<any>(res);
      setTurnos(unwrapArray<AppointmentFull>(data, ["data"]));

    } catch (error: unknown) {
      if (isAbortError(error)) {
        console.log("Fetch aborted for branch turnos");
        return;
      }
      console.error("Error fetching appointments:", error);
      setTurnos([]);
    } finally {
      setLoading(false);
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authChecked || !isAuthenticated || !user) return;
    void loadTurnos();

    return abortTurnosAbort;
  }, [authChecked, isAuthenticated, user, navigate, abortTurnosAbort]);

  // load all types of haircuts 
  useEffect(() => {
    const controller = renewCortesAbort();
    const loadCortes = async () => {
      try {
        const res = await apiFetch("/tipoCortes", {
          signal: controller.signal,
        });
        console.log("Response status cortes:", res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await readJsonSafely<any>(res);
        setAllCortes(unwrapArray<Haircut>(data, ["data"]));
      } catch (error: unknown) {
        if (isAbortError(error)) return;
        console.error("Error fetching cuts:", error);
        toast.error("Error al cargar tipos de corte");
      }
    };

    void loadCortes();

    return abortCortesAbort;
  }, [renewCortesAbort, abortCortesAbort]);

  // Client-side filtered results based on debounced search (barber or client name) and date
  const filteredTurnos = turnos.filter((turno) => {
    // filter by text search
    if (debouncedSearch && debouncedSearch.trim() !== "") {
      const q = debouncedSearch.toLowerCase();

      const barberoName = turno.usuarios_turnos_codBarberoTousuarios
        ? `${turno.usuarios_turnos_codBarberoTousuarios.nombre} ${turno.usuarios_turnos_codBarberoTousuarios.apellido}`.toLowerCase()
        : "";
      const clienteName = turno.usuarios_turnos_codClienteTousuarios
        ? `${turno.usuarios_turnos_codClienteTousuarios.nombre} ${turno.usuarios_turnos_codClienteTousuarios.apellido}`.toLowerCase()
        : "";

      if (!barberoName.includes(q) && !clienteName.includes(q)) {
        return false;
      }
    }

    // filter by date
    if (selectedDate) {
      const turnoDate = turno.fechaTurno.split("T")[0];
      if (turnoDate !== selectedDate) {
        return false;
      }
    }

    return true;
  });

  const handleBillAppointment = async (codTurno: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Generando factura ARCA...");

    try {
      const response = await apiFetch("/facturacion/facturar-turno", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codTurno }),
      });

      if (response.ok) {
        const resData = await response.json();
        const cae = resData.data?.CAE || "OK";
        toast.success("Factura generada exitosamente", {
          id: toastId,
          duration: 2000,
        });
        // Popup asking to view the invoice
        toast(
          (t) => (
            <div className={styles.modalContainer}>
              <p className={styles.modalTitle}>¿Ver Factura?</p>
              <p className={styles.modalDescription}>
                La factura fue generada exitosamente.
                <br />
                <span style={{ fontSize: "0.85em" }}>CAE: {cae}</span>
              </p>
              <div className={styles.modalButtons}>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className={styles.modalButtonCancel}
                >
                  No
                </button>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    navigate(`/Barber/appointments/recibo/${codTurno}`);
                  }}
                  className={styles.modalButtonConfirm}
                >
                  Sí, ver factura
                </button>
              </div>
            </div>
          ),
          {
            duration: Infinity,
            style: {
              minWidth: "400px",
              maxWidth: "500px",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
              background: "var(--color-white)",
            },
          },
        );
      } else {
        const errorData = await readJsonSafely(response);
        toast.error(
          getResponseMessage(errorData, "Error al generar factura") ??
            "Error al generar factura",
          { id: toastId, duration: 3000 },
        );
      }
    } catch (error) {
      console.error("Error facturando:", error);
      toast.error("Error de red al generar factura", {
        id: toastId,
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsNoShow = (codTurno: string) => {
    toast(
      (t) => (
        <div className={styles.modalContainer}>
          <p className={styles.modalTitle}>Marcar como No asistido</p>
          <p className={styles.modalDescription}>
            ¿Confirmar que el cliente no asistió a este turno?
          </p>
          <div className={styles.modalButtons}>
            <button
              onClick={() => toast.dismiss(t.id)}
              className={styles.modalButtonCancel}
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                confirmedMarkAsNoShow(codTurno);
              }}
              className={styles.modalButtonConfirm}
            >
              Confirmar
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: {
          minWidth: "400px",
          maxWidth: "500px",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
          background: "var(--color-white)",
        },
      },
    );
  };

  const confirmedMarkAsNoShow = async (codTurno: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Marcando como No asistido...");

    const controller = renewSubmitAbort();

    try {
      const response = await apiFetch(`/turnos/${codTurno}/no-show`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      if (response.ok) {
        await readJsonSafely(response);
        toast.success("Turno marcado como No asistido", { id: toastId });

        // reload appointments
        await loadTurnos();
      } else if (response.status === 404) {
        toast.error("Turno no encontrado", { id: toastId });
      } else {
        const errorData = await readJsonSafely(response);
        console.error("Error response:", errorData);
        toast.error(
          getResponseMessage(
            errorData,
            "Error al marcar turno como No asistido",
          ) ?? "Error al marcar turno como No asistido",
          {
            id: toastId,
          },
        );
      }
    } catch (error: unknown) {
      if (handleAbortOrConnectionError(error, toastId, "Error de conexión al marcar turno como No asistido")) {
        console.log("No-show request aborted");
        return;
      }
      console.error("Fetch error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.appointmentsContainer}>
      <h2 className={styles.pageTitle}>Turnos de la Sucursal</h2>

      <input
        type="text"
        name="search"
        placeholder="Buscar por barbero o cliente"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={styles.searchInput}
      />

      <input
        type="date"
        name="dateFilter"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className={styles.searchInput}
      />

      <br />
      {loading || loadingData ? (
        <div className={styles.loadingState}>Cargando turnos...</div>
      ) : turnos.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay turnos programados para esta sucursal</p>
        </div>
      ) : filteredTurnos.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No se encontraron coincidencias para la búsqueda.</p>
        </div>
      ) : (
        <ul className={styles.appointmentList}>
          {(() => {
            const visibleIds = new Set(filteredTurnos.map((t) => t.codTurno));
            return turnos.map((turno) => {
              const barbero = turno.usuarios_turnos_codBarberoTousuarios;
              const cliente = turno.usuarios_turnos_codClienteTousuarios;
              const currentForm = {
                codCorte: turno.codCorte || "",
                precioTurno: turno.precioTurno || 0,
                metodoPago: turno.metodoPago || "",
              };

              return (
                <li
                  key={turno.codTurno}
                  className={styles.appointmentItem}
                  style={
                    visibleIds.has(turno.codTurno)
                      ? undefined
                      : { display: "none" }
                  }
                >
                  <div className={styles.appointmentDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Fecha:</span>
                      <span className={styles.detailValue}>
                        {formatDate(turno.fechaTurno)}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Hora:</span>
                      <span className={styles.detailValue}>
                        {formatTime(turno.horaDesde)} -{" "}
                        {formatTime(turno.horaHasta)}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Barbero:</span>
                      <span className={styles.detailValue}>
                        {barbero
                          ? `${barbero.nombre} ${barbero.apellido}`
                          : "Cargando..."}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Cliente:</span>
                      <span className={styles.detailValue}>
                        {cliente
                          ? `${cliente.nombre} ${cliente.apellido}`
                          : "Cargando..."}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Estado:</span>
                      <span
                        className={`${styles.statusBadge} ${styles.statusProgramado}`}
                      >
                        {turno.estado}
                      </span>
                    </div>
                  </div>

                  {turno.estado === "Programado" && (
                    <div className={styles.actionButtons}>
                      <CheckoutForm
                        codTurno={turno.codTurno}
                        codCliente={turno.codCliente}
                        initial={currentForm}
                        allCortes={allCortes}
                        onCompleted={async () => {
                          await loadTurnos();
                        }}
                      />

                      <button
                        onClick={() => handleMarkAsNoShow(turno.codTurno)}
                        className={`${styles.button} ${styles.buttonWarning}`}
                      >
                      No asistido
                      </button>
                    </div>
                  )}

                  {turno.estado === "Cobrado" && (
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() =>
                          navigate(
                            `/Barber/appointments/recibo/${turno.codTurno}`,
                          )
                        }
                        className={`${styles.button} ${styles.buttonInfo}`}
                      >
                        Ver Factura
                      </button>
                      <button
                        onClick={() => handleBillAppointment(turno.codTurno)}
                        className={`${styles.button} ${styles.buttonSuccess}`}
                        disabled={isSubmitting}
                      >
                        Facturar (ARCA)
                      </button>
                    </div>
                  )}
                </li>
              );
            });
          })()}
        </ul>
      )}
    </div>
  );
};

export default BranchAppointments;
