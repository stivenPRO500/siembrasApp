/*import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post("http://localhost:4000/auth/login", { email, password });
            
            // Guardar token en localStorage
            localStorage.setItem("token", data.token);
            
            // Redirigir al dashboard
            navigate("/dashboard");
        } catch (err) {
            setError("Credenciales incorrectas");
        }
    };

    return (
        <div>
            <h2>Iniciar Sesión</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Correo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Ingresar</button>
            </form>
        </div>
    );
};

export default Login;*/
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";
import { getBackendUrl } from '../utils/api';
//import { getBackendUrl } from "../utils/api";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); // Limpiar errores previos

        try {
            const res = await fetch(`${getBackendUrl()}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
        
            const data = await res.json();
        
            if (res.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("role", data.role);
                if (typeof data.aprobado !== 'undefined') localStorage.setItem('aprobado', String(!!data.aprobado));
                if (typeof data.requiereSuscripcion !== 'undefined') localStorage.setItem('requiereSuscripcion', String(!!data.requiereSuscripcion));
                if (data.suscripcionExpira) localStorage.setItem('suscripcionExpira', data.suscripcionExpira);
                if (typeof data.suscripcionSuspendido !== 'undefined') localStorage.setItem('suscripcionSuspendido', String(!!data.suscripcionSuspendido));
                if (typeof data.enGracia !== 'undefined') localStorage.setItem('enGracia', String(!!data.enGracia));
                // Redirigir según rol y suscripción
                if (data.role === "admin") {
                    navigate("/agregar-usuario");
                } else if (data.requiereSuscripcion) {
                    navigate('/suscripcion');
                } else {
                    navigate("/dashboard");
                }
            } else {
                setError(data.message || "Credenciales incorrectas");
            }
        } catch (err) {
            setError("Error de conexión. Intenta de nuevo.");
        }
    };

    // Registro rápido (agricultor o usuario colaborador)
    const irARegistro = () => navigate('/registro');
    

    return (
        
        
        <div className={styles.loginContainer}>
            <div className={styles.loginBox}>
                <h2>Iniciar Sesión</h2>
                {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}
                                <form className={styles.loginForm} onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Nombre de usuario"
                        className={styles.inputField}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        className={styles.inputField}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button className={styles.loginButton} type="submit">
                        Ingresar
                    </button>
                </form>
                <div className={styles.linkRow}>
                    <span className={styles.linkText} onClick={irARegistro}>
                        Crear cuenta
                    </span>
                </div>
            </div>
        </div>
        
    );
};

export default Login;
