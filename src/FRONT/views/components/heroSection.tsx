
import styles from "./heroSection.module.css";
import Interior from "../../../assets/interiorBarberia.avif";

const HeroSection = () => {
    return (
        <section className={styles.section}>
            <div className={styles.content}>
            <h2 className={styles.accent}>Mecha's Barbershop</h2>
                <p className={styles.description}>
                    Nos dedicamos a ofrecer servicios de barbería de alta calidad. Nuestro equipo de barberos expertos está comprometido a brindarte el mejor corte de cabello y afeitado, adaptándose a tus necesidades y estilo personal.
                </p>
                <p className={styles.description}>
                ¡Registrate para agendar tu primer turno!
                </p>
                <a href="/signUp" className={styles.primaryButton}>Crear Cuenta</a>
                <p className={styles.description}>
                ¡Inicia sesión si ya tienes una cuenta!
                </p>
                <a href="/login" className={styles.primaryButton}>Iniciar Sesión</a>

            </div>
            <div className={styles.mediaWrap}>
                <img src={Interior} alt="Interior Barbershop" className={styles.image} />
                <div className={styles.imageOverlay} />
            </div>
        </section>
    );
};

export default HeroSection;