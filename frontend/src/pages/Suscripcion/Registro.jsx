import React, { useState } from "react";

const PAISES = [
    { value: "BOL", label: "Bolivia" }
];

const Registro = () => {
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        telefono: '',
        email: '',
        username_admin: '',
        plan_id: '',
        pais: ''
    });

    const [planes] = useState([
        { id: 1, nombre: "Plan Básico", precio: "$10" },
        { id: 2, nombre: "Plan Premium", precio: "$20" }
    ]);

    const [costoPlan, setCostoPlan] = useState('');
    const [mensaje, setMensaje] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'plan_id') {
            const planSeleccionado = planes.find((plan) => plan.id === parseInt(value));
            setCostoPlan(planSeleccionado ? planSeleccionado.precio : '');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setMensaje(`Registro simulado exitoso para ${formData.nombre}`);
    };

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-center text-3xl font-bold mb-6 text-gray-800">Registro</h1>
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
                <div className="mb-4">
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
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
                    <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">Dirección</label>
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
                <div className="mb-4">
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">Teléfono</label>
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
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
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
                <div className="mb-4">
                    <label htmlFor="username_admin" className="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
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
                <div className="mb-4">
                    <label htmlFor="plan_id" className="block text-sm font-medium text-gray-700">Plan</label>
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
                                {plan.nombre}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="mb-4">
                    <label htmlFor="costo_plan" className="block text-sm font-medium text-gray-700">Costo del Plan</label>
                    <input
                        type="text"
                        id="costo_plan"
                        name="costo_plan"
                        value={costoPlan}
                        readOnly
                        className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="pais" className="block text-sm font-medium text-gray-700">País</label>
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
                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-all duration-300"
                >
                    Registrar Empresa
                </button>
            </form>
            {mensaje && <p className="mt-4 text-center text-green-600 font-medium">{mensaje}</p>}
        </div>
    );
};

export default Registro;