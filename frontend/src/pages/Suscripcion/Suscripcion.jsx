import React, { useState, useEffect } from "react";
import { obtenerPlanes } from "../../services/Api";
import { useNavigate } from "react-router-dom";

const Suscripcion = () => {
    const [planes, setPlanes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        cargarPlanes();
    }, []);

    const cargarPlanes = async () => {
        try {
            setLoading(true);
            const data = await obtenerPlanes();
            setPlanes(data);
            setError('');
        } catch (err) {
            console.error('Error al cargar planes:', err);
            setError(err.detail || err.error || 'Error al cargar los planes disponibles');
        } finally {
            setLoading(false);
        }
    };

    const handleSeleccionarPlan = (planId, planNombre) => {
        // Verificar si el usuario ya está autenticado
        const token = localStorage.getItem('authToken');
        
        if (token) {
            // Si ya está logueado, mostrar mensaje
            alert('Ya tienes una cuenta activa. Este plan solo está disponible al registrarte.');
            return;
        }

        // Redirigir al registro con el plan seleccionado
        navigate(`/registro?plan=${planId}`);
    };

    const formatearDuracion = (duracion_meses) => {
        if (duracion_meses === 1) return '1 mes';
        if (duracion_meses === 12) return '1 año';
        return `${duracion_meses} meses`;
    };

    if (loading) {
        return (
            <div className="container mx-auto py-5 bg-gradient-to-r from-blue-500 to-purple-600 h-screen w-screen flex items-center justify-center">
                <div className="text-white text-2xl">Cargando planes...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-5 bg-gradient-to-r from-blue-500 to-purple-600 h-screen w-screen flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <p className="text-red-600 text-xl mb-4">{error}</p>
                    <button
                        onClick={cargarPlanes}
                        className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-5 bg-gradient-to-r from-blue-500 to-purple-600 min-h-screen w-screen overflow-auto">
            <h1 className="text-center text-4xl font-bold mb-4 text-white">Planes de Suscripción</h1>
            <p className="text-center text-white text-lg mb-8">Selecciona el plan ideal para tu empresa</p>
            
            {planes.length === 0 ? (
                <div className="text-center text-white text-xl">
                    No hay planes disponibles en este momento
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 max-w-7xl mx-auto pb-10">
                    {planes.map((plan) => (
                        <div 
                            key={plan.id} 
                            className="bg-white shadow-xl rounded-lg p-6 text-center border-2 border-blue-500 hover:shadow-2xl hover:scale-105 transition-all duration-300 flex flex-col"
                        >
                            <div className="mb-4">
                                <h5 className="text-2xl font-bold text-blue-600 mb-2">{plan.nombre}</h5>
                                <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"></div>
                            </div>
                            
                            {plan.descripcion && (
                                <p className="text-gray-600 mb-4 flex-grow text-sm leading-relaxed">
                                    {plan.descripcion}
                                </p>
                            )}
                            
                            <div className="mb-6">
                                <p className="text-4xl font-bold text-green-600 mb-1">
                                    ${parseFloat(plan.precio).toFixed(2)}
                                </p>
                                <p className="text-gray-500 text-sm">por {formatearDuracion(plan.duracion_meses)}</p>
                            </div>

                            <button
                                className="mt-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl"
                                onClick={() => handleSeleccionarPlan(plan.id, plan.nombre)}
                            >
                                Seleccionar Plan
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="text-center mt-8">
                <button
                    onClick={() => navigate('/login')}
                    className="text-white hover:text-gray-200 font-semibold text-lg underline"
                >
                    ¿Ya tienes cuenta? Inicia sesión aquí
                </button>
            </div>
        </div>
    );
};

export default Suscripcion;