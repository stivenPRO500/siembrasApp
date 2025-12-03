/*
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./routes/PrivateRoute";


function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            
            <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                
            </Route>
            
        </Routes>
    );
}

export default App;*/

import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Actividades from "./pages/Actividades"; // ✅ Importar la página de actividades
import Catalogo from "./pages/Catalogo"; // ✅ Catálogo de productos
import Cosechas from "./pages/Cosechas"; // ✅ Página de cosechas
import Graficas from "./pages/Graficas";
import Suscripcion from "./pages/Suscripcion";
import AgregarUsuario from "./pages/AgregarUsuario";
import AdminSuscripciones from "./pages/AdminSuscripciones";
import PrivateRoute from "./routes/PrivateRoute";
import RegistroSuscripcion from "./pages/RegistroSuscripcion";
import Colaboradores from "./pages/Colaboradores";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<RegistroSuscripcion />} />

            {/* Rutas protegidas */}
            <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/actividades/:manzanaId" element={<Actividades />} /> {/* ✅ Agregado */}
                <Route path="/agregar-usuario" element={<AgregarUsuario />} /> {/* ✅ Nueva ruta */}
                <Route path="/admin-suscripciones" element={<AdminSuscripciones />} />
                <Route path="/catalogo" element={<Catalogo />} /> {/* ✅ Catálogo */}
                <Route path="/cosechas" element={<Cosechas />} /> {/* ✅ Cosechas */}
                <Route path="/graficas" element={<Graficas />} />
                <Route path="/suscripcion" element={<Suscripcion />} />
                <Route path="/colaboradores" element={<Colaboradores />} />
            </Route>
        </Routes>
    );
}

export default App;
