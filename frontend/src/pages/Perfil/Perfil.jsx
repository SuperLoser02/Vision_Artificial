import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerPerfiles, iniciarSesionPerfil } from "../../services/Api";

const Perfil = () => {
    const [perfiles, setPerfiles] = useState([]);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [enteredPassword, setEnteredPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        cargarPerfiles();
    }, []);

    const cargarPerfiles = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            
            if (!token) {
                alert('Debes iniciar sesión como administrador primero');
                navigate('/login');
                return;
            }

            const data = await obtenerPerfiles();
            setPerfiles(data);
            setError("");
        } catch (err) {
            console.error('Error al cargar perfiles:', err);
            setError(err.detail || err.error || 'Error al cargar los perfiles');
            
            // Si no está autenticado, redirigir al login
            if (err.detail === "Las credenciales de autenticación no se proveyeron." || err.status === 401) {
                alert('Sesión expirada. Por favor inicia sesión nuevamente.');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleProfileClick = (profile) => {
        setSelectedProfile(profile);
        setEnteredPassword("");
        setError("");
    };

    const handlePasswordSubmit = async () => {
        if (!enteredPassword) {
            setError("La contraseña es requerida");
            return;
        }

        try {
            setLoading(true);
            setError("");
            
            // El backend espera el ID del perfil y la contraseña
            const response = await iniciarSesionPerfil(selectedProfile.id, enteredPassword);
            
            // Guardar ambos tokens: el token DRF y el session_token
            localStorage.setItem('authToken', response.token); // Token DRF para autenticación API
            localStorage.setItem('perfilToken', response.session_token); // Token de sesión personalizado
            localStorage.setItem('perfilActual', JSON.stringify(selectedProfile));
            
            alert(`¡Bienvenido, ${selectedProfile.nombre} ${selectedProfile.apellido}!`);
            
            navigate('/dashboard');
        } catch (err) {
            console.error('Error al iniciar sesión:', err);
            setError(err.detail || err.error || 'Contraseña incorrecta');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handlePasswordSubmit();
        }
    };

    const getInitials = (nombre, apellido) => {
        return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
    };

    const getRandomColor = (id) => {
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-yellow-500',
            'bg-red-500',
            'bg-indigo-500',
            'bg-teal-500'
        ];
        return colors[id % colors.length];
    };

    if (loading && perfiles.length === 0) {
        return (
            <div className="h-screen w-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white">
                <div className="text-2xl">Cargando perfiles...</div>
            </div>
        );
    }

    if (error && perfiles.length === 0) {
        return (
            <div className="h-screen w-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white">
                <div className="bg-white text-gray-800 p-6 rounded-lg shadow-lg max-w-md">
                    <p className="text-red-600 text-xl mb-4">{error}</p>
                    <button
                        onClick={cargarPerfiles}
                        className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 w-full"
                    >
                        Reintentar
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="mt-2 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 w-full"
                    >
                        Ir al Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-gradient-to-r from-blue-500 to-purple-600 flex flex-col items-center justify-center text-white p-4 overflow-auto">
            {!selectedProfile ? (
                <>
                    <h1 className="text-4xl font-bold mb-2">Selecciona tu perfil</h1>
                    <p className="text-lg mb-8 text-white text-opacity-90">Trabajadores - Inicio de sesión</p>
                    
                    {perfiles.length === 0 ? (
                        <div className="text-center bg-white bg-opacity-10 backdrop-blur-md p-8 rounded-lg">
                            <p className="text-xl mb-4">No hay perfiles registrados</p>
                            <p className="text-sm mb-4 text-white text-opacity-80">
                                El administrador debe crear perfiles de trabajadores primero
                            </p>
                            <button
                                onClick={() => navigate('/perfil-registro')}
                                className="bg-white text-blue-600 font-semibold py-2 px-6 rounded-lg shadow-lg hover:bg-gray-100"
                            >
                                Crear Primer Perfil
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8 max-w-6xl">
                                {perfiles.map((profile) => (
                                    <div
                                        key={profile.id}
                                        className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-300"
                                        onClick={() => handleProfileClick(profile)}
                                    >
                                        {/* Avatar con iniciales */}
                                        <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-3xl md:text-4xl font-bold ${getRandomColor(profile.id)}`}>
                                            {getInitials(profile.nombre, profile.apellido)}
                                        </div>
                                        <p className="mt-4 text-lg font-medium text-center">
                                            {profile.nombre} {profile.apellido}
                                        </p>
                                        {profile.ci && (
                                            <p className="text-sm text-gray-200">CI: {profile.ci}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <button
                                onClick={() => navigate('/perfil-registro')}
                                className="bg-white text-blue-600 font-semibold py-2 px-6 rounded-lg shadow-lg hover:bg-gray-100 mb-2"
                            >
                                + Gestionar Perfiles
                            </button>
                            
                            <button
                                onClick={() => navigate('/login')}
                                className="text-white text-sm hover:text-gray-200 underline"
                            >
                                ¿Eres administrador? Volver al login
                            </button>
                        </>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center bg-white bg-opacity-10 backdrop-blur-md p-8 rounded-lg shadow-2xl max-w-md w-full">
                    <div className={`w-32 h-32 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold mb-4 ${getRandomColor(selectedProfile.id)}`}>
                        {getInitials(selectedProfile.nombre, selectedProfile.apellido)}
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-2">
                        {selectedProfile.nombre} {selectedProfile.apellido}
                    </h2>
                    <p className="text-sm text-white text-opacity-80 mb-6">CI: {selectedProfile.ci}</p>
                    
                    <div className="w-full">
                        <label className="block text-sm font-medium mb-2">
                            Introduce tu contraseña
                        </label>
                        <input
                            type="password"
                            value={enteredPassword}
                            onChange={(e) => setEnteredPassword(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="text-black px-4 py-3 rounded-lg text-center text-lg w-full focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50"
                            placeholder="Contraseña"
                            disabled={loading}
                            autoFocus
                        />
                        
                        {error && (
                            <p className="text-red-300 bg-red-600 bg-opacity-30 mt-3 p-2 rounded text-center text-sm">
                                {error}
                            </p>
                        )}
                        
                        <div className="bg-blue-50 bg-opacity-20 p-3 rounded mt-3 mb-4">
                            <p className="text-xs text-white text-opacity-90">
                                <strong>Primera vez:</strong> Usa la contraseña temporal que te dio el administrador.<br/>
                                Formato: <code className="bg-white bg-opacity-20 px-1 rounded">INICIALES.CI</code>
                            </p>
                        </div>
                        
                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={handlePasswordSubmit}
                                disabled={loading}
                                className="flex-1 bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Verificando...' : 'Confirmar'}
                            </button>
                            
                            <button
                                onClick={() => {
                                    setSelectedProfile(null);
                                    setEnteredPassword("");
                                    setError("");
                                }}
                                disabled={loading}
                                className="flex-1 bg-gray-500 bg-opacity-50 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-opacity-70 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                            >
                                Volver
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Perfil;