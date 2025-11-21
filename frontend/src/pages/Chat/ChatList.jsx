import React, { useState, useEffect } from 'react';
import { obtenerPerfiles } from '../../services/Api';
import chatService from '../../services/ChatService';

/**
 * Lista de perfiles disponibles para chat
 */
const ChatList = ({ onSelectPerfil }) => {
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCounts, setUnreadCounts] = useState(new Map());
  const [onlineStatus] = useState(new Map()); // Mock: todos online
  
  const perfilActual = JSON.parse(localStorage.getItem('perfilActual'));
  const perfilIdActual = perfilActual?.id;

  useEffect(() => {
    cargarPerfiles();
    
    // Suscribirse a actualizaciones de mensajes no leídos
    const handleUnreadUpdate = (data) => {
      setUnreadCounts(prev => {
        const newMap = new Map(prev);
        newMap.set(data.perfilId, data.count);
        return newMap;
      });
    };

    chatService.on('unread_update', handleUnreadUpdate);
    chatService.on('new_message', handleUnreadUpdate);

    // Cargar contadores iniciales
    const initialCounts = chatService.getAllUnreadCounts();
    setUnreadCounts(initialCounts);

    return () => {
      chatService.off('unread_update', handleUnreadUpdate);
      chatService.off('new_message', handleUnreadUpdate);
    };
  }, []);

  const cargarPerfiles = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await obtenerPerfiles();
      // Filtrar perfil actual y ordenar por nombre
      const perfilesFiltrados = data
        .filter(p => p.id !== perfilIdActual)
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      
      setPerfiles(perfilesFiltrados);
    } catch (err) {
      console.error('Error cargando perfiles:', err);
      setError('No se pudieron cargar los perfiles');
    } finally {
      setLoading(false);
    }
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Hace mucho';
    const diff = Date.now() - new Date(lastSeen).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (perfiles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💬</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No hay perfiles disponibles
        </h3>
        <p className="text-gray-500">
          Crea más perfiles para poder chatear
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
        <h2 className="text-2xl font-bold">Mensajes</h2>
        <p className="text-sm text-blue-100 mt-1">
          {perfiles.length} {perfiles.length === 1 ? 'contacto' : 'contactos'} disponibles
        </p>
      </div>

      {/* Lista de perfiles */}
      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {perfiles.map((perfil) => {
          const unreadCount = unreadCounts.get(perfil.id) || 0;
          const isOnline = onlineStatus.get(perfil.id) || Math.random() > 0.3; // Mock

          return (
            <div
              key={perfil.id}
              onClick={() => onSelectPerfil(perfil)}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
            >
              {/* Avatar con indicador online */}
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-md">
                  {perfil.nombre?.charAt(0).toUpperCase() || 'U'}
                </div>
                {isOnline && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>

              {/* Info del perfil */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {perfil.nombre} {perfil.apellido}
                  </h3>
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 capitalize">
                    {perfil.rol || 'Guardia'}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className={`text-xs ${isOnline ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                    {isOnline ? 'En línea' : formatLastSeen(perfil.last_seen)}
                  </span>
                </div>
                {perfil.zona && (
                  <div className="text-xs text-gray-500 mt-1">
                    📍 {perfil.zona}
                  </div>
                )}
              </div>

              {/* Flecha */}
              <div className="text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatList;
