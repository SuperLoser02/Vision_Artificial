import React, { useState, useEffect } from "react";
import api from "../../services/Api";

const MiPerfilAdmin = () => {
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        cargarPerfilAdmin();
    }, []);

    const cargarPerfilAdmin = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const userJson = localStorage.getItem('user');
            
            if (!token || !userJson) {
                setError('No hay sesión activa');
                setLoading(false);
                return;
            }

            const userData = JSON.parse(userJson);
            setUsuario(userData);
            setError("");
        } catch (err) {
            console.error('Error al cargar perfil admin:', err);
            setError('Error al cargar los datos del usuario');
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (username) => {
        if (!username) return "??";
        return username.substring(0, 2).toUpperCase();
    };

    const getAvatarColor = () => {
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
        return colors[Math.floor(Math.random() * colors.length)];
    };

    if (loading) {
        return (
            <div className="w-full min-h-[400px] flex items-center justify-center">
                <div className="text-gray-600 text-2xl">Cargando perfil...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full min-h-[400px] flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                    <p className="text-red-600 text-xl mb-4">{error}</p>
                    <button
                        onClick={cargarPerfilAdmin}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-full">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">Mi Perfil de Administrador</h1>
                </div>

                <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8">
                        <div className="flex items-center gap-6">
                            <div className={`w-32 h-32 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-5xl font-bold text-white ${getAvatarColor()}`}>
                                {getInitials(usuario?.username)}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-3xl font-bold text-white mb-2">
                                    {usuario?.username}
                                </h2>
                                <p className="text-white text-opacity-90 text-lg">
                                    Administrador del Sistema
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6">Información del Usuario</h3>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Nombre de Usuario</p>
                                <p className="text-lg text-gray-800 font-medium">{usuario?.username}</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Correo Electrónico</p>
                                <p className="text-lg text-gray-800 font-medium">{usuario?.email || 'No especificado'}</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Tipo de Usuario</p>
                                <p className="text-lg text-gray-800 font-medium">
                                    {usuario?.is_superuser ? 'Super Administrador' : 'Administrador'}
                                </p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Estado</p>
                                <p className="text-lg text-gray-800 font-medium">
                                    {usuario?.is_active ? (
                                        <span className="text-green-600">Activo</span>
                                    ) : (
                                        <span className="text-red-600">Inactivo</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                            <p className="text-sm text-blue-700">
                                <strong>Información:</strong> Este es tu perfil de administrador del sistema de vigilancia. 
                                Desde aquí puedes gestionar cámaras, perfiles de guardias, notificaciones y métricas del sistema.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MiPerfilAdmin;