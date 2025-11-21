import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerMiPerfil, cambiarContraseñaPerfil, cerrarSesionPerfil, obtenerCategorias } from "../../services/Api";

const MiPerfil = () => {
    const [perfil, setPerfil] = useState(null);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        contraseña_actual: "",
        contraseña_nueva: "",
        confirmar_contraseña: ""
    });
    const [passwordError, setPasswordError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        cargarPerfil();
        cargarCategorias();
    }, []);

    const cargarCategorias = async () => {
        try {
            const data = await obtenerCategorias();
            setCategorias(data);
        } catch (error) {
            console.error('Error al cargar categorías:', error);
        }
    };

    const cargarPerfil = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('perfilToken');

            if (!token) {
                alert('No hay sesión activa. Por favor inicia sesión.');
                navigate('/perfil');
                return;
            }

            const data = await obtenerMiPerfil(token);
            console.log('DATOS DEL PERFIL:', data);
            console.log('CATEGORÍAS:', data.categorias);
            console.log('TIPO DE CATEGORÍAS:', typeof data.categorias);
            if (Array.isArray(data.categorias)) {
                console.log('ES ARRAY, LONGITUD:', data.categorias.length);
                console.log('PRIMER ELEMENTO:', data.categorias[0]);
            }
            setPerfil(data);
            setError("");
        } catch (err) {
            console.error('Error al cargar perfil:', err);
            setError(err.detail || err.error || 'Error al cargar los datos del perfil');

            if (err.status === 401 || err.status === 404) {
                alert('Sesión expirada o inválida. Por favor inicia sesión nuevamente.');
                localStorage.removeItem('perfilToken');
                localStorage.removeItem('perfilActual');
                navigate('/perfil');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });
        setPasswordError("");
    };

    const handleSubmitPassword = async (e) => {
        e.preventDefault();
        setPasswordError("");
        setSuccessMessage("");

        // Validaciones
        if (!passwordData.contraseña_actual || !passwordData.contraseña_nueva || !passwordData.confirmar_contraseña) {
            setPasswordError("Todos los campos son obligatorios");
            return;
        }

        if (passwordData.contraseña_nueva.length < 8) {
            setPasswordError("La contraseña nueva debe tener al menos 8 caracteres");
            return;
        }

        if (passwordData.contraseña_nueva !== passwordData.confirmar_contraseña) {
            setPasswordError("Las contraseñas nuevas no coinciden");
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('perfilToken');

            await cambiarContraseñaPerfil(perfil.id, {
                token,
                contraseña_actual: passwordData.contraseña_actual,
                contraseña_nueva: passwordData.contraseña_nueva,
                confirmar_contraseña: passwordData.confirmar_contraseña
            });

            setSuccessMessage("Contraseña actualizada exitosamente");
            setPasswordData({
                contraseña_actual: "",
                contraseña_nueva: "",
                confirmar_contraseña: ""
            });

            setTimeout(() => {
                setShowPasswordModal(false);
                setSuccessMessage("");
            }, 2000);
        } catch (err) {
            console.error('Error al cambiar contraseña:', err);
            setPasswordError(err.detail || err.error || 'Error al cambiar la contraseña');
        } finally {
            setLoading(false);
        }
    };

    const handleCerrarSesion = async () => {
        if (!window.confirm('¿Estás seguro que deseas cerrar sesión?')) {
            return;
        }

        try {
            const token = localStorage.getItem('perfilToken');

            if (token) {
                await cerrarSesionPerfil(token);
            }

            localStorage.removeItem('perfilToken');
            localStorage.removeItem('perfilActual');

            alert('Sesión cerrada exitosamente');
            navigate('/perfil');
        } catch (err) {
            console.error('Error al cerrar sesión:', err);
            // Aunque falle, limpiamos el local storage
            localStorage.removeItem('perfilToken');
            localStorage.removeItem('perfilActual');
            navigate('/perfil');
        }
    };

    const getInitials = (nombre, apellido) => {
        if (!nombre || !apellido) return "??";
        return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
    };

    const getAvatarColor = () => {
        if (!perfil) return 'bg-gray-500';
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
        return colors[perfil.id % colors.length];
    };

    if (loading && !perfil) {
        return (
            <div className="w-full min-h-[400px] flex items-center justify-center">
                <div className="text-gray-600 text-2xl">Cargando perfil...</div>
            </div>
        );
    }

    if (error && !perfil) {
        return (
            <div className="w-full min-h-[400px] flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                    <p className="text-red-600 text-xl mb-4">{error}</p>
                    <button
                        onClick={cargarPerfil}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 mb-2"
                    >
                        Reintentar
                    </button>
                    <button
                        onClick={() => navigate('/perfil')}
                        className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
                    >
                        Volver al Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-full">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">Mi Perfil</h1>
                </div>

                {/* Tarjeta de Perfil */}
                <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
                    {/* Header de la tarjeta con avatar */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8">
                        <div className="flex items-center gap-6">
                            <div className={`w-32 h-32 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-5xl font-bold text-white ${getAvatarColor()}`}>
                                {perfil && getInitials(perfil.nombre, perfil.apellido)}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-3xl font-bold text-white mb-2">
                                    {perfil?.nombre} {perfil?.apellido}
                                </h2>
                                <p className="text-white text-opacity-90 text-lg">
                                    CI: {perfil?.ci}
                                </p>
                                <p className="text-white text-opacity-80 text-sm mt-2">
                                    Miembro desde: {perfil?.fecha_creacion && new Date(perfil.fecha_creacion).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Información del perfil */}
                    <div className="p-8">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">Información Personal</h3>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Cédula de Identidad</p>
                                <p className="text-lg text-gray-800 font-medium">{perfil?.ci}</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Correo Electrónico</p>
                                <p className="text-lg text-gray-800 font-medium">{perfil?.email || 'No especificado'}</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Teléfono</p>
                                <p className="text-lg text-gray-800 font-medium">{perfil?.telefono || 'No especificado'}</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Fecha de Nacimiento</p>
                                <p className="text-lg text-gray-800 font-medium">
                                    {perfil?.fecha_nacimiento
                                        ? new Date(perfil.fecha_nacimiento).toLocaleDateString()
                                        : 'No especificado'}
                                </p>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                                <p className="text-sm text-blue-600 mb-1 font-semibold">Rol</p>
                                <p className="text-lg text-gray-800 font-medium">
                                    {perfil?.rol === 'guardia_seguridad' ? 'Guardia de Seguridad' :
                                        perfil?.rol === 'jefe_seguridad' ? 'Jefe de Seguridad' :
                                            'No especificado'}
                                </p>
                            </div>

                            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                                <p className="text-sm text-purple-600 mb-1 font-semibold">Categoría</p>
                                <p className="text-lg text-gray-800 font-medium">
                                    {(() => {
                                        if (!perfil?.categorias) return 'No especificado';
                                        
                                        // Si es un array de IDs (números)
                                        if (Array.isArray(perfil.categorias)) {
                                            if (perfil.categorias.length === 0) return 'No especificado';
                                            
                                            // Si son números (IDs), buscar nombres en el array de categorías
                                            if (typeof perfil.categorias[0] === 'number') {
                                                const nombres = perfil.categorias
                                                    .map(catId => {
                                                        const cat = categorias.find(c => c.id === catId);
                                                        return cat ? cat.nombre : `ID: ${catId}`;
                                                    })
                                                    .join(', ');
                                                return nombres || 'No especificado';
                                            }
                                            
                                            // Si son objetos con propiedad 'nombre'
                                            if (typeof perfil.categorias[0] === 'object' && perfil.categorias[0]?.nombre) {
                                                return perfil.categorias.map(cat => cat.nombre).join(', ');
                                            }
                                            
                                            // Si son strings directamente
                                            return perfil.categorias.join(', ');
                                        }
                                        
                                        // Si es un número único (ID), buscar el nombre
                                        if (typeof perfil.categorias === 'number') {
                                            const cat = categorias.find(c => c.id === perfil.categorias);
                                            return cat ? cat.nombre : `ID: ${perfil.categorias}`;
                                        }
                                        
                                        // Si es un objeto o string directo
                                        if (typeof perfil.categorias === 'object' && perfil.categorias.nombre) {
                                            return perfil.categorias.nombre;
                                        }
                                        
                                        if (typeof perfil.categorias === 'string') {
                                            return perfil.categorias;
                                        }
                                        
                                        return 'No especificado';
                                    })()}
                                </p>
                            </div>
                        </div>

                        {perfil?.direccion && (
                            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Dirección</p>
                                <p className="text-lg text-gray-800 font-medium">{perfil.direccion}</p>
                            </div>
                        )}

                        {perfil?.zonas_asignadas && perfil.zonas_asignadas.length > 0 && (
                            <div className="mt-6 bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                                <p className="text-sm text-green-600 mb-2 font-semibold">Zonas Asignadas</p>
                                <div className="flex flex-wrap gap-2">
                                    {perfil.zonas_asignadas.map((zona, index) => (
                                        <span
                                            key={index}
                                            className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                                        >
                                            {zona}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Mensaje de éxito */}
                        {successMessage && !showPasswordModal && (
                            <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                                {successMessage}
                            </div>
                        )}

                        {/* Botones de acción */}
                        <div className="mt-8 flex flex-wrap gap-4">
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                Cambiar Contraseña
                            </button>
                            <button
                                onClick={handleCerrarSesion}
                                className="flex-1 bg-red-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modal para cambiar contraseña */}
                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-6 text-gray-800">Cambiar Contraseña</h2>

                            {passwordError && (
                                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                    {passwordError}
                                </div>
                            )}

                            {successMessage && (
                                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                                    {successMessage}
                                </div>
                            )}

                            <form onSubmit={handleSubmitPassword}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 font-medium mb-2">
                                        Contraseña Actual
                                    </label>
                                    <input
                                        type="password"
                                        name="contraseña_actual"
                                        value={passwordData.contraseña_actual}
                                        onChange={handlePasswordChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder="Contraseña actual"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 font-medium mb-2">
                                        Contraseña Nueva
                                    </label>
                                    <input
                                        type="password"
                                        name="contraseña_nueva"
                                        value={passwordData.contraseña_nueva}
                                        onChange={handlePasswordChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder="Mínimo 8 caracteres"
                                        minLength={8}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="block text-gray-700 font-medium mb-2">
                                        Confirmar Contraseña Nueva
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmar_contraseña"
                                        value={passwordData.confirmar_contraseña}
                                        onChange={handlePasswordChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder="Repite la contraseña nueva"
                                        minLength={8}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                                    <p className="text-sm text-yellow-700">
                                        <strong>Nota:</strong> La contraseña debe tener al menos 8 caracteres.
                                        Después de cambiarla, podrás continuar usando el sistema normalmente.
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPasswordModal(false);
                                            setPasswordError("");
                                            setPasswordData({
                                                contraseña_actual: "",
                                                contraseña_nueva: "",
                                                confirmar_contraseña: ""
                                            });
                                        }}
                                        disabled={loading}
                                        className="flex-1 bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-500 transition-all duration-300"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MiPerfil;
