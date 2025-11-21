import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerPerfiles, crearPerfil } from "../../services/Api";
import QRCode from "qrcode";
import { generarQrVinculacion } from "../../services/Api";

const PerfilCRUD = () => {
    const [perfiles, setPerfiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [contraseñaTemporal, setContraseñaTemporal] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [qrToken, setQrToken] = useState("");
    const [qrExpira, setQrExpira] = useState("");
    const [qrLoading, setQrLoading] = useState(false);
    const [qrPerfilId, setQrPerfilId] = useState(null);
    const [qrImage, setQrImage] = useState("");
    const [showVincularModal, setShowVincularModal] = useState(false);
    const [perfilVincular, setPerfilVincular] = useState(null);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        ci: '',
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        direccion: '',
        fecha_nacimiento: ''
    });

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
            
            // Manejar específicamente error 401 (no autenticado)
            if (err.status === 401) {
                alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }
            
            // Manejar error 500 (error del servidor)
            if (err.status === 500) {
                setError('Error del servidor. Por favor contacta al administrador o intenta de nuevo más tarde.');
            } else {
                setError(err.detail || err.error || 'Error al cargar los perfiles');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const generarQrTemporal = async (perfilId) => {
        setQrLoading(true);
        setQrToken("");
        setQrExpira("");
        setQrImage("");
        try {
            const data = await generarQrVinculacion(perfilId);
            if (data.qr_data) {
                setQrToken(data.qr_data);
                setQrExpira(data.vinculacion?.fecha_expiracion || "10 min");
                setQrPerfilId(perfilId);
                // Generar QR como imagen
                const qrUrl = await QRCode.toDataURL(data.qr_data);
                setQrImage(qrUrl);
            }
        } catch (err) {
            setQrToken("");
            setQrExpira("");
            setQrImage("");
        } finally {
            setQrLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validaciones mejoradas
        if (!formData.ci || !formData.nombre || !formData.apellido || !formData.email) {
            setError("Los campos CI, Nombre, Apellido y Email son obligatorios");
            return;
        }

        // Validar que no sean solo espacios en blanco
        if (!formData.ci.trim() || !formData.nombre.trim() || !formData.apellido.trim() || !formData.email.trim()) {
            setError("Los campos no pueden estar vacíos o contener solo espacios");
            return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError("El formato del email no es válido");
            return;
        }

        // Validar que el CI sea numérico
        if (!/^\d+$/.test(formData.ci.trim())) {
            setError("El CI debe contener solo números");
            return;
        }

        try {
            setLoading(true);
            
            // Preparar datos con trim para eliminar espacios
            const dataToSend = {
                ci: formData.ci.trim(),
                nombre: formData.nombre.trim(),
                apellido: formData.apellido.trim(),
                email: formData.email.trim(),
                telefono: formData.telefono.trim() || '',
                direccion: formData.direccion.trim() || '',
                fecha_nacimiento: formData.fecha_nacimiento || ''
            };

            console.log('Enviando datos del perfil:', dataToSend);
            
            const response = await crearPerfil(dataToSend);
            console.log('Respuesta del servidor:', response);
            
            setContraseñaTemporal(response.contraseña_temporal);
            await cargarPerfiles();
            setFormData({
                ci: '',
                nombre: '',
                apellido: '',
                email: '',
                telefono: '',
                direccion: '',
                fecha_nacimiento: ''
            });
            
            // Generar QR temporal tras crear perfil (usar id correcto)
            const perfilId = response.perfil?.id || response.id;
            if (perfilId) {
                await generarQrTemporal(perfilId);
            }
            
            setShowSuccessModal(true);
            setShowModal(false);
        } catch (err) {
            console.error('Error completo al crear perfil:', err);
            
            // Mostrar mensaje de error más específico
            let errorMessage = 'Error al crear el perfil';
            
            if (err.error) {
                errorMessage = err.error;
            } else if (err.detail) {
                errorMessage = err.detail;
            } else if (err.ci) {
                errorMessage = `Error en CI: ${err.ci[0]}`;
            } else if (err.email) {
                errorMessage = `Error en Email: ${err.email[0]}`;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerarNuevoQr = async () => {
        if (qrPerfilId) {
            await generarQrTemporal(qrPerfilId);
        }
    };

    // Para botón de vinculación en la lista de perfiles
    const handleVincularDispositivo = async (perfil) => {
        setPerfilVincular(perfil);
        setShowVincularModal(true);
        await generarQrTemporal(perfil.id);
    };

    const handleCerrarVincularModal = () => {
        setShowVincularModal(false);
        setPerfilVincular(null);
        setQrToken("");
        setQrExpira("");
        setQrPerfilId(null);
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

    return (
        <div className="min-h-screen w-screen bg-gradient-to-r from-blue-500 to-purple-600 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white">Gestión de Perfiles</h1>
                        <p className="text-white text-opacity-80 mt-2">
                            Administra los guardias de tu empresa
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-100 transition-all duration-300"
                        >
                            + Crear Perfil
                        </button>
                        <button
                            onClick={() => navigate('/perfil')}
                            className="bg-gray-500 bg-opacity-50 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-opacity-70 transition-all duration-300"
                        >
                            Volver
                        </button>
                    </div>
                </div>

                {/* Error global */}
                {error && !showModal && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {/* Lista de perfiles */}
                {loading && perfiles.length === 0 ? (
                    <div className="text-white text-center text-2xl py-20">
                        Cargando perfiles...
                    </div>
                ) : perfiles.length === 0 ? (
                    <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-12 text-center text-white">
                        <h2 className="text-2xl font-bold mb-4">No hay perfiles registrados</h2>
                        <p className="mb-6">Crea el primer perfil de guardia para tu empresa</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-100"
                        >
                            + Crear Primer Perfil
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {perfiles.map((perfil) => (
                            <div
                                key={perfil.id}
                                className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 shadow-lg hover:shadow-2xl transition-all duration-300"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white ${getRandomColor(perfil.id)}`}>
                                        {getInitials(perfil.nombre, perfil.apellido)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-white">
                                            {perfil.nombre} {perfil.apellido}
                                        </h3>
                                        <p className="text-white text-opacity-70 text-sm">
                                            CI: {perfil.ci}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 text-white text-sm">
                                    <p>
                                        <span className="font-semibold">Email:</span> {perfil.email}
                                    </p>
                                    {perfil.rol && (
                                        <p>
                                            <span className="font-semibold">Rol:</span> {perfil.rol === 'jefe_seguridad' ? '👔 Jefe de Seguridad' : '🛡️ Guardia de Seguridad'}
                                        </p>
                                    )}
                                    {perfil.zona_detalle && (
                                        <p>
                                            <span className="font-semibold">Zona:</span> {perfil.zona_detalle.nombre}
                                        </p>
                                    )}
                                    {perfil.telefono && (
                                        <p>
                                            <span className="font-semibold">Teléfono:</span> {perfil.telefono}
                                        </p>
                                    )}
                                    {perfil.direccion && (
                                        <p>
                                            <span className="font-semibold">Dirección:</span> {perfil.direccion}
                                        </p>
                                    )}
                                    {perfil.fecha_nacimiento && (
                                        <p>
                                            <span className="font-semibold">F. Nacimiento:</span> {perfil.fecha_nacimiento}
                                        </p>
                                    )}
                                    <p className="text-xs text-white text-opacity-60">
                                        Creado: {new Date(perfil.fecha_creacion).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => handleVincularDispositivo(perfil)}
                                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                                    >
                                        Vincular dispositivo
                                    </button>
                                    <button
                                        onClick={() => navigate(`/perfil-editar/${perfil.id}`)}
                                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
                                    >
                                        Editar Perfil
                                    </button>
                                </div>
                            </div>
                        ))}
                {/* Modal de éxito con QR tras crear perfil */}
                {showSuccessModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full flex flex-col items-center">
                            <h2 className="text-2xl font-bold mb-4 text-blue-700">¡Perfil creado exitosamente!</h2>
                            {contraseñaTemporal && (
                                <div className="mb-4 text-sm text-gray-700">
                                    <strong>Contraseña temporal:</strong> <span className="bg-blue-100 px-2 py-1 rounded">{contraseñaTemporal}</span>
                                    <div className="mt-2 text-xs text-gray-600">Guarda esta contraseña, es la única vez que se mostrará.</div>
                                </div>
                            )}
                            {qrToken && (
                                <div className="mb-4 flex flex-col items-center">
                                    {qrImage && <img src={qrImage} alt="QR de vinculación" style={{ width: 180, height: 180 }} />}
                                    <div className="mt-1 text-xs text-gray-600">Expira en: <span className="bg-yellow-100 px-2 py-1 rounded">{qrExpira || "10 min"}</span></div>
                                    <button
                                        onClick={handleGenerarNuevoQr}
                                        disabled={qrLoading}
                                        className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
                                    >
                                        {qrLoading ? "Generando..." : "Generar nuevo QR temporal"}
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={() => { setShowSuccessModal(false); setContraseñaTemporal(""); setQrToken(""); setQrExpira(""); setQrPerfilId(null); }}
                                className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}

                {/* Modal de vinculación desde la lista de perfiles */}
                {showVincularModal && perfilVincular && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full flex flex-col items-center">
                            <h2 className="text-2xl font-bold mb-4 text-blue-700">Vincular dispositivo</h2>
                            <div className="mb-2 text-sm text-gray-700">
                                <strong>Perfil:</strong> {perfilVincular.nombre} {perfilVincular.apellido}
                            </div>
                            {qrToken && (
                                <div className="mb-4 flex flex-col items-center">
                                    {qrImage && <img src={qrImage} alt="QR de vinculación" style={{ width: 180, height: 180 }} />}
                                    <div className="mt-1 text-xs text-gray-600">Expira en: <span className="bg-yellow-100 px-2 py-1 rounded">{qrExpira || "10 min"}</span></div>
                                    <button
                                        onClick={handleGenerarNuevoQr}
                                        disabled={qrLoading}
                                        className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
                                    >
                                        {qrLoading ? "Generando..." : "Generar nuevo QR temporal"}
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={handleCerrarVincularModal}
                                className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
                    </div>
                )}

                {/* Modal para crear perfil */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-6 text-gray-800">Crear Nuevo Perfil</h2>
                            
                            {error && (
                                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* CI */}
                                    <div className="mb-4">
                                        <label className="block text-gray-700 font-medium mb-2">
                                            CI / Cédula *
                                        </label>
                                        <input
                                            type="text"
                                            name="ci"
                                            value={formData.ci}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            placeholder="12345678"
                                            required
                                        />
                                    </div>

                                    {/* Email */}
                                    <div className="mb-4">
                                        <label className="block text-gray-700 font-medium mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            placeholder="guardia@example.com"
                                            required
                                        />
                                    </div>

                                    {/* Nombre */}
                                    <div className="mb-4">
                                        <label className="block text-gray-700 font-medium mb-2">
                                            Nombre *
                                        </label>
                                        <input
                                            type="text"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            placeholder="Juan"
                                            required
                                        />
                                    </div>

                                    {/* Apellido */}
                                    <div className="mb-4">
                                        <label className="block text-gray-700 font-medium mb-2">
                                            Apellido *
                                        </label>
                                        <input
                                            type="text"
                                            name="apellido"
                                            value={formData.apellido}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            placeholder="Pérez García"
                                            required
                                        />
                                    </div>

                                    {/* Teléfono */}
                                    <div className="mb-4">
                                        <label className="block text-gray-700 font-medium mb-2">
                                            Teléfono
                                        </label>
                                        <input
                                            type="text"
                                            name="telefono"
                                            value={formData.telefono}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            placeholder="70123456"
                                        />
                                    </div>

                                    {/* Fecha de nacimiento */}
                                    <div className="mb-4">
                                        <label className="block text-gray-700 font-medium mb-2">
                                            Fecha de Nacimiento
                                        </label>
                                        <input
                                            type="date"
                                            name="fecha_nacimiento"
                                            value={formData.fecha_nacimiento}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        />
                                    </div>
                                </div>

                                {/* Dirección */}
                                <div className="mb-4">
                                    <label className="block text-gray-700 font-medium mb-2">
                                        Dirección
                                    </label>
                                    <textarea
                                        name="direccion"
                                        value={formData.direccion}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder="Av. Siempre viva #123"
                                        rows="2"
                                    />
                                </div>

                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                                    <p className="text-sm text-yellow-700">
                                        <span className="font-semibold">Asignación automática:</span> El primer perfil será <strong>Jefe de Seguridad</strong>. 
                                        Los siguientes serán <strong>Guardias de Seguridad</strong>.<br/>
                                        <span className="font-semibold mt-2 block">Contraseña temporal:</span> Se genera automáticamente con el formato: <code className="bg-yellow-100 px-1 rounded">INICIALES.CI</code>
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Creando...' : 'Crear Perfil'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setError("");
                                            setFormData({
                                                ci: '',
                                                nombre: '',
                                                apellido: '',
                                                email: '',
                                                telefono: '',
                                                direccion: '',
                                                fecha_nacimiento: ''
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

export default PerfilCRUD;