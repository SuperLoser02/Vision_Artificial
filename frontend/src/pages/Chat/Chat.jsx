import React, { useState, useEffect } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import chatService from '../../services/ChatService';

/**
 * Página principal de Chat
 * Muestra lista de perfiles y ventana de chat
 */
const Chat = () => {
  const [perfilSeleccionado, setPerfilSeleccionado] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  const perfilActual = JSON.parse(localStorage.getItem('perfilActual'));
  const perfilId = perfilActual?.id;
  const authToken = localStorage.getItem('authToken');

  useEffect(() => {
    // El WebSocket ya está conectado desde Dashboard
    console.log('📱 Chat.jsx montado, WebSocket ya conectado desde Dashboard');

    // Suscribirse a eventos de conexión
    const handleConnected = (connected) => {
      console.log('✅ Chat.jsx - Estado de conexión:', connected);
      setIsConnected(connected);
      if (connected) {
        setConnectionError('');
      }
    };

    const handleError = (error) => {
      console.error('❌ Chat.jsx - Error de conexión:', error);
      setConnectionError('Error de conexión WebSocket');
    };

    const handleMaxReconnect = () => {
      console.error('❌ Chat.jsx - Máximo de intentos de reconexión alcanzado');
      setConnectionError('No se pudo conectar al servidor. Recarga la página.');
    };

    chatService.on('connected', handleConnected);
    chatService.on('error', handleError);
    chatService.on('max_reconnect_reached', handleMaxReconnect);

    // Verificar estado inicial
    setIsConnected(chatService.isWebSocketConnected());

    return () => {
      chatService.off('connected', handleConnected);
      chatService.off('error', handleError);
      chatService.off('max_reconnect_reached', handleMaxReconnect);
      // No desconectar aquí porque otros componentes podrían usar el WebSocket
    };
  }, [perfilId, authToken]);

  const handleSelectPerfil = (perfil) => {
    console.log('👤 Perfil seleccionado para chat:', perfil);
    setPerfilSeleccionado(perfil);
  };

  const handleCloseChat = () => {
    console.log('❌ Cerrando ventana de chat');
    setPerfilSeleccionado(null);
  };

  return (
    <div className="w-full min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Chat en Tiempo Real</h1>
          <p className="text-gray-600 mt-2">
            Comunícate instantáneamente con otros perfiles del sistema
          </p>
          
          {/* Indicador de conexión */}
          <div className="mt-4 flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
            <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>

          {connectionError && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {connectionError}
            </div>
          )}
        </div>

        {/* Layout: Lista + Ventana de chat */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de perfiles (siempre visible) */}
          <div className="lg:col-span-1">
            <ChatList onSelectPerfil={handleSelectPerfil} />
          </div>

          {/* Ventana de chat (visible cuando hay perfil seleccionado) */}
          <div className="lg:col-span-2">
            {perfilSeleccionado ? (
              <ChatWindow
                perfil={perfilSeleccionado}
                onClose={handleCloseChat}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-lg h-[600px] flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-8xl mb-4">💬</div>
                  <h3 className="text-2xl font-semibold mb-2">Selecciona un contacto</h3>
                  <p className="text-lg">
                    Elige un perfil de la lista para comenzar a chatear
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
