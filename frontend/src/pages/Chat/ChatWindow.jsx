import React, { useState, useEffect, useRef, useCallback } from 'react';
import chatService from '../../services/ChatService';

/**
 * Ventana de chat individual con un perfil
 */
const ChatWindow = ({ perfil, onClose }) => {
  const [mensajes, setMensajes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const perfilActual = JSON.parse(localStorage.getItem('perfilActual'));

  // Usar useCallback para garantizar que los handlers sean estables
  const cargarMensajes = useCallback(() => {
    const mensajesCache = chatService.getMessages(perfil.id);
    console.log('🔄 Cargando mensajes para perfil', perfil.id, ':', mensajesCache.length);
    setMensajes([...mensajesCache]); // Crear nuevo array para forzar re-render
  }, [perfil.id]);

  useEffect(() => {
    console.log('🔧 ChatWindow montado para perfil:', perfil.id, perfil.nombre);
    
    // Cargar mensajes existentes del caché
    cargarMensajes();

    // Marcar como leídos al abrir el chat
    chatService.markAsRead(perfil.id);

    // Verificar conexión
    const connected = chatService.isWebSocketConnected();
    console.log('🔌 Estado de conexión:', connected);
    setIsConnected(connected);

    // Suscribirse a eventos
    const handleNewMessage = (data) => {
      console.log('📨 handleNewMessage evento recibido:', data);
      console.log('   Comparando perfilId:', data.perfilId, '(type:', typeof data.perfilId, ') con', perfil.id, '(type:', typeof perfil.id, ')');
      
      // Convertir ambos a string para comparación
      if (String(data.perfilId) === String(perfil.id)) {
        console.log('✅ Match! Actualizando mensajes...');
        cargarMensajes(); // Usar función de carga
        chatService.markAsRead(perfil.id);
      } else {
        console.log('❌ No match, perfilId diferente');
      }
    };

    const handleMessageSent = (data) => {
      console.log('📤 handleMessageSent evento recibido:', data);
      
      // Convertir ambos a string para comparación
      if (String(data.perfilId) === String(perfil.id)) {
        console.log('✅ Mensaje enviado, actualizando UI');
        cargarMensajes(); // Usar función de carga
      }
    };

    const handleConnected = (connected) => {
      console.log('🔌 Estado de conexión cambió:', connected);
      setIsConnected(connected);
    };

    chatService.on('new_message', handleNewMessage);
    chatService.on('message_sent', handleMessageSent);
    chatService.on('connected', handleConnected);

    // Focus en el input
    inputRef.current?.focus();

    return () => {
      console.log('🧹 ChatWindow desmontado para perfil:', perfil.id);
      chatService.off('new_message', handleNewMessage);
      chatService.off('message_sent', handleMessageSent);
      chatService.off('connected', handleConnected);
    };
  }, [perfil.id, perfil.nombre, cargarMensajes]); // Agregar dependencias correctas

  useEffect(() => {
    // Scroll automático al último mensaje
    scrollToBottom();
  }, [mensajes]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!mensaje.trim()) return;
    if (!isConnected) {
      alert('❌ WebSocket no está conectado. Intenta reconectar.');
      return;
    }

    setIsSending(true);
    
    const success = chatService.sendMessage(
      perfil.id,
      `${perfil.nombre} ${perfil.apellido}`,
      mensaje.trim()
    );

    if (success) {
      setMensaje('');
      inputRef.current?.focus();
    } else {
      alert('❌ No se pudo enviar el mensaje. Verifica la conexión.');
    }
    
    setIsSending(false);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    if (days < 7) {
      const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
      return dayName.charAt(0).toUpperCase() + dayName.slice(1);
    }
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white text-lg font-bold">
              {perfil.nombre?.charAt(0).toUpperCase() || 'U'}
            </div>
            {isConnected && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
            )}
          </div>
          
          {/* Info */}
          <div>
            <h2 className="text-lg font-bold">
              {perfil.nombre} {perfil.apellido}
            </h2>
            <p className="text-sm text-blue-100">
              {isConnected ? '🟢 En línea' : '🔴 Desconectado'}
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all duration-200"
            title="Cerrar chat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
        {mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-lg">No hay mensajes aún</p>
            <p className="text-sm">Envía el primer mensaje</p>
          </div>
        ) : (
          mensajes.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.esMio ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${msg.esMio ? 'order-2' : 'order-1'}`}>
                {/* Burbuja de mensaje */}
                <div
                  className={`rounded-2xl px-4 py-2 shadow-md ${
                    msg.esMio
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-white text-gray-900 rounded-bl-none'
                  }`}
                >
                  <p className="break-words">{msg.mensaje}</p>
                </div>
                
                {/* Timestamp */}
                <div className={`text-xs text-gray-500 mt-1 px-2 ${msg.esMio ? 'text-right' : 'text-left'}`}>
                  {formatTimestamp(msg.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensaje */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder={isConnected ? 'Escribe un mensaje...' : 'Esperando conexión...'}
            disabled={!isConnected || isSending}
            className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
            maxLength={500}
          />
          
          <button
            type="submit"
            disabled={!mensaje.trim() || !isConnected || isSending}
            className="bg-blue-500 text-white rounded-full p-3 hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            title="Enviar mensaje"
          >
            {isSending ? (
              <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Contador de caracteres */}
        <div className="text-xs text-gray-400 text-right mt-1">
          {mensaje.length}/500
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
