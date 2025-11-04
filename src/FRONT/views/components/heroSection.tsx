
import styles from "./heroSection.module.css";
import Interior from "../../../assets/interiorBarberia.avif";

const HeroSection = () => {
    return (
      <section className={styles.section}>
        <div className={styles.content}>
          <p className={styles.intro}>
            Ofrecemos servicios de barbería de alta calidad, con barberos
            expertos que se adaptan a tu estilo y necesidades.
          </p>
          <p className={styles.description}>
            ¡Registrate para agendar tu primer turno!
          </p>
          <a href="/signUp" className={styles.primaryButton}>
            Crear Cuenta
          </a>
          <p className={styles.description}>
            ¡Inicia sesión si ya tienes una cuenta!
          </p>
          <a href="/login" className={styles.primaryButton}>
            Iniciar Sesión
          </a>
        </div>
        <div className={styles.mediaWrap}>
          <img
            src={Interior}
            alt="Interior Barbershop"
            className={styles.image}
          />
          <div className={styles.imageOverlay} />
        </div>
      </section>
    );
};

export default HeroSection;