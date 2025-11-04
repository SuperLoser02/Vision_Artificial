import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <header className="text-center mb-8 px-4">
                <h1 className="text-5xl md:text-6xl font-extrabold">Vision Artificial</h1>
                <p className="text-lg md:text-xl mt-4">Sistema de Seguridad y Monitoreo Inteligente</p>
            </header>
            
            <main className="text-center max-w-4xl px-4">
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Login para Empresas/Administradores */}
                    <div className="bg-white bg-opacity-10 backdrop-blur-md p-8 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <div className="text-6xl mb-4">&#128970;</div>
                        <h2 className="text-2xl font-bold mb-3">Empresas</h2>
                        <p className="text-sm mb-6 text-white text-opacity-90">
                            Administra tu sistema de seguridad, gestiona trabajadores y monitorea en tiempo real
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                        >
                            Acceso Empresas
                        </button>
                        <button
                            onClick={() => navigate('/suscripcion')}
                            className="w-full mt-2 bg-transparent border-2 border-white text-white font-semibold py-2 px-6 rounded-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
                        >
                            Ver Planes
                        </button>
                    </div>

                    {/* Login para Trabajadores/Guardias */}
                    <div className="bg-white bg-opacity-10 backdrop-blur-md p-8 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <div className="text-6xl mb-4">&#128110;</div>
                        <h2 className="text-2xl font-bold mb-3">Trabajadores</h2>
                        <p className="text-sm mb-6 text-white text-opacity-90">
                            Guardias y personal de seguridad: accede a tu turno y sistema de monitoreo
                        </p>
                        <button
                            onClick={() => navigate('/perfil')}
                            className="w-full bg-white text-purple-600 font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                        >
                            Acceso Trabajadores
                        </button>
                        <p className="mt-4 text-xs text-white text-opacity-80">
                            Usa tu CI y contraseña proporcionada por el administrador
                        </p>
                    </div>
                </div>

                {/* Características principales */}
                <div className="mt-12 grid md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white bg-opacity-5 p-4 rounded-lg">
                        <div className="text-3xl mb-2">&#128249;</div>
                        <h3 className="font-semibold mb-1">Monitoreo 24/7</h3>
                        <p className="text-xs text-white text-opacity-80">Sistema de cámaras en tiempo real</p>
                    </div>
                    <div className="bg-white bg-opacity-5 p-4 rounded-lg">
                        <div className="text-3xl mb-2">&#129302;</div>
                        <h3 className="font-semibold mb-1">IA Avanzada</h3>
                        <p className="text-xs text-white text-opacity-80">Detección inteligente de eventos</p>
                    </div>
                    <div className="bg-white bg-opacity-5 p-4 rounded-lg">
                        <div className="text-3xl mb-2">&#128202;</div>
                        <h3 className="font-semibold mb-1">Reportes</h3>
                        <p className="text-xs text-white text-opacity-80">Análisis y estadísticas completas</p>
                    </div>
                </div>
            </main>

            <footer className="mt-12 text-sm text-white text-opacity-70">
                © 2025 Vision Artificial - Sistema de Seguridad Inteligente
            </footer>
        </div>
    );
};

export default HomePage;