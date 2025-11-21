/**
 * Servicio de Chat en Tiempo Real usando WebSocket
 * Reutiliza el WebSocket de notificaciones para mensajería instantánea
 */

class ChatService {
  constructor() {
    this.ws = null;
    this.perfilId = null;
    this.token = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.messagesCache = new Map(); // { perfilId: [mensajes] }
    this.unreadCount = new Map(); // { perfilId: count }
    this.isConnected = false;
    this.shouldReconnect = true; // Controla si debe reconectar automáticamente
  }

  /**
   * Conectar al WebSocket de notificaciones
   * @param {number} perfilId - ID del perfil actual
   * @param {string} token - Token de autenticación
   */
  connect(perfilId, token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('⚠️ WebSocket ya está conectado, cerrando conexión previa');
      this.disconnect();
    }

    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('⚠️ WebSocket está intentando conectar, esperando...');
      return;
    }

    this.perfilId = perfilId;
    this.token = token;
    this.shouldReconnect = true; // Activar reconexión automática al conectar

    try {
      const wsHost = import.meta.env.VITE_WS_HOST || window.location.hostname;
      const wsPort = import.meta.env.VITE_WS_PORT || '8000';
      const wsUrl = `ws://${wsHost}:${wsPort}/ws/notificaciones/${perfilId}/?token=${token}`;
      
      console.log('🔌 Conectando ChatService a WebSocket:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ ChatService WebSocket conectado');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected', true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📩 ChatService recibió mensaje:', data);
          console.log('📩 Tipo de mensaje:', data.type);

          // Manejar diferentes tipos de mensajes
          switch (data.type) {
            case 'chat.message':
              console.log('✅ Mensaje de chat detectado, llamando handleChatMessage');
              this.handleChatMessage(data);
              break;
            case 'nueva_notificacion':
              console.log('🔔 Nueva notificación detectada');
              this.emit('nueva_notificacion', data);
              break;
            case 'notificacion_leida':
              console.log('✓ Notificación leída detectada');
              this.emit('notificacion_leida', data);
              break;
            case 'pong':
              // Respuesta a ping
              console.log('🏓 Pong recibido');
              break;
            default:
              console.log('⚠️ Tipo de mensaje no manejado:', data.type);
          }
        } catch (error) {
          console.error('❌ Error procesando mensaje WebSocket:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Error en ChatService WebSocket:', error);
        this.isConnected = false;
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('🔌 ChatService WebSocket desconectado');
        this.isConnected = false;
        this.emit('connected', false);
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('❌ Error al conectar ChatService:', error);
    }
  }

  /**
   * Intentar reconexión automática
   */
  attemptReconnect() {
    if (!this.shouldReconnect) {
      console.log('🚫 Reconexión deshabilitada, no intentando reconectar');
      return;
    }
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Máximo de intentos de reconexión alcanzado');
      this.emit('max_reconnect_reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 Reconectando en ${delay / 1000}s (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.perfilId && this.token) {
        this.connect(this.perfilId, this.token);
      }
    }, delay);
  }

  /**
   * Manejar mensaje de chat recibido
   * @param {Object} data - Datos del mensaje
   */
  handleChatMessage(data) {
    const { remitente_id, remitente_nombre, mensaje, timestamp } = data;
    
    console.log('💬 handleChatMessage llamado:', {
      remitente_id,
      remitente_nombre,
      mensaje,
      timestamp,
      'tipo_remitente_id': typeof remitente_id
    });
    
    // Convertir remitente_id a número si es string
    const remitenteIdNum = typeof remitente_id === 'string' ? parseInt(remitente_id) : remitente_id;
    
    const mensajeObj = {
      remitenteId: remitenteIdNum,
      remitenteNombre: remitente_nombre,
      mensaje: mensaje,
      timestamp: timestamp,
      esMio: false
    };

    // Agregar mensaje al caché (usar el ID numérico)
    if (!this.messagesCache.has(remitenteIdNum)) {
      this.messagesCache.set(remitenteIdNum, []);
      console.log('📦 Creado nuevo array de mensajes para perfil', remitenteIdNum);
    }
    this.messagesCache.get(remitenteIdNum).push(mensajeObj);
    
    console.log('✅ Mensaje agregado al caché. Total mensajes de perfil', remitenteIdNum, ':', this.messagesCache.get(remitenteIdNum).length);

    // Incrementar contador de no leídos
    const currentUnread = this.unreadCount.get(remitenteIdNum) || 0;
    this.unreadCount.set(remitenteIdNum, currentUnread + 1);

    // Notificar a los listeners
    console.log('🔔 Emitiendo evento new_message con perfilId:', remitenteIdNum);
    this.emit('new_message', {
      perfilId: remitenteIdNum,
      mensaje: mensajeObj
    });

    this.emit('unread_update', {
      perfilId: remitenteIdNum,
      count: this.unreadCount.get(remitenteIdNum)
    });
    
    console.log('🔔 Eventos emitidos: new_message y unread_update para perfil', remitenteIdNum);
  }

  /**
   * Enviar mensaje de chat
   * @param {number} destinatarioId - ID del perfil destinatario
   * @param {string} destinatarioNombre - Nombre del destinatario
   * @param {string} mensaje - Contenido del mensaje
   */
  sendMessage(destinatarioId, destinatarioNombre, mensaje) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket no está conectado');
      this.emit('send_error', { error: 'WebSocket no conectado' });
      return false;
    }

    try {
      const payload = {
        type: 'chat.message',
        destinatario_id: destinatarioId,
        destinatario_nombre: destinatarioNombre,
        mensaje: mensaje
      };

      console.log('📤 Enviando mensaje:', payload);
      this.ws.send(JSON.stringify(payload));

      // Agregar mensaje a mi caché (enviado por mí)
      const mensajeObj = {
        remitenteId: this.perfilId,
        remitenteNombre: 'Yo',
        mensaje: mensaje,
        timestamp: new Date().toISOString(),
        esMio: true
      };

      if (!this.messagesCache.has(destinatarioId)) {
        this.messagesCache.set(destinatarioId, []);
      }
      this.messagesCache.get(destinatarioId).push(mensajeObj);

      this.emit('message_sent', {
        perfilId: destinatarioId,
        mensaje: mensajeObj
      });

      return true;
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      this.emit('send_error', { error: error.message });
      return false;
    }
  }

  /**
   * Obtener mensajes de un perfil específico
   * @param {number} perfilId - ID del perfil
   * @returns {Array} Lista de mensajes
   */
  getMessages(perfilId) {
    return this.messagesCache.get(perfilId) || [];
  }

  /**
   * Marcar mensajes como leídos
   * @param {number} perfilId - ID del perfil
   */
  markAsRead(perfilId) {
    this.unreadCount.set(perfilId, 0);
    this.emit('unread_update', {
      perfilId: perfilId,
      count: 0
    });
  }

  /**
   * Obtener contador de mensajes no leídos
   * @param {number} perfilId - ID del perfil
   * @returns {number} Cantidad de mensajes no leídos
   */
  getUnreadCount(perfilId) {
    return this.unreadCount.get(perfilId) || 0;
  }

  /**
   * Obtener todos los contadores de no leídos
   * @returns {Map} Mapa de perfilId -> count
   */
  getAllUnreadCounts() {
    return new Map(this.unreadCount);
  }

  /**
   * Suscribirse a eventos del chat
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función callback
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Desuscribirse de eventos
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función callback a remover
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emitir evento a los listeners
   * @param {string} event - Nombre del evento
   * @param {*} data - Datos del evento
   */
  emit(event, data) {
    if (!this.listeners.has(event)) {
      console.log(`⚠️ No hay listeners para el evento '${event}'`);
      return;
    }
    
    const callbacks = this.listeners.get(event);
    console.log(`📢 Emitiendo evento '${event}' a ${callbacks.length} listener(s)`);
    
    callbacks.forEach((callback, index) => {
      try {
        console.log(`  └─ Ejecutando listener #${index + 1}`);
        callback(data);
      } catch (error) {
        console.error(`❌ Error en listener #${index + 1} de evento '${event}':`, error);
      }
    });
  }

  /**
   * Desconectar WebSocket
   */
  disconnect() {
    console.log('🔌 Desconectando ChatService intencionalmente, deshabilitando reconexión');
    this.shouldReconnect = false; // Deshabilitar reconexión automática
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.perfilId = null;
    this.token = null;
    this.emit('disconnected');
  }

  /**
   * Limpiar todos los mensajes y contadores
   */
  clearAllMessages() {
    this.messagesCache.clear();
    this.unreadCount.clear();
    this.emit('messages_cleared');
  }

  /**
   * Verificar si está conectado
   * @returns {boolean}
   */
  isWebSocketConnected() {
    return this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Exportar instancia única (singleton)
const chatService = new ChatService();
export default chatService;
