import styles from './footer.module.css';

function Footer() {
  // const styles: React.CSSProperties = {
  //   position: "absolute",
  //   left: 0,
  //   right: 0,
  //   bottom: 0,
  //   height: "4rem",
  //   backgroundColor: "var(--color-gray-800)",
  //   color: "white",
  //   paddingTop: "1rem",
  //   paddingBottom: "1rem",
  //   textAlign: "center",
  // }

  return (
    <footer className={styles.footer} >
      <p>© 2025 Mechas Barbershop</p>
    </footer>
  );
}

export default Footer;
