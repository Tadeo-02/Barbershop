import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../login/AuthContext";
import styles from "./branchAppointments.module.css";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// (legacy per-item form state removed — CheckoutForm mantiene su propio estado)

interface Appointment {
  codTurno: string;
  codBarbero: string;
  codCorte?: string;
  codCliente: string;
  fechaTurno: string;
  horaDesde: string;
  horaHasta: string;
  precioTurno?: number;
  metodoPago?: string;
  estado: string;
  usuarios_turnos_codBarberoTousuarios?: {
    codUsuario: string;
    nombre: string;
    apellido: string;
    codSucursal: string;
  };
  usuarios_turnos_codClienteTousuarios?: {
    codUsuario: string;
    nombre: string;
    apellido: string;
    telefono: string;
    email: string;
  };
}

interface Cut {
  codCorte: string;
  nombreCorte: string;
  valorBase: number;
}

const BranchAppointments: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [turnos, setTurnos] = useState<Appointment[]>([]);
  const [allCortes, setAllCortes] = useState<Cut[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const submitControllerRef = useRef<AbortController | null>(null);

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

  // Función para formatear la fecha en formato legible (DD/MM/YYYY)
  const formatDate = (dateString: string): string => {
    const [year, month, day] = dateString.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  };

  // Función para extraer solo la hora en formato HH:MM
  const formatTime = (timeString: string): string => {
    const date = new Date(timeString);
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Función para verificar si el turno ya pasó (fecha + horaHasta < ahora)
  const hasTurnoPassed = (fechaTurno: string, horaHasta: string): boolean => {
    const now = new Date();
    const fecha = new Date(fechaTurno);
    const horaHastaDate = new Date(horaHasta);

    // Extraer horas y minutos de horaHasta
    const hours = horaHastaDate.getUTCHours();
    const minutes = horaHastaDate.getUTCMinutes();

    // Combinar fecha del turno con hora hasta
    fecha.setHours(hours, minutes, 0, 0);

    return fecha < now;
  };

  useEffect(() => {
    // Dar tiempo para que el AuthContext cargue desde localStorage
    const timer = setTimeout(() => {
      setAuthChecked(true);

      if (!isAuthenticated || !user || !user.codUsuario || !user.codSucursal) {
        toast.error("Debes iniciar sesión como barbero para ver los turnos");
        navigate("/login");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, navigate]);

  const loadTurnos = async () => {
    if (!user) return;
    fetchControllerRef.current?.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    try {
      const endpoint = `/turnos/branch/${user.codSucursal}`;
      const res = await fetch(endpoint, { signal: controller.signal });

      console.log("Response status:", res.status);
      console.log("Response headers:", res.headers.get("content-type"));

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json().catch(() => null);

      console.log("Turnos data:", data);

      let turnosArray: Appointment[] = [];

      if (data) {
        if (data.success && Array.isArray(data.data)) {
          turnosArray = data.data;
        } else if (Array.isArray(data)) {
          turnosArray = data;
        }
      }

      console.log("Turnos array procesado:", turnosArray);
      setTurnos(turnosArray);
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Fetch aborted for branch turnos");
        return;
      }
      console.error("Error fetching appointments:", error);
      setTurnos([]);
      // On error, stop both loading flags so UI shows the error/empty state
      setLoadingData(false);
      setLoading(false);
    } finally {
      fetchControllerRef.current = null;
    }
  };

  useEffect(() => {
    if (!authChecked || !isAuthenticated || !user) return;
    void loadTurnos();

    return () => {
      fetchControllerRef.current?.abort();
    };
  }, [authChecked, isAuthenticated, user, navigate]);

  useEffect(() => {
    if (turnos.length === 0) {
      setLoadingData(false);
      setLoading(false);
      return;
    }

    // Los datos de barberos y clientes ya vienen incluidos en turnos
    setLoadingData(false);
    setLoading(false);
  }, [turnos]);

  // Cargar todos los tipos de corte disponibles
  useEffect(() => {
    const controller = new AbortController();
    const loadCortes = async () => {
      try {
        const res = await fetch("/tipoCortes", { signal: controller.signal });
        console.log("Response status cortes:", res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json().catch(() => null);
        console.log("Cortes data:", data);
        if (Array.isArray(data)) {
          console.log("Setting allCortes:", data);
          setAllCortes(data);
        } else if (data && data.success && Array.isArray(data.data)) {
          console.log("Setting allCortes from data.data:", data.data);
          setAllCortes(data.data);
        } else {
          console.warn("Formato de respuesta inesperado:", data);
        }
      } catch (error: any) {
        if (error.name === "AbortError") return;
        console.error("Error fetching cuts:", error);
        toast.error("Error al cargar tipos de corte");
      }
    };

    void loadCortes();

    return () => controller.abort();
  }, []);

  // --- CheckoutForm component: encapsula formulario de cobro con react-hook-form + zod ---
  const CheckoutForm: React.FC<{
    codTurno: string;
    codCliente: string;
    initial: { codCorte: string; precioTurno: number; metodoPago: string };
    allCortes: Cut[];
    onCompleted: () => Promise<void>;
  }> = ({ codTurno, codCliente, initial, allCortes, onCompleted }) => {
    const [descuentoInfo, setDescuentoInfo] = useState<{
      descuento: number;
      nombreCategoria: string;
    } | null>(null);
    const [loadingCategoria, setLoadingCategoria] = useState(true);
    const loadedClientRef = useRef<string | null>(null);

    // Cargar categoría del cliente (solo una vez por cliente)
    useEffect(() => {
      // Si ya cargamos para este cliente, no volver a cargar
      if (loadedClientRef.current === codCliente) {
        setLoadingCategoria(false);
        return;
      }

      const loadClientCategory = async () => {
        try {
          const res = await fetch(`/usuarios/profiles/${codCliente}`);
          if (res.ok) {
            const responseData = await res.json();
            const userData = responseData.data || responseData;
            console.log("🔍 Datos del usuario con categoría:", userData);
            if (userData.categoriaActual) {
              setDescuentoInfo({
                descuento: userData.categoriaActual.descuentoCorte || 0,
                nombreCategoria:
                  userData.categoriaActual.nombreCategoria || "Sin categoría",
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

    const { register, handleSubmit, setValue, watch, formState } =
      useForm<CheckoutValues>({
        resolver: zodResolver(CheckoutSchema),
        defaultValues: {
          codCorte: initial.codCorte || "",
          precioTurno: initial.precioTurno || 0,
          metodoPago: initial.metodoPago || "",
        },
      });

    const submitControllerRef = useRef<AbortController | null>(null);

    const doSubmit = async (values: CheckoutValues) => {
      if (formState.isSubmitting) return;

      const toastId = toast.loading("Finalizando turno...");

      // Abort previous
      submitControllerRef.current?.abort();
      const controller = new AbortController();
      submitControllerRef.current = controller;

      try {
        // Enviar el precio base - el backend aplicará el descuento
        const payload = {
          codCorte: values.codCorte,
          precioTurno: watchedPrecio, // Precio base
          metodoPago: values.metodoPago,
        };

        const response = await fetch(`/turnos/${codTurno}/checkout`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (response.ok) {
          const resData = await response.json().catch(() => null);
          const facturacion = resData?.data?.facturacion;
          const facturacionError = resData?.data?.facturacionError;
          if (facturacion?.CAE && facturacion?.voucher_number) {
            toast(
              (t) => (
                <div>
                  <p>
                    <strong>Turno cobrado y facturado</strong>
                  </p>
                  <p style={{ fontSize: "0.85em" }}>CAE: {facturacion.CAE}</p>
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      window.open(
                        `/facturacion/pdf/${codTurno}/${facturacion.voucher_number}`,
                        "_blank",
                      );
                    }}
                    className={`${styles.button} ${styles.buttonSuccess}`}
                    style={{ marginTop: 8, width: "100%" }}
                  >
                    Ver Factura PDF
                  </button>
                </div>
              ),
              { id: toastId, duration: 8000 },
            );
          } else {
            toast(
              (t) => (
                <div>
                  <p>
                    <strong>Turno cobrado con éxito</strong>
                  </p>
                  <p style={{ fontSize: "0.85em", color: "#e67e22" }}>
                    Factura pendiente
                    {facturacionError ? `: ${facturacionError}` : ""}
                  </p>
                  <p style={{ fontSize: "0.8em", color: "#7f8c8d" }}>
                    Podés facturar manualmente desde el botón "Facturar (ARCA)"
                  </p>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className={`${styles.button}`}
                    style={{ marginTop: 8, width: "100%" }}
                  >
                    Entendido
                  </button>
                </div>
              ),
              { id: toastId, duration: 10000 },
            );
          }
          await onCompleted();
        } else if (response.status === 404) {
          toast.error("Turno no encontrado", { id: toastId, duration: 2000 });
        } else {
          const errorData = await response
            .json()
            .catch(() => ({ message: "Error" }));
          toast.error(errorData.message || "Error al finalizar el turno", {
            id: toastId,
            duration: 2000,
          });
        }
      } catch (error: any) {
        if (error?.name === "AbortError") {
          toast.dismiss(toastId);
          console.log("Checkout request aborted");
        } else {
          console.error("Fetch error:", error);
          toast.error("Error de red al finalizar el turno", {
            id: toastId,
            duration: 2000,
          });
        }
      } finally {
        submitControllerRef.current = null;
      }
    };

    const confirmAndSubmit = () => {
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
            background: "#ffffff",
          },
        },
      );
    };

    // Keep precio in sync when codCorte changes using react-hook-form watch
    const watchedCodCorte = watch("codCorte");
    const watchedPrecio = watch("precioTurno");

    useEffect(() => {
      const selected = allCortes.find((c) => c.codCorte === watchedCodCorte);
      if (selected) setValue("precioTurno", selected.valorBase);
    }, [watchedCodCorte, allCortes, setValue]);

    // Calcular precio final con descuento
    const precioFinal =
      descuentoInfo && descuentoInfo.descuento > 0
        ? watchedPrecio * (1 - descuentoInfo.descuento / 100)
        : watchedPrecio;

    const descuentoAplicado =
      descuentoInfo && descuentoInfo.descuento > 0
        ? watchedPrecio - precioFinal
        : 0;

    return (
      <form onSubmit={(e) => e.preventDefault()}>
        <fieldset disabled={formState.isSubmitting || loadingCategoria}>
          <div className={styles.formGroup}>
            <label
              className={styles.formLabel}
              htmlFor={`codCorte-${codTurno}`}
            >
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

          {/* Sección de Precio con Descuento */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Información de Pago:</label>
            <div className={styles.priceInfo}>
              <div className={styles.priceLine}>
                <span className={styles.priceLabel}>Precio Base:</span>
                <span className={styles.priceValue}>
                  ${watchedPrecio.toFixed(2)}
                </span>
              </div>

              {descuentoInfo && descuentoInfo.descuento > 0 && (
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
                    style={{ color: "#e74c3c" }}
                  >
                    <span className={styles.priceLabel}>Descuento:</span>
                    <span className={styles.priceValue}>
                      -${descuentoAplicado.toFixed(2)}
                    </span>
                  </div>
                  <div
                    className={styles.priceLine}
                    style={{
                      borderTop: "2px solid #bdc3c7",
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
                      style={{ fontWeight: "bold", color: "#27ae60" }}
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
              style={{ backgroundColor: "#ecf0f1", cursor: "not-allowed" }}
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
            disabled={formState.isSubmitting}
          >
            {formState.isSubmitting ? "Procesando..." : "Completar y cobrar"}
          </button>
        </fieldset>
      </form>
    );
  };

  // Client-side filtered results based on debounced search (barber or client name) and date
  const filteredTurnos = turnos.filter((turno) => {
    // Filtro por búsqueda de texto
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

    // Filtro por fecha
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
      const response = await fetch("/facturacion/facturar-turno", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codTurno }),
      });

      if (response.ok) {
        const resData = await response.json();
        const voucherNumber = resData.data?.voucher_number;
        const cae = resData.data?.CAE || "OK";
        toast(
          (t) => (
            <div>
              <p>
                <strong>Factura generada</strong>
              </p>
              <p style={{ fontSize: "0.85em" }}>CAE: {cae}</p>
              {voucherNumber && (
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    window.open(
                      `/facturacion/pdf/${codTurno}/${voucherNumber}`,
                      "_blank",
                    );
                  }}
                  className={`${styles.button} ${styles.buttonSuccess}`}
                  style={{ marginTop: 8, width: "100%" }}
                >
                  Ver Factura PDF
                </button>
              )}
            </div>
          ),
          { id: toastId, duration: 8000 },
        );
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error" }));
        toast.error(errorData.message || "Error al generar factura", {
          id: toastId,
          duration: 3000,
        });
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
          background: "#ffffff",
        },
      },
    );
  };

  const confirmedMarkAsNoShow = async (codTurno: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Marcando como No asistido...");

    submitControllerRef.current?.abort();
    const controller = new AbortController();
    submitControllerRef.current = controller;

    try {
      const response = await fetch(`/turnos/${codTurno}/no-show`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      if (response.ok) {
        await response.json().catch(() => null);
        toast.success("Turno marcado como No asistido", { id: toastId });

        // Recargar turnos
        await loadTurnos();
      } else if (response.status === 404) {
        toast.error("Turno no encontrado", { id: toastId });
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Error" }));
        console.error("Error response:", errorData);
        toast.error(
          errorData.message || "Error al marcar turno como No asistido",
          {
            id: toastId,
          },
        );
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        toast.dismiss(toastId);
        console.log("No-show request aborted");
      } else {
        console.error("Fetch error:", error);
        toast.error("Error de red al marcar turno como No asistido", {
          id: toastId,
        });
      }
    } finally {
      setIsSubmitting(false);
      submitControllerRef.current = null;
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
          {filteredTurnos.map((turno) => {
            const barbero = turno.usuarios_turnos_codBarberoTousuarios;
            const cliente = turno.usuarios_turnos_codClienteTousuarios;
            const currentForm = {
              codCorte: turno.codCorte || "",
              precioTurno: turno.precioTurno || 0,
              metodoPago: turno.metodoPago || "",
            };

            return (
              <li key={turno.codTurno} className={styles.appointmentItem}>
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
                      disabled={
                        !hasTurnoPassed(turno.fechaTurno, turno.horaHasta)
                      }
                    >
                      No asistido
                    </button>
                  </div>
                )}

                {turno.estado === "Cobrado" && (
                  <div className={styles.actionButtons}>
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
          })}
        </ul>
      )}
    </div>
  );
};

export default BranchAppointments;
