import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout, obtenerEstadoCamara, obtenerZonas, actualizarCamaraDetalle } from "../../services/Api";
import api from "../../services/Api";
import MiPerfil from "../Perfil/MiPerfil";
import Categorias from "../Categorias/Categorias";
import Notificaciones from "../Notificaciones/Notificaciones";
import Metricas from "../Metricas/Metricas";
import Zonas from "../Zonas/Zonas";

const Dashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [vistaActual, setVistaActual] = useState('camaras');
    const [camaras, setCamaras] = useState([]);
    const [zonas, setZonas] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        ip: '',
        puerto: '8080',
        protocolo: 'https',
        zona: ''
    });
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState({});
    const [estados, setEstados] = useState({});
    const [fullscreenImg, setFullscreenImg] = useState(null);
    const [detectionActive, setDetectionActive] = useState(false);
    const [checkingDetection, setCheckingDetection] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let intervalId;
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.get('camaras/por_perfil/');
                setCamaras(res.data);
                const estadosTemp = {};
                for (const cam of res.data) {
                    if (cam.detalles && cam.detalles.length > 0) {
                        const detalle = cam.detalles[0];
                        const estado = await obtenerEstadoCamara(detalle.id);
                        estadosTemp[detalle.id] = estado;
                    }
                }
                setEstados(estadosTemp);
            } catch (error) {
                setCamaras([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
        
        // Actualizar estado cada 5 segundos
        intervalId = setInterval(async () => {
            // Solo actualizar estado, no recargar cámaras
            const estadosTemp = {};
            for (const cam of camaras) {
                if (cam.detalles && cam.detalles.length > 0) {
                    const detalle = cam.detalles[0];
                    const estado = await obtenerEstadoCamara(detalle.id);
                    estadosTemp[detalle.id] = estado;
                }
            }
            setEstados(estadosTemp);
        }, 5000);
        
        return () => clearInterval(intervalId);
    }, [camaras.length]);

    useEffect(() => {
        cargarZonas();
    }, []);

    useEffect(() => {
        verificarDeteccionActiva();
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleCerrarSesion = () => {
        logout();
        navigate('/login');
    };

    const handleIrAPerfil = () => {
        setVistaActual('perfil');
    };

    const handleIrACategorias = () => {
        setVistaActual('categorias');
    };

    const handleIrANotificaciones = () => {
        setVistaActual('notificaciones');
    };

    const handleIrAZonas = () => {
        setVistaActual('zonas');
    };

    const handleIrAMetricas = () => {
        setVistaActual('metricas');
    };

    const handleIrACamaras = () => {
        setVistaActual('camaras');
    };

    const cargarZonas = async () => {
        try {
            const data = await obtenerZonas();
            // Filtrar solo las zonas activas
            const zonasActivas = data.filter(zona => zona.activa);
            setZonas(zonasActivas);
        } catch (error) {
            console.error('Error al cargar zonas:', error);
            setZonas([]);
        }
    };

    // Función para detectar cámaras automáticamente
    const detectarCamaras = async () => {
        setLoading(true);
        try {
            const res = await api.get('detectar/');
            // El backend devuelve solo las nuevas detectadas, refrescamos la lista completa
            const resPerfil = await api.get('camaras/por_perfil/');
            setCamaras(resPerfil.data);
            alert(`Se detectaron ${res.data.length} cámara(s)`);
            // Consultar estado de cada cámara
            const estadosTemp = {};
            for (const cam of resPerfil.data) {
                if (cam.detalles && cam.detalles.length > 0) {
                    const detalle = cam.detalles[0];
                    const estado = await obtenerEstadoCamara(detalle.id);
                    estadosTemp[detalle.id] = estado;
                }
            }
            setEstados(estadosTemp);
        } catch (error) {
            alert("No se pudieron detectar cámaras.");
        } finally {
            setLoading(false);
        }
    };

    // Función para registrar cámara manualmente
    const registrarCamara = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('registrar/', formData);
            if (res.data && res.data.camara) {
                alert("Cámara registrada exitosamente");
                const resPerfil = await api.get('camaras/por_perfil/');
                setCamaras(resPerfil.data);
                const estadosTemp = {};
                for (const cam of resPerfil.data) {
                    if (cam.detalles && cam.detalles.length > 0) {
                        const detalle = cam.detalles[0];
                        const estado = await obtenerEstadoCamara(detalle.id);
                        estadosTemp[detalle.id] = estado;
                    }
                }
                setEstados(estadosTemp);
                setShowModal(false);
                setFormData({ ip: '', puerto: '8080', protocolo: 'https', zona: '' });
            } else {
                alert(`Error: ${res.data.error || 'No se pudo registrar la cámara'}`);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || "Error al registrar la cámara. Verifica que la cámara esté encendida y accesible.";
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (detalle) => {
        setEditId(detalle.id);
        setEditData({
            n_camara: detalle.n_camara,
            zona: detalle.zona || '',  // ID de la zona (puede ser null)
            ip: detalle.ip,
            marca: detalle.marca,
            resolucion: detalle.resolucion
        });
    };

    const handleEditChange = (e) => {
        setEditData({
            ...editData,
            [e.target.name]: e.target.value
        });
    };

    const handleEditSave = async () => {
        setLoading(true);
        try {
            await api.patch(`camara-detalles/${editId}/`, editData);
            const resPerfil = await api.get('camaras/por_perfil/');
            setCamaras(resPerfil.data);
            setEditId(null);
        } catch (error) {
            alert("Error al editar la cámara");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const iniciarDeteccion = async () => {
        setCheckingDetection(true);
        try {
            const res = await api.get('ia_detection/start_detection/');
            setDetectionActive(true);
            alert('Detección de IA iniciada en todas las cámaras');
        } catch (error) {
            alert('Error al iniciar la detección de IA');
        } finally {
            setCheckingDetection(false);
        }
    };

    const detenerDeteccion = async () => {
        setCheckingDetection(true);
        try {
            const res = await api.get('ia_detection/stop_detection/');
            setDetectionActive(false);
            alert('Detección de IA detenida');
        } catch (error) {
            alert('Error al detener la detección de IA');
        } finally {
            setCheckingDetection(false);
        }
    };

    const verificarDeteccionActiva = async () => {
        try {
            const res = await api.get('ia_detection/active_detections/');
            setDetectionActive(res.data.active_cameras && res.data.active_cameras.length > 0);
        } catch (error) {
        }
    };

    const eliminarCamara = async (camaraId) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta cámara?')) {
            return;
        }
        setLoading(true);
        try {
            await api.delete(`camaras/${camaraId}/`);
            alert('Cámara eliminada exitosamente');
            const resPerfil = await api.get('camaras/por_perfil/');
            setCamaras(resPerfil.data);
            const estadosTemp = {};
            for (const cam of resPerfil.data) {
                if (cam.detalles && cam.detalles.length > 0) {
                    const detalle = cam.detalles[0];
                    const estado = await obtenerEstadoCamara(detalle.id);
                    estadosTemp[detalle.id] = estado;
                }
            }
            setEstados(estadosTemp);
        } catch (error) {
            alert('Error al eliminar la cámara');
        } finally {
            setLoading(false);
        }
    };

    const renderContenido = () => {
        switch(vistaActual) {
            case 'perfil':
                return <MiPerfil />;
            case 'categorias':
                return <Categorias />;
            case 'zonas':
                return <Zonas />;
            case 'notificaciones':
                return <Notificaciones />;
            case 'metricas':
                return <Metricas />;
            case 'camaras':
            default:
                return (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h1 className="text-2xl font-bold">Dashboard de Cámaras</h1>
                            <div className="flex items-center gap-4">
                                {detectionActive && (
                                    <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg border border-green-300">
                                        <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                                        <span className="text-green-700 font-semibold">Detección Activa</span>
                                    </div>
                                )}
                                <button
                                    onClick={handleCerrarSesion}
                                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-all duration-300"
                                >
                                    Cerrar Sesión
                                </button>
                            </div>
                        </div>
                        
                        <div className="mb-4 flex gap-4">
                            <button
                                onClick={() => setShowModal(true)}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                            >
                                + Agregar Cámara Manualmente
                            </button>
                            <button
                                onClick={iniciarDeteccion}
                                disabled={checkingDetection || detectionActive}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-gray-400"
                            >
                                {checkingDetection ? 'Iniciando...' : 'Iniciar Detección IA'}
                            </button>
                            <button
                                onClick={detenerDeteccion}
                                disabled={checkingDetection || !detectionActive}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:bg-gray-400"
                            >
                                {checkingDetection ? 'Deteniendo...' : 'Detener Detección IA'}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {camaras.length > 0 ? (
                                camaras.map((cam, i) => {
                                    const detalle = cam.detalles && cam.detalles.length > 0 ? cam.detalles[0] : null;
                                    const estado = detalle ? estados[detalle.id] : null;
                                    return (
                                        <div
                                            key={cam.id}
                                            className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                                        >
                                            <h2 className="text-lg font-semibold">Cámara {i + 1}</h2>
                                            {detalle ? (
                                                <>
                                                    <p className="text-gray-600">IP: {detalle.ip}</p>
                                                    <p className="text-gray-600">Zona: {detalle.zona}</p>
                                                    <p className="text-gray-600">Marca: {detalle.marca}</p>
                                                    <p className="text-gray-600">Resolución: {detalle.resolucion}</p>
                                                    {estado ? (
                                                        <p className={`font-bold ${estado?.estado === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                                                            Estado: {estado?.estado === 'ok' ? 'Conectada' : 'Sin señal'}
                                                        </p>
                                                    ) : (
                                                        <p className="font-bold text-yellow-600">Estado: Verificando...</p>
                                                    )}
                                                    {estado?.estado === 'ok' ? (
                                                        <div className="mt-2 w-full cursor-pointer" style={{ aspectRatio: '4/3', background: '#222' }} onClick={() => setFullscreenImg(detalle.stream_url || cam.stream_url)}>
                                                            {detectionActive ? (
                                                                <img 
                                                                    src={`http://${detalle.ip}:8080/shot.jpg?t=${Date.now()}`} 
                                                                    alt={`Cámara ${i + 1}`} 
                                                                    className="w-full h-full object-contain" 
                                                                    style={{ maxHeight: '100%', maxWidth: '100%' }}
                                                                    onError={(e) => {
                                                                        e.target.src = detalle.stream_url || cam.stream_url;
                                                                    }}
                                                                />
                                                            ) : (
                                                                <img 
                                                                    src={detalle.stream_url || cam.stream_url} 
                                                                    alt={`Cámara ${i + 1}`} 
                                                                    className="w-full h-full object-contain" 
                                                                    style={{ maxHeight: '100%', maxWidth: '100%' }} 
                                                                />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="mt-2 w-full h-40 flex flex-col items-center justify-center bg-gray-100 text-gray-600">
                                                            <span className="text-4xl mb-2">📷❌</span>
                                                            <p className="text-sm text-center px-2">
                                                                {estado ? 'Sin conexión' : 'Verificando conexión...'}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Asegúrate que la app esté activa
                                                            </p>
                                                        </div>
                                                    )}
                                                    <button
                                                        className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                                        onClick={() => handleEditClick(detalle)}
                                                    >Editar</button>
                                                    <button
                                                        className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 ml-2"
                                                        onClick={() => eliminarCamara(cam.id)}
                                                    >Eliminar</button>
                                                </>
                                            ) : (
                                                <p className="text-gray-600">Sin detalles de cámara</p>
                                            )}
                                        </div>
                                    );
                                })
                            ) : null}
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="flex h-screen w-screen bg-white">
            <div className={`${sidebarOpen ? "w-64" : "w-20"} bg-gradient-to-r from-blue-500 to-purple-600 text-white transition-all duration-300 flex flex-col relative`}>
                <div className="p-4 flex items-center justify-between">
                    <h1 className={`text-xl font-bold ${!sidebarOpen && "hidden"}`}>Menú</h1>
                    <button onClick={toggleSidebar} className="text-white focus:outline-none">
                        {sidebarOpen ? "←" : "→"}
                    </button>
                </div>
                
                <ul className="mt-4 flex-1 overflow-y-auto">
                    <li
                        onClick={handleIrACamaras}
                        className={`p-4 hover:bg-blue-700 cursor-pointer flex items-center gap-3 transition-colors duration-200 ${vistaActual === 'camaras' ? 'bg-blue-700' : ''}`}
                        title="Cámaras"
                    >
                        <span className="text-2xl">📷</span>
                        {sidebarOpen && <span className="font-medium">Cámaras</span>}
                    </li>
                    <li
                        onClick={handleIrAPerfil}
                        className={`p-4 hover:bg-blue-700 cursor-pointer flex items-center gap-3 transition-colors duration-200 ${vistaActual === 'perfil' ? 'bg-blue-700' : ''}`}
                        title="Mi Perfil"
                    >
                        <span className="text-2xl">👤</span>
                        {sidebarOpen && <span className="font-medium">Mi Perfil</span>}
                    </li>
                    <li
                        onClick={handleIrACategorias}
                        className={`p-4 hover:bg-blue-700 cursor-pointer flex items-center gap-3 transition-colors duration-200 ${vistaActual === 'categorias' ? 'bg-blue-700' : ''}`}
                        title="Categorías"
                    >
                        <span className="text-2xl">📋</span>
                        {sidebarOpen && <span className="font-medium">Categorías</span>}
                    </li>
                    <li
                        onClick={handleIrAZonas}
                        className={`p-4 hover:bg-blue-700 cursor-pointer flex items-center gap-3 transition-colors duration-200 ${vistaActual === 'zonas' ? 'bg-blue-700' : ''}`}
                        title="Zonas"
                    >
                        <span className="text-2xl">🏢</span>
                        {sidebarOpen && <span className="font-medium">Zonas</span>}
                    </li>
                    <li
                        onClick={handleIrANotificaciones}
                        className={`p-4 hover:bg-blue-700 cursor-pointer flex items-center gap-3 transition-colors duration-200 ${vistaActual === 'notificaciones' ? 'bg-blue-700' : ''}`}
                        title="Notificaciones"
                    >
                        <span className="text-2xl">🔔</span>
                        {sidebarOpen && <span className="font-medium">Notificaciones</span>}
                    </li>
                    <li
                        onClick={handleIrAMetricas}
                        className={`p-4 hover:bg-blue-700 cursor-pointer flex items-center gap-3 transition-colors duration-200 ${vistaActual === 'metricas' ? 'bg-blue-700' : ''}`}
                        title="Métricas"
                    >
                        <span className="text-2xl">📊</span>
                        {sidebarOpen && <span className="font-medium">Métricas</span>}
                    </li>
                </ul>
                
                <div className="p-4 border-t border-white border-opacity-20">
                    <button
                        onClick={handleCerrarSesion}
                        className={`w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl ${!sidebarOpen && "px-0"}`}
                        title="Cerrar Sesión"
                    >
                        <span className="text-xl">🚪</span>
                        {sidebarOpen && <span>Cerrar Sesión</span>}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                    {renderContenido()}
                </div>
            </div>

            {fullscreenImg && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={() => setFullscreenImg(null)}>
                    <img src={fullscreenImg} alt="Vista completa" className="max-w-full max-h-full object-contain shadow-2xl" />
                    <button className="absolute top-6 right-8 text-white text-3xl font-bold bg-black bg-opacity-50 rounded-full px-4 py-2" onClick={() => setFullscreenImg(null)}>
                        &times;
                    </button>
                </div>
            )}

            {editId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h2 className="text-xl font-bold mb-4">Editar Detalles de Cámara</h2>
                        <form onSubmit={e => { e.preventDefault(); handleEditSave(); }}>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Número de Cámara</label>
                                <input type="number" name="n_camara" value={editData.n_camara} onChange={handleEditChange} className="w-full px-3 py-2 border rounded" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Zona</label>
                                <select 
                                    name="zona" 
                                    value={editData.zona} 
                                    onChange={handleEditChange} 
                                    className="w-full px-3 py-2 border rounded"
                                >
                                    <option value="">Sin zona</option>
                                    {zonas.map(z => (
                                        <option key={z.id} value={z.id}>{z.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">IP</label>
                                <input type="text" name="ip" value={editData.ip} onChange={handleEditChange} className="w-full px-3 py-2 border rounded" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Marca</label>
                                <input type="text" name="marca" value={editData.marca} onChange={handleEditChange} className="w-full px-3 py-2 border rounded" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Resolución</label>
                                <input type="text" name="resolucion" value={editData.resolucion} onChange={handleEditChange} className="w-full px-3 py-2 border rounded" />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400">Guardar</button>
                                <button type="button" onClick={() => setEditId(null)} className="flex-1 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h2 className="text-xl font-bold mb-4">Registrar Cámara Manualmente</h2>
                        <form onSubmit={registrarCamara}>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">IP de la cámara</label>
                                <input
                                    type="text"
                                    name="ip"
                                    value={formData.ip}
                                    onChange={handleInputChange}
                                    placeholder="192.168.0.15"
                                    className="w-full px-3 py-2 border rounded"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Puerto</label>
                                <input
                                    type="number"
                                    name="puerto"
                                    value={formData.puerto}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Protocolo</label>
                                <select
                                    name="protocolo"
                                    value={formData.protocolo}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded"
                                >
                                    <option value="http">HTTP</option>
                                    <option value="https">HTTPS</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Zona (opcional)</label>
                                <select
                                    name="zona"
                                    value={formData.zona}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded"
                                >
                                    <option value="">Sin zona</option>
                                    {zonas.map(z => (
                                        <option key={z.id} value={z.id}>{z.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                    {loading ? 'Registrando...' : 'Registrar'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
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

export default Dashboard;