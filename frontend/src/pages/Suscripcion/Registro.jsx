import React, { useState, useEffect } from "react";
import { obtenerPlanes, registrarUsuario } from "../../services/Api";
import { useNavigate, useSearchParams } from "react-router-dom";

const PAISES = [
    { value: "BOL", label: "Bolivia" }
];

const Registro = () => {
    const [searchParams] = useSearchParams();
    const planIdFromUrl = searchParams.get('plan');

    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        telefono: '',
        email: '',
        username_admin: '',
        password: '',
        confirmar_password: '',
        plan_id: planIdFromUrl || '',
        pais: ''
    });

    const [planes, setPlanes] = useState([]);
    const [costoPlan, setCostoPlan] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        cargarPlanes();
    }, []);

    useEffect(() => {
        // Cuando se cargan los planes y hay un plan en la URL, actualizar el costo
        if (planIdFromUrl && planes.length > 0) {
            const planSeleccionado = planes.find((plan) => plan.id === parseInt(planIdFromUrl));
            if (planSeleccionado) {
                setCostoPlan(`$${parseFloat(planSeleccionado.precio).toFixed(2)}`);
            }
        }
    }, [planIdFromUrl, planes]);

    const cargarPlanes = async () => {
        try {
            const data = await obtenerPlanes();
            setPlanes(data);
        } catch (err) {
            console.error('Error al cargar planes:', err);
            setError('Error al cargar planes. Por favor, intenta más tarde.');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'plan_id') {
            const planSeleccionado = planes.find((plan) => plan.id === parseInt(value));
            setCostoPlan(planSeleccionado ? `$${parseFloat(planSeleccionado.precio).toFixed(2)}` : '');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMensaje('');

        // Validaciones
        if (formData.password !== formData.confirmar_password) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (formData.password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        setLoading(true);

        try {
            const response = await registrarUsuario(formData);
            
            const planNombre = planes.find(p => p.id === parseInt(formData.plan_id))?.nombre || 'Plan seleccionado';
            
            setMensaje(`
                REGISTRO EXITOSO
                
                Empresa: ${formData.nombre}
                Usuario: ${formData.username_admin}
                Plan: ${planNombre}
                
                Redirigiendo al inicio de sesión...
            `);
            
            // Redirigir después de 3 segundos
            setTimeout(() => {
                navigate('/login');
            }, 3000);
            
        } catch (err) {
            console.error('Error al registrar:', err);
            setError(err.error || err.detail || 'Error al registrar la empresa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 bg-gradient-to-r from-blue-500 to-purple-600 min-h-screen w-screen overflow-auto">
            <h1 className="text-center text-4xl font-bold mb-6 text-white">Registro de Empresa</h1>

            {planIdFromUrl && (
                <div className="max-w-2xl mx-auto mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
                    <p className="font-semibold">Plan seleccionado</p>
                    <p className="text-sm mt-1">
                        Has seleccionado el plan <strong>{planes.find(p => p.id === parseInt(planIdFromUrl))?.nombre}</strong>. 
                        Completa tu registro para activarlo.
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="mb-4">
                        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                            Nombre de la Empresa *
                        </label>
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            required
                            className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Correo Electrónico *
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
                        Dirección *
                    </label>
                    <input
                        type="text"
                        id="direccion"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleChange}
                        required
                        className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="mb-4">
                        <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                            Teléfono *
                        </label>
                        <input
                            type="text"
                            id="telefono"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            required
                            className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="pais" className="block text-sm font-medium text-gray-700">
                            País *
                        </label>
                        <select
                            id="pais"
                            name="pais"
                            value={formData.pais}
                            onChange={handleChange}
                            required
                            className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        >
                            <option value="">Seleccione un país</option>
                            {PAISES.map((pais) => (
                                <option key={pais.value} value={pais.value}>
                                    {pais.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <hr className="my-6" />
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos de Acceso</h3>

                <div className="mb-4">
                    <label htmlFor="username_admin" className="block text-sm font-medium text-gray-700">
                        Nombre de Usuario *
                    </label>
                    <input
                        type="text"
                        id="username_admin"
                        name="username_admin"
                        value={formData.username_admin}
                        onChange={handleChange}
                        required
                        className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Contraseña *
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={8}
                            className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="confirmar_password" className="block text-sm font-medium text-gray-700">
                            Confirmar Contraseña *
                        </label>
                        <input
                            type="password"
                            id="confirmar_password"
                            name="confirmar_password"
                            value={formData.confirmar_password}
                            onChange={handleChange}
                            required
                            minLength={8}
                            className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        />
                    </div>
                </div>

                <hr className="my-6" />
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Selección de Plan</h3>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="mb-4">
                        <label htmlFor="plan_id" className="block text-sm font-medium text-gray-700">
                            Plan *
                        </label>
                        <select
                            id="plan_id"
                            name="plan_id"
                            value={formData.plan_id}
                            onChange={handleChange}
                            required
                            className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        >
                            <option value="">Seleccione un plan</option>
                            {planes.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.nombre} - ${parseFloat(plan.precio).toFixed(2)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="costo_plan" className="block text-sm font-medium text-gray-700">
                            Costo del Plan
                        </label>
                        <input
                            type="text"
                            id="costo_plan"
                            name="costo_plan"
                            value={costoPlan}
                            readOnly
                            className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100 focus:outline-none"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Registrando...' : 'Registrar Empresa'}
                </button>

                <div className="mt-4 text-center">
                    <p className="text-gray-600">
                        ¿Ya tienes cuenta?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                            Inicia sesión aquí
                        </button>
                    </p>
                </div>
            </form>

            {mensaje && (
                <div className="mt-6 max-w-2xl mx-auto bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded whitespace-pre-line">
                    {mensaje}
                </div>
            )}
        </div>
    );
};

export default Registro;