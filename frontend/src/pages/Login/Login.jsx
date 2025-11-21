import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../../services/Api';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await loginAdmin(username, password);
            // Redirigir a selección de perfil después del login exitoso
            navigate('/perfil');
        } catch (err) {
            setError(err.error || err.detail || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
            <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-4">
                <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-800">Iniciar Sesión</h2>
                

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
                        {error}
                    </div>
                )}
                
                <div className="mb-5">
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">Usuario</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent sm:text-sm"
                        required
                        disabled={loading}
                        autoComplete="username"
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
                        required
                        disabled={loading}
                        autoComplete="current-password"
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>

                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={() => navigate('/suscripcion')}
                        className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
                        disabled={loading}
                    >
                        ¿No tienes cuenta? Regístrate aquí
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Login;