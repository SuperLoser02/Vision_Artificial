import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        if (username === 'admin' && password === 'admin123') {
            alert('Inicio de sesión exitoso');
            navigate('/perfil');
        } else {
            setError('Credenciales incorrectas');
        }
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
            <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-4">
                <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-800">Iniciar Sesión</h2>
                {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}
                <div className="mb-5">
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">Usuario</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent sm:text-sm"
                    />
                </div>
                <div className="mb-5">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent sm:text-sm"
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-all duration-300"
                >
                    Iniciar Sesión
                </button>
            </form>
        </div>
    );
};

export default Login;