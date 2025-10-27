import { useNavigate } from "react-router-dom";
import styles from "./DeliveriesPage.module.css";

function DeliveriesPage() {
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Es mejor práctica mantener las rutas anidadas
    navigate("/barber/order");
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Buscar pedido</h1>
      <form onSubmit={handleSearch}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="numeroOrden">
            Número de orden
          </label>
          <input
            className={styles.formInput}
            type="text"
            name="numeroOrden"
            id="numeroOrden"
            placeholder="0000000"
            required
          />
        </div>
        <button
          type="submit"
          className={`${styles.button} ${styles.buttonSuccess}`}
        >
          Buscar
        </button>
      </form>
    </div>
  );
}

export default DeliveriesPage;