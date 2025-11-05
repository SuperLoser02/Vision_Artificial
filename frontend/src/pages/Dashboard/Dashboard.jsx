import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout, obtenerEstadoCamara } from "../../services/Api";
import api from "../../services/Api";

const Dashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [camaras, setCamaras] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        ip: '',
        puerto: '8080',
        protocolo: 'http',
        zona: ''
    });
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState({});
    const [estados, setEstados] = useState({});
    const [fullscreenImg, setFullscreenImg] = useState(null);
    const navigate = useNavigate();
    // Cargar cámaras del perfil al montar y actualizar estado cada 5 segundos
    useEffect(() => {
        let intervalId;
        const fetchCamaras = async () => {
            setLoading(true);
            try {
                const res = await api.get('camaras/por_perfil/');
                setCamaras(res.data);
                // Consultar estado de cada cámara
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
        fetchCamaras();
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

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleCerrarSesion = () => {
        logout();
        navigate('/login');
    };

    const handleIrAPerfil = () => {
        navigate('/mi-perfil');
    };

    const handleIrACategorias = () => {
        navigate('/categorias');
    };

    const handleIrANotificaciones = () => {
        navigate('/notificaciones');
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
                // Refrescar lista
                const resPerfil = await api.get('camaras/por_perfil/');
                setCamaras(resPerfil.data);
                setShowModal(false);
                setFormData({ ip: '', puerto: '8080', protocolo: 'http', zona: '' });
            } else {
                alert(`Error: ${res.data.error || 'No se pudo registrar la cámara'}`);
            }
        } catch (error) {
            alert("Error al registrar la cámara.");
        } finally {
            setLoading(false);
        }
    };
    // Función para editar detalles de cámara
    const handleEditClick = (detalle) => {
        setEditId(detalle.id);
        setEditData({
            n_camara: detalle.n_camara,
            zona: detalle.zona,
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
            // Refrescar lista
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

    return (
        <div className="flex h-screen w-screen bg-white">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? "w-64" : "w-20"} bg-gradient-to-r from-blue-500 to-purple-600 text-white transition-all duration-300 flex flex-col relative`}>
                <div className="p-4 flex items-center justify-between">
                    <h1 className={`text-xl font-bold ${!sidebarOpen && "hidden"}`}>Menú</h1>
                    <button onClick={toggleSidebar} className="text-white focus:outline-none">
                        {sidebarOpen ? "←" : "→"}
                    </button>
                </div>
                
                {/* Menú de opciones */}
                <ul className="mt-4 flex-1 overflow-y-auto">
                    <li
                        onClick={handleIrAPerfil}
                        className="p-4 hover:bg-blue-700 cursor-pointer flex items-center gap-3 transition-colors duration-200"
                        title="Mi Perfil"
                    >
                        <span className="text-2xl">👤</span>
                        {sidebarOpen && <span className="font-medium">Mi Perfil</span>}
                    </li>
                    <li
                        onClick={handleIrACategorias}
                        className="p-4 hover:bg-blue-700 cursor-pointer flex items-center gap-3 transition-colors duration-200"
                        title="Categorías"
                    >
                        <span className="text-2xl">📋</span>
                        {sidebarOpen && <span className="font-medium">Categorías</span>}
                    </li>
                    <li
                        onClick={handleIrANotificaciones}
                        className="p-4 hover:bg-blue-700 cursor-pointer flex items-center gap-3 transition-colors duration-200"
                        title="Notificaciones"
                    >
                        <span className="text-2xl">🔔</span>
                        {sidebarOpen && <span className="font-medium">Notificaciones</span>}
                    </li>
                </ul>
                
                {/* Botón de cerrar sesión fijo en la parte inferior */}
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

            {/* Main Content */}
            <div className="flex-1 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Dashboard de Cámaras</h1>
                    <button
                        onClick={handleCerrarSesion}
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-all duration-300"
                    >
                        Cerrar Sesión
                    </button>
                </div>
                
                {/* Botones de acción */}
                <div className="mb-4 flex gap-4">
                    <button
                        onClick={detectarCamaras}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-gray-400"
                    >
                        {loading ? 'Detectando...' : 'Detectar Cámaras Automáticamente'}
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                        + Agregar Cámara Manualmente
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
                                            <p className={`font-bold ${estado?.estado === 'ok' ? 'text-green-600' : 'text-red-600'}`}>Estado: {estado?.estado === 'ok' ? 'Conectada' : 'Sin señal'}</p>
                                            {/* Vista previa o imagen de error */}
                                            {estado?.estado === 'ok' ? (
                                                <div className="mt-2 w-full cursor-pointer" style={{ aspectRatio: '4/3', background: '#222' }} onClick={() => setFullscreenImg(detalle.stream_url || cam.stream_url)}>
                                                    <img src={detalle.stream_url || cam.stream_url} alt={`Cámara ${i + 1}`} className="w-full h-full object-contain" style={{ maxHeight: '100%', maxWidth: '100%' }} />
                                                </div>
                                            ) : (
                                                <div className="mt-2 w-full h-40 flex items-center justify-center bg-gray-100 text-red-600 text-4xl">
                                                    <span role="img" aria-label="error">📷❌</span>
                                                </div>
                                            )}
                {/* Modal para imagen en pantalla completa */}
                {fullscreenImg && (
                    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={() => setFullscreenImg(null)}>
                        <img src={fullscreenImg} alt="Vista completa" className="max-w-full max-h-full object-contain shadow-2xl" />
                        <button className="absolute top-6 right-8 text-white text-3xl font-bold bg-black bg-opacity-50 rounded-full px-4 py-2" onClick={() => setFullscreenImg(null)}>
                            &times;
                        </button>
                    </div>
                )}
                                            <button
                                                className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                                onClick={() => handleEditClick(detalle)}
                                            >Editar</button>
                                        </>
                                    ) : (
                                        <p className="text-gray-600">Sin detalles de cámara</p>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        Array.from({ length: 6 }, (_, i) => (
                            <div
                                key={i}
                                className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                            >
                                <h2 className="text-lg font-semibold">Cámara {i + 1}</h2>
                                <p className="text-gray-600">Descripción de la cámara {i + 1}</p>
                            </div>
                        ))
                    )}
                </div>
                {/* Modal para editar detalles de cámara */}
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
                                    <input type="text" name="zona" value={editData.zona} onChange={handleEditChange} className="w-full px-3 py-2 border rounded" />
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

                {/* Modal para agregar cámara manualmente */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-96">
                            <h2 className="text-xl font-bold mb-4">Registrar Cámara Manualmente</h2>
                            <form onSubmit={registrarCamara}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 mb-2">IP de la cámara *</label>
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
                                    <label className="block text-gray-700 mb-2">Zona/Ubicación</label>
                                    <input
                                        type="text"
                                        name="zona"
                                        value={formData.zona}
                                        onChange={handleInputChange}
                                        placeholder="Entrada principal"
                                        className="w-full px-3 py-2 border rounded"
                                    />
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
        </div>
    );
};

export default Dashboard;