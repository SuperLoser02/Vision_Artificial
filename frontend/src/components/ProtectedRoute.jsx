import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requireProfile = false }) => {
    const authToken = localStorage.getItem('authToken');
    const perfilToken = localStorage.getItem('perfilToken');
    
    // Si no hay token de empresa, redirigir al login
    if (!authToken) {
        return <Navigate to="/login" replace />;
    }
    
    if (requireProfile && !perfilToken) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

export default ProtectedRoute;