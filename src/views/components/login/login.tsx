import styles from "./login.module.css";
import { Link } from "react-router-dom";

function Login() {
  return (
    <section id="about" className={styles.about}>
      <div className="container-fluid">
        <div className="row ">
          <div className="col-12">
            <form className={styles.form} autoComplete="on">
              <br />
              <br />
              <br />
              <h1>INICIO DE SESIÓN</h1>
              <br />
              <label>Correo electrónico:</label>
              <input
                className="form-control"
                type="email"
                name="nombreUsuario"
                placeholder="hola@ejemplo.com"
                maxLength={70}
                required
              />
              <label>Contraseña:</label>
              <input
                className="form-control"
                type="password"
                name="claveUsuario"
                pattern="[a-zA-Z0-9$@.-]{7,100}"
                maxLength={100}
                placeholder="********"
                required
              />
              <p className="has-text-centered">
                <br />
                <button
                  type="submit"
                  className="btn btn-primary"
                  value="Ingresar"
                >
                  Confirmar
                </button>
                <br />
                <br />
                <Link to="/changePassword">¿Has olvidado la contraseña?</Link>
                <br />
                <br />
                <Link to="/signUp">Crear Cuenta</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
export default Login;
