import { Link } from "react-router-dom";
import styles from "./Home.module.css"; // Importar estilos como módulo

const Home = () => {
  return (
    <div className={styles.main}>
      {/* Fondo Animado */}
      <div className={styles.d1}></div>
      <div className={styles.d2}></div>
      <div className={styles.d3}></div>
      <div className={styles.d4}></div>

      {/* Contenido Principal */}
      <div className={styles.contenido}>
        <h1>Bienvenido a Siembras App</h1>
        <Link to="/login">Iniciar Sesión</Link>
      </div>
    </div>
  );
};

export default Home;
