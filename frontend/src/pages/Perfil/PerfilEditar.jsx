import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { obtenerPerfilPorId, actualizarPerfil, obtenerZonas, obtenerCategorias } from "../../services/Api";

const PerfilEditar = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    const [perfil, setPerfil] = useState(null);
    const [zonas, setZonas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        rol: '',
        zona: '',
        categorias: ''
    });

    useEffect(() => {
        cargarDatos();
    }, [id]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            
            if (!token) {
                alert('Debes iniciar sesión como administrador primero');
                navigate('/login');
                return;
            }

            // Obtener datos del perfil y listas
            const [perfilData, zonasData, categoriasData] = await Promise.all([
                obtenerPerfilPorId(id),
                obtenerZonas(),
                obtenerCategorias()
            ]);

            setPerfil(perfilData);
            setZonas(zonasData);
            setCategorias(categoriasData);

            // Inicializar formulario con datos actuales
            const categoriaId = perfilData.categorias && perfilData.categorias.length > 0 
                ? perfilData.categorias[0] 
                : '';

            setFormData({
                nombre: perfilData.nombre || '',
                apellido: perfilData.apellido || '',
                email: perfilData.email || '',
                telefono: perfilData.telefono || '',
                rol: perfilData.rol || '',
                zona: perfilData.zona || '',
                categorias: categoriaId
            });

            setError("");
        } catch (err) {
            console.error('Error al cargar datos:', err);
            
            if (err.status === 401) {
                alert('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                navigate('/login');
                return;
            }
            
            setError(err.detail || err.error || 'Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value === '' ? null : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            setSaving(true);
            
            // Preparar datos para enviar (todos los campos editables)
            const updateData = {};
            
            // Campos de información personal
            if (formData.nombre !== perfil.nombre) {
                updateData.nombre = formData.nombre;
            }
            if (formData.apellido !== perfil.apellido) {
                updateData.apellido = formData.apellido;
            }
            if (formData.email !== perfil.email) {
                updateData.email = formData.email;
            }
            if (formData.telefono !== perfil.telefono) {
                updateData.telefono = formData.telefono || null;
            }
            
            // Campos de asignación
            if (formData.rol !== perfil.rol) {
                updateData.rol = formData.rol || null;
            }
            if (formData.zona !== perfil.zona) {
                updateData.zona = formData.zona || null;
            }
            
            // Convertir categoría a array para el backend
            if (formData.categorias) {
                updateData.categorias = [parseInt(formData.categorias)];
            } else {
                updateData.categorias = [];
            }

            await actualizarPerfil(id, updateData);
            alert('Perfil actualizado exitosamente');
            navigate('/perfil-registro');
        } catch (err) {
            console.error('Error al actualizar perfil:', err);
            setError(err.error || err.detail || 'Error al actualizar el perfil');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen w-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-white text-2xl">Cargando datos...</div>
            </div>
        );
    }

    if (!perfil) {
        return (
            <div className="min-h-screen w-screen bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="bg-white rounded-lg p-8 max-w-md text-center">
                    <p className="text-red-600 text-xl mb-4">Perfil no encontrado</p>
                    <button
                        onClick={() => navigate('/perfil-registro')}
                        className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-screen bg-gradient-to-r from-blue-500 to-purple-600 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white">Editar Perfil</h1>
                        <p className="text-white text-opacity-80 mt-2">
                            {perfil.nombre} {perfil.apellido}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/perfil-registro')}
                        className="bg-gray-500 bg-opacity-50 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-opacity-70 transition-all duration-300"
                    >
                        Volver
                    </button>
                </div>

                {/* Formulario */}
                <div className="bg-white rounded-lg p-8 shadow-lg">
                    {error && (
                        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    {/* Información del perfil (solo lectura) */}
                    <div className="mb-8 pb-8 border-b border-gray-200">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Información Personal</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">CI / Cédula</p>
                                <p className="text-lg font-medium text-gray-800">{perfil.ci}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="text-lg font-medium text-gray-800">{perfil.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Nombre Completo</p>
                                <p className="text-lg font-medium text-gray-800">{perfil.nombre} {perfil.apellido}</p>
                            </div>
                            {perfil.telefono && (
                                <div>
                                    <p className="text-sm text-gray-600">Teléfono</p>
                                    <p className="text-lg font-medium text-gray-800">{perfil.telefono}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Formulario de edición */}
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-xl font-bold mb-6 text-gray-800">Editar Asignaciones</h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Nombre */}
                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-2">
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    disabled={saving}
                                />
                            </div>

                            {/* Apellido */}
                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-2">
                                    Apellido
                                </label>
                                <input
                                    type="text"
                                    name="apellido"
                                    value={formData.apellido}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    disabled={saving}
                                />
                            </div>

                            {/* Email */}
                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    disabled={saving}
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
                                    disabled={saving}
                                />
                            </div>

                            {/* Rol */}
                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-2">
                                    Rol
                                </label>
                                <select
                                    name="rol"
                                    value={formData.rol}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    disabled={saving}
                                >
                                    <option value="">Sin asignar</option>
                                    <option value="jefe_seguridad">👔 Jefe de Seguridad</option>
                                    <option value="guardia_seguridad">🛡️ Guardia de Seguridad</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Jefes supervisan todo, Guardias solo su zona
                                </p>
                            </div>

                            {/* Zona */}
                            <div className="mb-4">
                                <label className="block text-gray-700 font-medium mb-2">
                                    Zona Asignada
                                </label>
                                <select
                                    name="zona"
                                    value={formData.zona}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    disabled={saving}
                                >
                                    <option value="">Sin zona asignada</option>
                                    {zonas.map((zona) => (
                                        <option key={zona.id} value={zona.id}>
                                            {zona.nombre}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Zona de patrullaje (obligatorio para guardias)
                                </p>
                            </div>

                            {/* Categorías (Simple) */}
                            <div className="mb-4 md:col-span-2">
                                <label className="block text-gray-700 font-medium mb-2">
                                    Categorías / Turnos
                                </label>
                                <select
                                    name="categorias"
                                    value={formData.categorias}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    disabled={saving}
                                >
                                    <option value="">Sin categoría asignada</option>
                                    {categorias.map((categoria) => (
                                        <option key={categoria.id} value={categoria.id}>
                                            {categoria.nombre}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Selecciona un turno
                                </p>
                            </div>
                        </div>

                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 my-6">
                            <p className="text-sm text-blue-700">
                                <span className="font-semibold">Importante:</span> Los campos de rol, zona y categoría 
                                son opcionales. Puedes dejarlos sin asignar y configurarlos más tarde.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/perfil-registro')}
                                disabled={saving}
                                className="flex-1 bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-500 transition-all duration-300"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PerfilEditar;
