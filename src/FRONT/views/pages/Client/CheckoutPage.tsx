import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useCart } from "../../components/CartContext";
import { useAuth } from "../../components/login/AuthContext";
import styles from "./checkout.module.css";

interface Branch {
  codSucursal: string;
  nombre: string;
  calle: string;
  altura: string | number;
}

const CheckoutPage: React.FC = () => {
  const { items, totalPrice, clearCart, updateQuantity, removeItem } =
    useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [prefilled, setPrefilled] = useState(false);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("Efectivo");

  const paymentMethods = ["Efectivo", "Tarjeta", "MercadoPago (link)"];

  // Cargar sucursales desde el backend (función reusable para reintentos)
  const fetchBranches = async () => {
    try {
      setBranchesError(null);
      const res = await fetch("/sucursales");
      if (!res.ok) throw new Error("Error al obtener sucursales");
      const data = await res.json();
      setBranches(data || []);
      if ((data || []).length > 0) setSelectedBranch(data[0].codSucursal);
    } catch (err: any) {
      console.error("Error fetching branches:", err);
      const msg = err?.message || String(err);
      setBranchesError(msg);
      toast.error("No fue posible cargar las sucursales");
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // Si el usuario está logueado, prellenar los campos del formulario con sus datos
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let didPrefill = false;
    // No sobreescribir si el usuario ya empezó a tipear
    if (!firstName && user.nombre) {
      setFirstName(user.nombre);
      didPrefill = true;
    }
    if (!lastName && user.apellido) {
      setLastName(user.apellido);
      didPrefill = true;
    }
    if (!phone && user.telefono) {
      setPhone(user.telefono);
      didPrefill = true;
    }

    if (didPrefill) setPrefilled(true);

    // Si el usuario tiene una sucursal preferida y ya cargaron las branches, seleccionarla
    if (user.codSucursal && branches.length > 0) {
      const found = branches.find((b) => b.codSucursal === user.codSucursal);
      if (found) setSelectedBranch(found.codSucursal);
    }
  }, [isAuthenticated, user, branches]);

  const applyProfile = () => {
    if (!user) return;
    let didPrefill = false;
    if (user.nombre && firstName !== user.nombre) {
      setFirstName(user.nombre);
      didPrefill = true;
    }
    if (user.apellido && lastName !== user.apellido) {
      setLastName(user.apellido);
      didPrefill = true;
    }
    if (user.telefono && phone !== user.telefono) {
      setPhone(user.telefono);
      didPrefill = true;
    }
    if (user.codSucursal && branches.length > 0) {
      const found = branches.find((b) => b.codSucursal === user.codSucursal);
      if (found && selectedBranch !== found.codSucursal) {
        setSelectedBranch(found.codSucursal);
        didPrefill = true;
      }
    }
    if (didPrefill) setPrefilled(true);
  };

  const isProfileApplied = () => {
    if (!user) return false;
    const nameMatch = (!user.nombre && !firstName) || user.nombre === firstName;
    const lastMatch =
      (!user.apellido && !lastName) || user.apellido === lastName;
    const phoneMatch = (!user.telefono && !phone) || user.telefono === phone;
    const branchMatch =
      !user.codSucursal || user.codSucursal === selectedBranch;
    return nameMatch && lastMatch && phoneMatch && branchMatch;
  };

  const handleConfirm = () => {
    // Validaciones
    if (!items || items.length === 0) {
      toast.error(
        "El carrito está vacío. Agrega productos antes de confirmar la compra."
      );
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Por favor completa nombre y apellido");
      return;
    }
    if (!phone.trim()) {
      toast.error("Por favor ingresa un celular de contacto");
      return;
    }
    if (!selectedBranch) {
      toast.error("Selecciona una sucursal");
      return;
    }

    // Generar número de pedido simple: prefijo + timestamp + random
    const generateOrderNumber = () => {
      const ts = Date.now();
      const rnd = Math.floor(Math.random() * 9000) + 1000; // 4 dígitos
      return `BS-${ts}-${rnd}`;
    };

    // Calcular siguiente día hábil (Lun-Vie). Si hoy es viernes, siguiente día hábil será lunes (+3)
    const nextBusinessDay = (from = new Date()) => {
      const d = new Date(from);
      // Avanzar un día como mínimo
      d.setDate(d.getDate() + 1);
      // Si es sábado (6) -> sumar 2 días (-> lunes). Si es domingo (0) -> sumar 1 día (-> lunes)
      const day = d.getDay();
      if (day === 6) d.setDate(d.getDate() + 2);
      if (day === 0) d.setDate(d.getDate() + 1);
      return d;
    };

    const orderNumber = generateOrderNumber();
    const pickupDate = nextBusinessDay(new Date());

    // Buscar objeto de sucursal seleccionado para guardarlo dentro del pedido
    const selectedBranchObj =
      branches.find((b) => b.codSucursal === selectedBranch) || null;

    const order: any = {
      id: orderNumber,
      buyer: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      },
      // si hay usuario autenticado, guardar su id para ownership
      ...(user?.codUsuario ? { buyerId: user.codUsuario } : {}),
      items: items.map((it) => ({
        productId: it.product.id,
        name: it.product.name,
        price: it.product.price,
        quantity: it.quantity,
      })),
      total: totalPrice,
      branch: selectedBranchObj || selectedBranch,
      status: "Confirmado",
      paymentMethod,
      createdAt: new Date().toISOString(),
      pickupAt: pickupDate.toISOString(),
    };

    try {
      // Guardar en localStorage como fallback / historial local
      const key = "bs_orders_v1";
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      arr.push(order);
      localStorage.setItem(key, JSON.stringify(arr));

      // notificar por navegación a la página de confirmación en lugar de mostrar toast
    } catch (err) {
      console.error("Error guardando pedido:", err);
      toast.error("Ocurrió un error al guardar el pedido localmente");
    }

    clearCart();
    // Navegar a la página de confirmación y pasar datos del pedido
    navigate("/order-confirmation", {
      state: {
        orderId: orderNumber,
        pickupAt: pickupDate.toISOString(),
        order,
      },
    });
  };

  return (
    <div className={styles.container}>
      <h2>Checkout</h2>
      <div className={styles.content}>
        <section className={styles.formSection}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <h3 style={{ margin: 0 }}>Datos del encargado del retiro</h3>
            {isAuthenticated && (
              <button
                type="button"
                onClick={applyProfile}
                className={styles.profileBtn}
                disabled={isProfileApplied()}
                title={
                  isProfileApplied()
                    ? "Datos ya coinciden con tu perfil"
                    : "Rellenar con datos del perfil"
                }
              >
                Usar datos del perfil
              </button>
            )}
          </div>
          {prefilled && (
            <div className={styles.prefilledNote}>
              Datos precargados desde tu perfil. Puedes editarlos antes de
              confirmar.
            </div>
          )}
          <label>Nombre</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <label>Apellido</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <label>Celular</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />

          <hr
            style={{
              margin: "20px 0",
              border: "none",
              borderTop: "1px solid #ddd",
            }}
          />

          <label>Sucursal del retiro</label>
          {branchesError ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ color: "#b00020" }}>
                No se pudieron cargar las sucursales: {branchesError}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className={styles.clearBtn}
                  onClick={() => fetchBranches()}
                >
                  Reintentar sucursales
                </button>
                <button
                  className={styles.clearBtn}
                  onClick={() => setBranchesError(null)}
                >
                  Ocultar
                </button>
              </div>
            </div>
          ) : (
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="">-- Selecciona una sucursal --</option>
              {branches.map((b) => (
                <option key={b.codSucursal} value={b.codSucursal}>
                  {b.nombre} {b.calle ? `- ${b.calle}` : ""}
                  {b.altura ? ` ${b.altura}` : ""}
                </option>
              ))}
            </select>
          )}

          <label>Método de pago</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            {paymentMethods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </section>

        <section className={styles.summarySection}>
          <h3>Resumen del pedido</h3>
          {items.length === 0 ? (
            <div>No hay productos en el carrito.</div>
          ) : (
            <ul className={styles.list}>
              {items.map((it) => (
                <li key={it.product.id} className={styles.item}>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    <div style={{ fontWeight: 600 }}>{it.product.name}</div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <button
                        onClick={() =>
                          updateQuantity(it.product.id, it.quantity - 1)
                        }
                      >
                        -
                      </button>
                      <input
                        style={{ width: 60, textAlign: "center" }}
                        type="number"
                        value={it.quantity}
                        min={1}
                        onChange={(e) => {
                          const v = parseInt(e.target.value || "0", 10);
                          if (isNaN(v) || v < 1) return;
                          updateQuantity(it.product.id, v);
                        }}
                      />
                      <button
                        onClick={() =>
                          updateQuantity(it.product.id, it.quantity + 1)
                        }
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(it.product.id)}
                        style={{ marginLeft: 8 }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div>${(it.product.price * it.quantity).toFixed(2)}</div>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.total}>Total: ${totalPrice.toFixed(2)}</div>
          <div className={styles.actions}>
            <div className={styles.tooltipWrapper}>
              <button
                onClick={handleConfirm}
                className={styles.payBtn}
                disabled={items.length === 0}
              >
                Confirmar compra
              </button>
              {items.length === 0 && (
                <div className={styles.tooltip}>
                  Agrega productos al carrito primero
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CheckoutPage;
