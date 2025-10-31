import { useState, useRef, useEffect } from "react"; // <-- IMPORTA useRef y useEffect
import styles from "./OrderPage.module.css";

// 1. Definición de la estructura de datos (sin cambios)
interface Order {
  orderNumber: string;
  status: string;
  date: string;
  totalPrice: number;
  paymentMethod: string;
  client: {
    dni: string;
    name: string;
    lastName: string;
  };
  items: {
    id: number;
    quantity: number;
    product: {
      name: string;
    };
  }[];
}

// 2. Datos de prueba (sin cambios)
const sampleOrder: Order = {
  orderNumber: "BS-1761935916215-5860",
  status: "Pagado",
  date: "2025-10-31",
  totalPrice: 20,
  paymentMethod: "Billetera virtual",
  client: {
    dni: "35.123.456",
    name: "Chris",
    lastName: "Paul",
  },
  items: [
    { id: 1, quantity: 1, product: { name: "Cera modeladora mate" } },

  ],
};

function OrderPage() {
  const [order, setOrder] = useState(sampleOrder);
  const [isDelivered, setIsDelivered] = useState(false);
  
  // 3. Creamos una referencia para el mensaje de éxito
  const successMessageRef = useRef<HTMLDivElement>(null);

  const handleDeliverClick = () => {
    setOrder(prevOrder => ({ ...prevOrder, status: "Retirado" }));
    setIsDelivered(true);
  };

  // 4. Usamos useEffect para que se ejecute el scroll DESPUÉS de que el componente se actualice
  useEffect(() => {
    if (isDelivered && successMessageRef.current) {
      // Hacemos que la vista se desplace suavemente hasta el mensaje
      successMessageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isDelivered]); // Este código se ejecuta solo cuando 'isDelivered' cambia a true

  return (
    <div className={styles.orderContainer}>
      {isDelivered && (
        // 5. Asignamos la referencia al div del mensaje
        <div ref={successMessageRef} className={styles.successMessage}>
          Pedido retirado con éxito.
        </div>
      )}

      <div className={styles.orderDetails}>
        <h2 className={styles.pageTitle}>Detalles del Pedido</h2>
        
        {/* El resto del JSX no cambia */}
        <div className={styles.detailSection}>
          <p><strong>Número de Orden:</strong> {order.orderNumber}</p>
          <p><strong>Estado:</strong> <span className={styles.status}>{order.status}</span></p>
          <p><strong>Fecha:</strong> {new Date(order.date).toLocaleDateString()}</p>
          <p><strong>Precio Total:</strong> ${order.totalPrice.toFixed(2)}</p>
          <p><strong>Medio de Pago:</strong> {order.paymentMethod}</p>
        </div>

        <div className={styles.detailSection}>
            <h3>Cliente</h3>
            <p><strong>DNI:</strong> {order.client.dni}</p>
            <p><strong>Nombre:</strong> {order.client.name} {order.client.lastName}</p>
        </div>

        <div className={styles.detailSection}>
            <h3>Productos</h3>
            <ul>
                {order.items.map((item) => (
                <li key={item.id}>
                    {item.product.name} - <strong>Cantidad:</strong> {item.quantity}
                </li>
                ))}
            </ul>
        </div>

        {!isDelivered && (
          <button
            onClick={handleDeliverClick}
            className={`${styles.button} ${styles.buttonDeliver}`}
          >
            Retirar Pedido
          </button>
        )}
      </div>
    </div>
  );
}

export default OrderPage;