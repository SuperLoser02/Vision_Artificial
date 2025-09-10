import React, { useState } from "react";

const PAISES = [
    { value: "BOL", label: "Bolivia" }
];

const Suscripcion = () => {
    const [planes] = useState([
        { id: 1, nombre: "Plan Básico", cantidad_duracion: 30, tipo_de_duracion: "d", precio: 10 },
        { id: 2, nombre: "Plan Premium", cantidad_duracion: 1, tipo_de_duracion: "m", precio: 20 }
    ]);

    return (
        <div className="container mx-auto py-5 bg-gradient-to-r from-blue-500 to-purple-600 h-screen w-screen">
            <h1 className="text-center text-3xl font-bold mb-6">Planes de Suscripción</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {planes.map((plan) => (
                    <div key={plan.id} className="bg-white shadow-lg rounded-lg p-6 text-center border border-blue-500">
                        <h5 className="text-xl font-bold mb-2 text-blue-600">{plan.nombre}</h5>
                        <p className="text-gray-700 mb-2">
                            Duración: {plan.cantidad_duracion} {plan.tipo_de_duracion === 'd' ? 'día(s)' : plan.tipo_de_duracion === 'm' ? 'mes(es)' : 'año(s)'}
                        </p>
                        <p className="text-lg font-bold text-gray-800">Precio: ${plan.precio}</p>
                        <button
                            className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-all duration-300"
                            onClick={() => alert(`Simulación: Comprar el plan ${plan.nombre}`)}
                        >
                            Comprar ahora
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Suscripcion;