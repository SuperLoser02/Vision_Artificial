import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerCategorias } from "../../services/Api";
import axios from "axios";

const Categorias = () => {
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("crear"); // "crear" o "editar"
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: ""
    });
    const navigate = useNavigate();

    useEffect(() => {
        cargarCategorias();
    }, []);

    const cargarCategorias = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            
            if (!token) {
                alert('Debes iniciar sesión como administrador primero');
                navigate('/login');
                return;
            }

            const data = await obtenerCategorias();
            setCategorias(data);
            setError("");
        } catch (err) {
            console.error('Error al cargar categorías:', err);
            
            if (err.status === 401) {
                alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }
            
            setError(err.detail || err.error || 'Error al cargar las categorías');
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

    const handleAbrirModalCrear = () => {
        setModalMode("crear");
        setFormData({ nombre: "", descripcion: "" });
        setCategoriaSeleccionada(null);
        setShowModal(true);
        setError("");
    };

    const handleAbrirModalEditar = (categoria) => {
        setModalMode("editar");
        setFormData({
            nombre: categoria.nombre,
            descripcion: categoria.descripcion || ""
        });
        setCategoriaSeleccionada(categoria);
        setShowModal(true);
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.nombre.trim()) {
            setError("El nombre de la categoría es obligatorio");
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const apiUrl = process.env.NODE_ENV === 'production' 
                ? 'http://backend:8000/api/' 
                : 'http://localhost:8000/api/';

            if (modalMode === "crear") {
                await axios.post(`${apiUrl}categorias/`, formData, {
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                alert('Categoría creada exitosamente');
            } else {
                await axios.put(`${apiUrl}categorias/${categoriaSeleccionada.id}/`, formData, {
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                alert('Categoría actualizada exitosamente');
            }

            await cargarCategorias();
            setShowModal(false);
            setFormData({ nombre: "", descripcion: "" });
        } catch (err) {
            console.error('Error al guardar categoría:', err);
            setError(err.response?.data?.error || err.response?.data?.detail || 'Error al guardar la categoría');
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async (categoria) => {
        if (!window.confirm(`¿Estás seguro de eliminar la categoría "${categoria.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const apiUrl = process.env.NODE_ENV === 'production' 
                ? 'http://backend:8000/api/' 
                : 'http://localhost:8000/api/';

            await axios.delete(`${apiUrl}categorias/${categoria.id}/`, {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });

            alert('Categoría eliminada exitosamente');
            await cargarCategorias();
        } catch (err) {
            console.error('Error al eliminar categoría:', err);
            alert(err.response?.data?.error || err.response?.data?.detail || 'Error al eliminar la categoría');
        } finally {
            setLoading(false);
        }
    };

    const getCategoryIcon = (index) => {
        const icons = ['📋', '🕐', '📍', '🏢', '🔧', '🎯', '📊', '⚡'];
        return icons[index % icons.length];
    };

    const getCategoryColor = (index) => {
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
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800">Gestión de Categorías</h1>
                        <p className="text-gray-600 mt-2">
                            Administra las categorías de trabajo y turnos
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleAbrirModalCrear}
                            className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300"
                        >
                            + Nueva Categoría
                        </button>
                    </div>
                </div>

                {/* Error global */}
                {error && !showModal && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {/* Lista de categorías */}
                {loading && categorias.length === 0 ? (
                    <div className="text-gray-600 text-center text-2xl py-20">
                        Cargando categorías...
                    </div>
                ) : categorias.length === 0 ? (
                    <div className="bg-gray-100 rounded-lg p-12 text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">No hay categorías registradas</h2>
                        <p className="mb-6 text-gray-600">Crea la primera categoría para organizar los turnos de trabajo</p>
                        <button
                            onClick={handleAbrirModalCrear}
                            className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700"
                        >
                            + Crear Primera Categoría
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categorias.map((categoria, index) => (
                            <div
                                key={categoria.id}
                                className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                            >
                                <div className={`bg-gradient-to-r ${getCategoryColor(index)} p-6 text-white`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-4xl">{getCategoryIcon(index)}</div>
                                        <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                                            ID: {categoria.id}
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold">{categoria.nombre}</h3>
                                </div>

                                <div className="p-6">
                                    {categoria.descripcion ? (
                                        <p className="text-gray-600 mb-4 min-h-[60px]">
                                            {categoria.descripcion}
                                        </p>
                                    ) : (
                                        <p className="text-gray-400 italic mb-4 min-h-[60px]">
                                            Sin descripción
                                        </p>
                                    )}

                                    <div className="text-xs text-gray-500 mb-4">
                                        Creada: {new Date(categoria.fecha_creacion).toLocaleDateString()}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAbrirModalEditar(categoria)}
                                            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-all duration-300 font-medium"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleEliminar(categoria)}
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

                {/* Modal para crear/editar categoría */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                                {modalMode === "crear" ? "Crear Nueva Categoría" : "Editar Categoría"}
                            </h2>
                            
                            {error && (
                                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 font-medium mb-2">
                                        Nombre de la Categoría *
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder="Ej: Turno Mañana, Guardia Nocturna"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="block text-gray-700 font-medium mb-2">
                                        Descripción
                                    </label>
                                    <textarea
                                        name="descripcion"
                                        value={formData.descripcion}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        placeholder="Describe las características de esta categoría..."
                                        rows="4"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                                    <p className="text-sm text-blue-700">
                                        <strong>Consejo:</strong> Las categorías te ayudan a organizar los turnos 
                                        de trabajo de tus guardias. Por ejemplo: Turno Mañana, Turno Tarde, 
                                        Guardia Nocturna, etc.
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Guardando...' : (modalMode === "crear" ? 'Crear Categoría' : 'Actualizar Categoría')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setError("");
                                            setFormData({ nombre: "", descripcion: "" });
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

export default Categorias;
