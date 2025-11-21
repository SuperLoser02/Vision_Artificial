import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerZonas, crearZona, actualizarZona, eliminarZona } from "../../services/Api";

const Zonas = () => {
    const [zonas, setZonas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("crear"); // "crear" o "editar"
    const [zonaSeleccionada, setZonaSeleccionada] = useState(null);
    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: "",
        activa: true
    });
    const navigate = useNavigate();

    useEffect(() => {
        cargarZonas();
    }, []);

    const cargarZonas = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            
            if (!token) {
                alert('Debes iniciar sesión como administrador primero');
                navigate('/login');
                return;
            }

            const data = await obtenerZonas();
            setZonas(data);
            setError("");
        } catch (err) {
            console.error('Error al cargar zonas:', err);
            
            if (err.status === 401) {
                alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }
            
            setError(err.detail || err.error || 'Error al cargar las zonas');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleAbrirModalCrear = () => {
        setModalMode("crear");
        setFormData({ nombre: "", descripcion: "", activa: true });
        setZonaSeleccionada(null);
        setShowModal(true);
        setError("");
    };

    const handleAbrirModalEditar = (zona) => {
        setModalMode("editar");
        setFormData({
            nombre: zona.nombre,
            descripcion: zona.descripcion || "",
            activa: zona.activa
        });
        setZonaSeleccionada(zona);
        setShowModal(true);
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.nombre.trim()) {
            setError("El nombre de la zona es obligatorio");
            return;
        }

        try {
            setLoading(true);

            if (modalMode === "crear") {
                await crearZona(formData);
                alert('Zona creada exitosamente');
            } else {
                await actualizarZona(zonaSeleccionada.id, formData);
                alert('Zona actualizada exitosamente');
            }

            await cargarZonas();
            setShowModal(false);
            setFormData({ nombre: "", descripcion: "", activa: true });
        } catch (err) {
            console.error('Error al guardar zona:', err);
            setError(err.error || err.detail || 'Error al guardar la zona');
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async (zona) => {
        if (!window.confirm(`¿Estás seguro de eliminar la zona "${zona.nombre}"?\n\nEsta acción desvinculará perfiles y cámaras asignadas.`)) {
            return;
        }

        try {
            setLoading(true);
            await eliminarZona(zona.id);
            alert('Zona eliminada exitosamente');
            await cargarZonas();
        } catch (err) {
            console.error('Error al eliminar zona:', err);
            alert(err.error || err.detail || 'Error al eliminar la zona');
        } finally {
            setLoading(false);
        }
    };

    const getZoneIcon = (index) => {
        const icons = ['🏢', '📍', '🏗️', '🏭', '🏬', '🏛️', '🏪', '🏦'];
        return icons[index % icons.length];
    };

    const getZoneColor = (index) => {
        const colors = [
            'from-blue-500 to-blue-600',
            'from-green-500 to-green-600',
            'from-purple-500 to-purple-600',
            'from-pink-500 to-pink-600',
            'from-yellow-500 to-yellow-600',
            'from-red-500 to-red-600',
            'from-indigo-500 to-indigo-600',
            'from-teal-500 to-teal-600'
        ];
        return colors[index % colors.length];
    };

    return (
        <div className="w-full min-h-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800">Gestión de Zonas</h1>
                    <p className="text-gray-600 mt-2">
                        Administra las zonas de vigilancia y patrullaje
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleAbrirModalCrear}
                        className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300"
                    >
                        + Nueva Zona
                    </button>
                </div>
            </div>

            {/* Error global */}
            {error && !showModal && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Lista de zonas */}
            {loading && zonas.length === 0 ? (
                <div className="text-gray-600 text-center text-2xl py-20">
                    Cargando zonas...
                </div>
            ) : zonas.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-12 text-center text-gray-600 border border-gray-200">
                    <div className="text-6xl mb-4">🏢</div>
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">No hay zonas registradas</h2>
                    <p className="mb-6">Crea la primera zona para organizar el sistema de vigilancia</p>
                    <button
                        onClick={handleAbrirModalCrear}
                        className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700"
                    >
                        + Crear Primera Zona
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {zonas.map((zona, index) => (
                        <div
                            key={zona.id}
                            className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                        >
                            <div className={`bg-gradient-to-r ${getZoneColor(index)} p-6 text-white`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-4xl">{getZoneIcon(index)}</div>
                                    <div className="flex gap-2">
                                        
                                        {zona.activa ? (
                                            <div className="text-xs bg-green-500 bg-opacity-80 px-2 py-1 rounded">
                                                ✓ Activa
                                            </div>
                                        ) : (
                                            <div className="text-xs bg-red-500 bg-opacity-80 px-2 py-1 rounded">
                                                ✗ Inactiva
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold">{zona.nombre}</h3>
                            </div>

                            <div className="p-6">
                                {zona.descripcion ? (
                                    <p className="text-gray-600 mb-4 min-h-[60px]">
                                        {zona.descripcion}
                                    </p>
                                ) : (
                                    <p className="text-gray-400 italic mb-4 min-h-[60px]">
                                        Sin descripción
                                    </p>
                                )}

                                <div className="text-xs text-gray-500 mb-4">
                                    Creada: {new Date(zona.fecha_creacion).toLocaleDateString()}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAbrirModalEditar(zona)}
                                        className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-all duration-300 font-medium"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleEliminar(zona)}
                                        className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-all duration-300 font-medium"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal para crear/editar zona */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">
                            {modalMode === "crear" ? "Crear Nueva Zona" : "Editar Zona"}
                        </h2>
                        
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-2">
                                    Nombre de la Zona *
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    placeholder="Ej: Zona Norte, Estacionamiento A"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-2">
                                    Descripción
                                </label>
                                <textarea
                                    name="descripcion"
                                    value={formData.descripcion}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    placeholder="Describe la ubicación y características de esta zona..."
                                    rows="4"
                                    disabled={loading}
                                />
                            </div>

                            <div className="mb-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="activa"
                                        checked={formData.activa}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-400"
                                        disabled={loading}
                                    />
                                    <span className="text-gray-700 font-medium">Zona activa</span>
                                </label>
                                <p className="text-xs text-gray-500 mt-1 ml-7">
                                    Las zonas inactivas no reciben alertas
                                </p>
                            </div>

                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                                <p className="text-sm text-blue-700">
                                    <strong>Consejo:</strong> Las zonas te ayudan a organizar las áreas 
                                    de vigilancia. Asigna guardias y cámaras a cada zona para un mejor control.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Guardando...' : (modalMode === "crear" ? 'Crear Zona' : 'Actualizar Zona')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setError("");
                                        setFormData({ nombre: "", descripcion: "", activa: true });
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
    );
};

export default Zonas;
