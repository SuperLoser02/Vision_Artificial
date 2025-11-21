import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/Api";
import MiPerfil from "../Perfil/MiPerfil";
import Categorias from "../Categorias/Categorias";
import Notificaciones from "../Notificaciones/Notificaciones";
import Metricas from "../Metricas/Metricas";
import Zonas from "../Zonas/Zonas";
import Camaras from "../Camaras/Camaras";

const Dashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [vistaActual, setVistaActual] = useState('camaras');
    const navigate = useNavigate();

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleCerrarSesion = () => {
        // Solo cerrar sesión del perfil (empleado), no de la empresa
        localStorage.removeItem('perfilToken');
        localStorage.removeItem('perfilActual');
        // Mantener authToken para que la empresa siga con sesión activa
        navigate('/perfil');
    };

    const renderContenido = () => {
        switch(vistaActual) {
            case 'camaras':
                return <Camaras />;
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
            default:
                return <Camaras />;
        }
    };

    return (
        <div className="flex h-screen w-screen bg-gray-50">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? "w-64" : "w-20"} bg-gradient-to-r from-blue-500 to-purple-600 text-white transition-all duration-300 flex flex-col`}>
                <div className="p-4 flex items-center justify-between">
                    <h1 className={`text-xl font-bold ${!sidebarOpen && "hidden"}`}>Menú</h1>
                    <button onClick={toggleSidebar} className="text-white focus:outline-none">
                        {sidebarOpen ? "←" : "→"}
                    </button>
                </div>
                
                <ul className="mt-4 flex-1 overflow-y-auto">
                    <li
                        onClick={() => setVistaActual('camaras')}
                        className={`p-4 hover:bg-blue-700 cursor-pointer flex items-center gap-3 transition-colors duration-200 ${vistaActual === 'camaras' ? 'bg-blue-700' : ''}`}
                        title="Cámaras"
                    >
                        <span className="text-2xl">📷</span>
                        {sidebarOpen && <span className="font-medium">Cámaras</span>}
                    </li>
                    <li
                        onClick={() => setVistaActual('perfil')}
                        className={`p-4 hover:bg-blue-700 cursor-pointer flex items-center gap-3 transition-colors duration-200 ${vistaActual === 'perfil' ? 'bg-blue-700' : ''}`}
                        title="Mi Perfil"
                    >
                        <span className="text-2xl">👤</span>
                        {sidebarOpen && <span className="font-medium">Mi Perfil</span>}
                    </li>
                    <li
                        onClick={() => setVistaActual('categorias')}
                        className={`p-4 hover:bg-blue-700 cursor-pointer flex items-center gap-3 transition-colors duration-200 ${vistaActual === 'categorias' ? 'bg-blue-700' : ''}`}
                        title="Categorías"
                    >
                        <span className="text-2xl">📋</span>
                        {sidebarOpen && <span className="font-medium">Categorías</span>}
                    </li>
                    <li
                        onClick={() => setVistaActual('zonas')}
                        className={`p-4 hover:bg-blue-700 cursor-pointer flex items-center gap-3 transition-colors duration-200 ${vistaActual === 'zonas' ? 'bg-blue-700' : ''}`}
                        title="Zonas"
                    >
                        <span className="text-2xl">🏢</span>
                        {sidebarOpen && <span className="font-medium">Zonas</span>}
                    </li>
                    <li
                        onClick={() => setVistaActual('notificaciones')}
                        className={`p-4 hover:bg-blue-700 cursor-pointer flex items-center gap-3 transition-colors duration-200 ${vistaActual === 'notificaciones' ? 'bg-blue-700' : ''}`}
                        title="Notificaciones"
                    >
                        <span className="text-2xl">🔔</span>
                        {sidebarOpen && <span className="font-medium">Notificaciones</span>}
                    </li>
                    <li
                        onClick={() => setVistaActual('metricas')}
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

            {/* Área de contenido */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
                <div className="p-6">
                    {renderContenido()}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;