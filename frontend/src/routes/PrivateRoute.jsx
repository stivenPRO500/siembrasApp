import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = () => {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/login" />;
    const role = localStorage.getItem('role');
    const requiere = localStorage.getItem('requiereSuscripcion') === 'true';
    const exp = localStorage.getItem('suscripcionExpira');
    const suspendido = localStorage.getItem('suscripcionSuspendido') === 'true';
    const enGracia = localStorage.getItem('enGracia') === 'true';
    let expirada = false;
    if (exp) {
        try { expirada = new Date(exp) <= new Date(); } catch {}
    }
    // Reglas:
    // Admin siempre entra.
    // Suspendido siempre redirige.
    // Colaborador ('usuario'): redirige si requiereSuscripcion y no está en gracia.
    // Agricultor: sólo redirige si suspendido.
    if (role !== 'admin') {
        if (suspendido) return <Navigate to="/suscripcion" />;
        if (role === 'usuario') {
            if (requiere && !enGracia) return <Navigate to="/suscripcion" />;
        }
        // Agricultor no se bloquea por expiración.
    }
    return <Outlet />;
};

export default PrivateRoute;
