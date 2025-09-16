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
import AgregarUsuario from "./pages/AgregarUsuario";
import PrivateRoute from "./routes/PrivateRoute";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />

            {/* Rutas protegidas */}
            <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/actividades/:manzanaId" element={<Actividades />} /> {/* ✅ Agregado */}
                <Route path="/agregar-usuario" element={<AgregarUsuario />} /> {/* ✅ Nueva ruta */}
            </Route>
        </Routes>
    );
}

export default App;

