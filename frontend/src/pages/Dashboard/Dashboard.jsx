import React, { useState } from "react";

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

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Función para detectar cámaras automáticamente
    const detectarCamaras = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/detectar/");
            const data = await res.json();
            setCamaras(data);
            alert(`Se detectaron ${data.length} cámara(s)`);
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
            const res = await fetch("/api/registrar/", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            
            if (res.ok) {
                alert("Cámara registrada exitosamente");
                setCamaras([...camaras, data.camara]);
                setShowModal(false);
                setFormData({ ip: '', puerto: '8080', protocolo: 'http', zona: '' });
            } else {
                alert(`Error: ${data.error || 'No se pudo registrar la cámara'}`);
            }
        } catch (error) {
            alert("Error al registrar la cámara.");
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
            <div className={`${sidebarOpen ? "w-64" : "w-20"} bg-gradient-to-r from-blue-500 to-purple-600 text-white transition-all duration-300`} >
                <div className="p-4 flex items-center justify-between">
                    <h1 className={`text-xl font-bold ${!sidebarOpen && "hidden"}`}>Cámaras</h1>
                    <button onClick={toggleSidebar} className="text-white focus:outline-none">
                        {sidebarOpen ? "←" : "→"}
                    </button>
                </div>
                <ul className="mt-4">
                    {Array.from({ length: 5 }, (_, i) => (
                        <li
                            key={i}
                            className="p-4 hover:bg-blue-700 cursor-pointer text-center"
                        >
                            Opción {i + 1}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
                <h1 className="text-2xl font-bold mb-4">Dashboard de Cámaras</h1>
                
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
                        camaras.map((cam, i) => (
                            <div
                                key={i}
                                className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                            >
                                <h2 className="text-lg font-semibold">Cámara {i + 1}</h2>
                                <p className="text-gray-600">IP: {cam.ip}</p>
                                <p className="text-gray-600">Marca: {cam.marca}</p>
                                <p className="text-gray-600">Resolución: {cam.resolucion}</p>
                                {/* Puedes agregar una vista previa si tienes la URL */}
                                <img src={cam.stream_url} alt={`Cámara ${i + 1}`} className="mt-2 w-full h-40 object-cover" />
                            </div>
                        ))
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