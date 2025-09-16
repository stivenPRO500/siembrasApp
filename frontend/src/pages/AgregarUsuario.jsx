import React, { useState, useEffect } from "react";
import styles from "./AgregarUsuario.module.css";
import { useNavigate } from "react-router-dom";



const AgregarUsuario = () => {
    const [formVisible, setFormVisible] = useState(false);
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        role: "usuario",
    });
    const [usuarios, setUsuarios] = useState([]);
    const [token, setToken] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const userRole = localStorage.getItem("role");

        if (userRole !== "admin") {
            navigate("/");
        } else {
            setToken(storedToken);
            fetchUsuarios(storedToken);
        }
    }, [navigate]);

    const fetchUsuarios = async (authToken) => {
        try {
            const res = await fetch("http://localhost:4000/auth/usuarios", {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            const data = await res.json();
            setUsuarios(data);
        } catch (error) {
            console.error("Error al obtener usuarios:", error);
        }
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:4000/auth/crear", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(form),
            });

            const data = await response.json();
            if (response.ok) {
                alert("Usuario creado con éxito");
                setForm({ username: "", email: "", password: "", role: "usuario" });
                setFormVisible(false); // Ocultar formulario después de crear
                fetchUsuarios(token);
            } else {
                alert(data.message || "Error al crear usuario");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error en el servidor");
        }
    };

    const handleEliminar = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar este usuario?")) return;

        try {
            const res = await fetch(`http://localhost:4000/auth/usuarios/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();
            if (res.ok) {
                alert("Usuario eliminado");
                setUsuarios(usuarios.filter((u) => u._id !== id));
            } else {
                alert(data.message || "Error al eliminar");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };



    return (

        
           <div>
            {/* Topbar separado */}
            <div className={styles.topBar}>
               <h2 className={styles.titulo}>Panel de Administración</h2>
                <div className={styles.topBarButtons}>
                    <button
                        className={styles.regresarBtn}
                        onClick={() => navigate(-1)}
                        aria-label="Regresar"
                    >
                        ← Regresar
                    </button>
                    <button
                        className={styles.verManzanasBtn}
                        onClick={() => navigate("/dashboard")}
                        aria-label="Ver manzanas"
                    >
                        Ver Manzanas
                    </button>
                </div>
            </div>

            <div className={styles.container} style={{ position: "relative" }}>
                {/* Botón superior izquierdo */}

           
            <h2>Gestión de Usuarios</h2>

            <button className={styles.addButton} onClick={() => setFormVisible(!formVisible)}>
                {formVisible ? "Cerrar Formulario" : "Agregar Usuario"}
            </button>

            {formVisible && (
                <form onSubmit={handleSubmit} className={styles.form}>
                    <label>Nombre de usuario:</label>
                    <input type="text" name="username" value={form.username} onChange={handleChange} required />

                    <label>Email:</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} required />

                    <label>Contraseña:</label>
                    <input type="password" name="password" value={form.password} onChange={handleChange} required />

                    <label>Rol:</label>
                    <select name="role" value={form.role} onChange={handleChange}>
                        <option value="usuario">Usuario</option>
                        <option value="admin">Administrador</option>
                    </select>

                    <button type="submit">Registrar Usuario</button>
                </form>
            )}

            <h3>Lista de Usuarios</h3>
            <ul className={styles.userList}>
                {usuarios.map((user) => (
                    <li key={user._id} className={styles.userItem}>
                        <span><strong>{user.username}</strong> ({user.role})</span>
                        <button onClick={() => handleEliminar(user._id)} className={styles.deleteButton}>
                            Eliminar
                        </button>
                    </li>
                ))}
            </ul>
        </div>
        </div>
    );
};

export default AgregarUsuario;
