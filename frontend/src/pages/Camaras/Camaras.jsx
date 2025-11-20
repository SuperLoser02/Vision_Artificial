import React, { useState, useEffect } from "react";
import { obtenerEstadoCamara } from "../../services/Api";
import api from "../../services/Api";

const Camaras = () => {
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
    const [detectionActive, setDetectionActive] = useState(false);
    const [checkingDetection, setCheckingDetection] = useState(false);

    useEffect(() => {
        let intervalId;
        const fetchCamaras = async () => {
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
        fetchCamaras();
        intervalId = setInterval(async () => {
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
        verificarDeteccionActiva();
    }, []);

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
            console.error('Error al verificar detección activa:', error);
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

    return (
        <div className="w-full min-h-full">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard de Cámaras</h1>
                <div className="flex items-center gap-4">
                    {detectionActive && (
                        <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg border border-green-300">
                            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-green-700 font-semibold">Detección Activa</span>
                        </div>
                    )}
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
                                            <div className="mt-2 w-full cursor-pointer" style={{ aspectRatio: '4/3', background: '#222' }} onClick={() => setFullscreenImg(`http://${detalle.ip}:8080/shot.jpg?t=${Date.now()}`)}>
                                                {detectionActive ? (
                                                    <img 
                                                        src={`http://${detalle.ip}:8080/shot.jpg?t=${Date.now()}`} 
                                                        alt={`Cámara ${i + 1}`} 
                                                        className="w-full h-full object-contain" 
                                                        style={{ maxHeight: '100%', maxWidth: '100%' }}
                                                        onLoad={(e) => {
                                                            // Recargar imagen cada 500ms para simular video
                                                            setTimeout(() => {
                                                                if (detectionActive) {
                                                                    e.target.src = `http://${detalle.ip}:8080/shot.jpg?t=${Date.now()}`;
                                                                }
                                                            }, 500);
                                                        }}
                                                        onError={(e) => {
                                                            console.error('Error cargando snapshot');
                                                            setTimeout(() => {
                                                                if (detectionActive) {
                                                                    e.target.src = `http://${detalle.ip}:8080/shot.jpg?t=${Date.now()}`;
                                                                }
                                                            }, 1000);
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
                                                {detectionActive && (
                                                    <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                                                        IA ACTIVA
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="mt-2 w-full h-40 flex flex-col items-center justify-center bg-gray-100 text-gray-600">
                                                <span className="text-4xl mb-2">Sin señal</span>
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
                ) : (
                    Array.from({ length: 6 }, (_, i) => (
                        <div
                            key={i}
                            className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                        >
                            <h2 className="text-lg font-semibold">Cámara {i + 1}</h2>
                            <p className="text-gray-600">{i + 1}</p>
                        </div>
                    ))
                )}
            </div>

            {/* Modal para imagen en pantalla completa */}
            {fullscreenImg && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={() => setFullscreenImg(null)}>
                    <img src={fullscreenImg} alt="Vista completa" className="max-w-full max-h-full object-contain shadow-2xl" />
                    <button className="absolute top-6 right-8 text-white text-3xl font-bold bg-black bg-opacity-50 rounded-full px-4 py-2" onClick={() => setFullscreenImg(null)}>
                        &times;
                    </button>
                </div>
            )}

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
    );
};

export default Camaras;