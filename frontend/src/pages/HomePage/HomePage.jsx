import React from 'react';

const HomePage = () => {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <header className="text-center mb-8 px-4">
                <h1 className="text-5xl md:text-6xl font-extrabold">Bienvenido a Vision Artificial</h1>
                <p className="text-lg md:text-xl mt-4">Explora nuestras soluciones innovadoras para la seguridad visual.</p>
            </header>
            <main className="text-center">
                <button className="bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50 transition-all duration-300">
                    Comenzar
                </button>
            </main>
        </div>
    );
};

export default HomePage;