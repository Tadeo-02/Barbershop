import React from "react";
import styles from "./cartSummary.module.css";
import { useCart } from "./CartContext";
import { useNavigate } from "react-router-dom";

const CartSummary: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const { items, removeItem, clearCart, updateQuantity, totalItems, totalPrice } = useCart();
    const navigate = useNavigate();

    return (
        <div className={styles.drawerContainer} role="dialog" aria-label="Resumen del carrito">
            <div className={styles.drawer}>
                <div className={styles.header}>
                    <h3>Carrito ({totalItems})</h3>
                    <button onClick={onClose} className={styles.closeBtn} aria-label="Cerrar">
                        Cerrar
                    </button>
                </div>

                <div className={styles.content}>
                    {items.length === 0 ? (
                        <div className={styles.empty}>No hay productos en el carrito.</div>
                    ) : (
                        <ul className={styles.list}>
                            {items.map((it) => (
                                <li key={it.product.id} className={styles.item}>
                                    <img src={it.product.image || "/images/logoBarber.png"} alt={it.product.name} />
                                    <div className={styles.info}>
                                        <div className={styles.name}>{it.product.name}</div>
                                        <div className={styles.qty}>
                                            <div className={styles.qtyControls}>
                                                <button
                                                    className={styles.qtyBtn}
                                                    onClick={() => updateQuantity(it.product.id, it.quantity - 1)}
                                                    aria-label={`Reducir cantidad de ${it.product.name}`}
                                                >
                                                    -
                                                </button>
                                                <input
                                                    className={styles.qtyInput}
                                                    type="number"
                                                    min={1}
                                                    value={it.quantity}
                                                    onChange={(e) => {
                                                        const v = parseInt(e.target.value || "0", 10);
                                                        if (isNaN(v) || v < 1) return;
                                                        updateQuantity(it.product.id, v);
                                                    }}
                                                    aria-label={`Cantidad de ${it.product.name}`}
                                                />
                                                <button
                                                    className={styles.qtyBtn}
                                                    onClick={() => updateQuantity(it.product.id, it.quantity + 1)}
                                                    aria-label={`Aumentar cantidad de ${it.product.name}`}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <div className={styles.price}>${(it.product.price * it.quantity).toFixed(2)}</div>
                                    </div>
                                    <button onClick={() => removeItem(it.product.id)} className={styles.removeBtn}>
                                        Eliminar
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className={styles.footer}>
                    <div className={styles.total}>Total: ${totalPrice.toFixed(2)}</div>
                    <div className={styles.actions}>
                        <button onClick={clearCart} className={styles.clearBtn}>
                            Vaciar carrito
                        </button>
                        <button
                            className={styles.checkoutBtn}
                            onClick={() => {
                                if (onClose) onClose();
                                navigate("/checkout");
                            }}
                        >
                            Ir al pago
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartSummary;
