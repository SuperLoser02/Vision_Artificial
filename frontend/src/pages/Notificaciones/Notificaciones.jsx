import React, { useEffect, useState, useRef } from "react";
import api, { obtenerPerfiles, obtenerZonas } from "../../services/Api";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import chatService from '../../services/ChatService';

const nivelesColores = [
  'from-red-500 to-red-600',
  'from-yellow-500 to-yellow-600',
  'from-green-500 to-green-600',
];
const niveles = ['rojo', 'amarillo', 'verde'];
const tipos = [
  { value: "violencia", label: "Violencia" },
  { value: "arma", label: "Armas" },
  { value: "otro", label: "Otro" }
];
const canales = ["push", "sms", "email", "dashboard"];

const getNivelColor = (nivel) => {
  if (nivel === 'rojo') return nivelesColores[0];
  if (nivel === 'amarillo') return nivelesColores[1];
  return nivelesColores[2];
};

const getNivelIcon = (nivel) => {
  if (nivel === 'rojo') return '🛑';
  if (nivel === 'amarillo') return '⚠️';
  return '✅';
};

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtros, setFiltros] = useState({
    tipo: "",
    nivel_peligro: "",
    zona: "",
    leida: "",
  });
  const [detalle, setDetalle] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    perfil: "",
    titulo: "",
    mensaje: "",
    tipo: "violencia",
    prioridad: "media",
    nivel_peligro: "rojo",
    canal: "dashboard",
    zona: ""
  });
  const [perfiles, setPerfiles] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const navigate = useNavigate();

  // Obtener perfil actual del localStorage
  const perfilActual = JSON.parse(localStorage.getItem("perfilActual"));
  const perfilId = perfilActual?.id;
  const authToken = localStorage.getItem("authToken");

  useEffect(() => {
    cargarNotificaciones();
    cargarPerfiles();
    cargarZonas();
    
    // El WebSocket ya está conectado desde Dashboard
    console.log('📱 Notificaciones.jsx montado, WebSocket ya conectado desde Dashboard');

    // Suscribirse a eventos de notificaciones
    const handleNuevaNotificacion = (data) => {
      handleNuevaNotificacionRecibida(data);
    };

    const handleNotificacionLeida = (data) => {
      handleNotificacionLeidaRecibida(data);
    };

    chatService.on('nueva_notificacion', handleNuevaNotificacion);
    chatService.on('notificacion_leida', handleNotificacionLeida);

    return () => {
      // Desuscribirse al desmontar
      chatService.off('nueva_notificacion', handleNuevaNotificacion);
      chatService.off('notificacion_leida', handleNotificacionLeida);
      // No desconectar el WebSocket porque Chat.jsx también lo usa
    };
    // eslint-disable-next-line
  }, [filtros]);

  const handleNotificacionLeidaRecibida = (data) => {
    const { notificacion_id, perfil_nombre, fecha_lectura } = data;
    
    // Actualizar la notificación en la lista
    setNotificaciones(prev => prev.map(n => 
      n.id === notificacion_id 
        ? { ...n, leida: true, fecha_lectura: fecha_lectura || new Date().toISOString() }
        : n
    ));

    // Mostrar toast bonito
    if (perfil_nombre && perfil_nombre !== perfilActual?.nombre) {
      toast.success(
        <div className="flex items-center gap-3">
          <div className="text-2xl">✓</div>
          <div>
            <p className="font-semibold">{perfil_nombre} leyó la alerta</p>
            <p className="text-sm text-gray-600">
              {new Date(fecha_lectura || Date.now()).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          className: 'bg-white shadow-lg',
        }
      );
    }
  };

  const handleNuevaNotificacionRecibida = (data) => {
    const { notificacion } = data;
    
    // Agregar al inicio de la lista
    setNotificaciones(prev => [notificacion, ...prev]);

    // Toast para nueva notificación
    toast.info(
      <div className="flex items-center gap-3">
        <div className="text-2xl">🔔</div>
        <div>
          <p className="font-semibold">{notificacion.titulo}</p>
          <p className="text-sm text-gray-600">{notificacion.mensaje}</p>
        </div>
      </div>,
      {
        position: "top-right",
        autoClose: 7000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  };

  const cargarNotificaciones = async () => {
    setLoading(true);
    setError("");
    try {
      let params = {};
      // Solo filtrar por perfil si existe y estamos en vista de guardia
      // Si estamos como admin/empresa, NO filtrar por perfil para ver TODAS las notificaciones
      const perfilActual = JSON.parse(localStorage.getItem("perfilActual"));
      const perfilId = perfilActual?.id;
      
      // SOLO aplicar filtro de perfil si explícitamente está en el filtro
      // No aplicar por defecto para que admin vea todas
      if (filtros.perfil_id) {
        params.perfil_id = filtros.perfil_id;
      }
      // Si hay perfilId pero estamos viendo como admin, NO filtrar
      // (el admin debería ver todas las notificaciones)
      
      // Aplicar otros filtros
      Object.entries(filtros).forEach(([k, v]) => {
        if (v && k !== 'perfil_id') params[k] = v;
      });
      
      console.log('Cargando notificaciones con params:', params);
      console.log('Usuario actual:', localStorage.getItem('authToken') ? 'Admin/Empresa' : 'Sin sesión');
      console.log('Perfil actual:', perfilActual);
      
      const res = await api.get("notificaciones/", { params });
      console.log('Respuesta completa del servidor:', res);
      console.log('Notificaciones recibidas:', res.data);
      console.log('Tipo de datos:', typeof res.data, 'Es array:', Array.isArray(res.data));
      
      // El backend puede devolver { count, results } o directamente un array
      let notifs = [];
      if (res.data && res.data.results) {
        // Formato con paginación
        notifs = Array.isArray(res.data.results) ? res.data.results : [];
        console.log('Formato paginado, notificaciones:', notifs.length);
      } else if (Array.isArray(res.data)) {
        // Formato array directo
        notifs = res.data;
        console.log('Formato array directo, notificaciones:', notifs.length);
      } else {
        console.warn('Formato de respuesta no reconocido:', res.data);
      }
      
      setNotificaciones(notifs);
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
      setError(err.detail || err.error || "No se pudieron cargar las notificaciones");
      setNotificaciones([]); // Asegurar array vacío en caso de error
    }
    setLoading(false);
  };

  const cargarPerfiles = async () => {
    try {
      const data = await obtenerPerfiles();
      console.log('Perfiles cargados:', data);
      setPerfiles(data);
    } catch (err) {
      console.error('Error al cargar perfiles:', err);
      setPerfiles([]);
    }
  };

  const cargarZonas = async () => {
    try {
      const data = await obtenerZonas();
      console.log('Zonas cargadas:', data);
      setZonas(data);
    } catch (err) {
      console.error('Error al cargar zonas:', err);
      setZonas([]);
    }
  };

  const handleFiltroChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMarcarLeida = async (id) => {
    try {
      await api.patch(`notificaciones/${id}/`, { leida: true });
      cargarNotificaciones();
    } catch (err) {
      setError("No se pudo marcar como leída");
    }
  };

  const handleEnviarNotificacion = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!formData.perfil || !formData.mensaje.trim()) {
      setFormError("Debes seleccionar un perfil y escribir un mensaje.");
      return;
    }
    
    // Si no hay título, generar uno basado en el tipo
    const dataToSend = {
      ...formData,
      titulo: formData.titulo.trim() || `${formData.tipo.charAt(0).toUpperCase() + formData.tipo.slice(1)} detectado`
    };
    
    setFormLoading(true);
    try {
      await api.post("notificaciones/", dataToSend);
      setShowForm(false);
      setFormData({
        perfil: "",
        titulo: "",
        mensaje: "",
        tipo: "violencia",
        prioridad: "media",
        nivel_peligro: "rojo",
        canal: "dashboard",
        zona: ""
      });
      cargarNotificaciones();
    } catch (err) {
      console.error('Error al enviar notificación:', err);
      setFormError(err.detail || err.error || "No se pudo enviar la notificación");
    }
    setFormLoading(false);
  };

  return (
    <div className="w-full min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Notificaciones</h1>
            <p className="text-gray-600 mt-2">
              Historial y gestión de alertas y mensajes de seguridad
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300"
            >
              + Nueva Notificación
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-2">
          <select name="tipo" value={filtros.tipo} onChange={handleFiltroChange} className="p-2 rounded border border-gray-300">
            <option value="">Todos los tipos</option>
            {tipos.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select name="nivel_peligro" value={filtros.nivel_peligro} onChange={handleFiltroChange} className="p-2 rounded border border-gray-300">
            <option value="">Todos los niveles</option>
            {niveles.map((n) => (
              <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
            ))}
          </select>
          <select name="zona" value={filtros.zona} onChange={handleFiltroChange} className="p-2 rounded border border-gray-300">
            <option value="">Todas las zonas</option>
            {zonas.map((z) => (
              <option key={z.id} value={z.nombre}>{z.nombre}</option>
            ))}
          </select>
          <select name="leida" value={filtros.leida} onChange={handleFiltroChange} className="p-2 rounded border border-gray-300">
            <option value="">Todas</option>
            <option value="true">Leídas</option>
            <option value="false">No leídas</option>
          </select>
        </div>

        {/* Error global */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Lista de notificaciones */}
        {loading && (!Array.isArray(notificaciones) || notificaciones.length === 0) ? (
          <div className="text-gray-600 text-center text-2xl py-20">
            Cargando notificaciones...
          </div>
        ) : !Array.isArray(notificaciones) || notificaciones.length === 0 ? (
          <div className="bg-gray-100 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">No hay notificaciones registradas</h2>
            <p className="mb-6 text-gray-600">Aún no se han generado alertas o mensajes de seguridad</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(notificaciones) && notificaciones.map((n, index) => (
              <div
                key={n.id || index}
                className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => setDetalle(n)}
              >
                <div className={`bg-gradient-to-r ${getNivelColor(n.nivel_peligro)} p-6`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-4xl">{getNivelIcon(n.nivel_peligro)}</div>
                    <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded text-gray-900">
                      Canal: {n.canal}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{n.tipo?.charAt(0).toUpperCase() + n.tipo?.slice(1)}</h3>
                </div>
                <div className="p-6">
                  <p className="mb-4 min-h-[60px] text-gray-900">{n.mensaje}</p>
                  <div className="text-xs text-gray-700 mb-2">
                    Zona: {n.zona || "Sin zona"}
                  </div>
                  <div className="text-xs text-gray-700 mb-2">
                    {n.fecha_hora ? new Date(n.fecha_hora).toLocaleString() : 'Sin fecha'}
                  </div>
                  
                  {/* Badge de estado leída */}
                  {n.leida && (
                    <div className="mb-3 bg-green-50 border border-green-200 rounded-lg p-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-600 text-lg">✓</span>
                        <div className="flex-1">
                          <p className="text-green-700 font-semibold">
                            Leída
                          </p>
                          {n.fecha_lectura && (
                            <p className="text-green-600">
                              {new Date(n.fecha_lectura).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {!n.leida && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMarcarLeida(n.id); }}
                        className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-all duration-300 font-medium"
                      >
                        Marcar como leída
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal para nueva notificación */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Enviar Notificación Manual</h2>
              
              {formError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {formError}
                </div>
              )}

              <form onSubmit={handleEnviarNotificacion}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Perfil destinatario *</label>
                  <select
                    name="perfil"
                    value={formData.perfil}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                    disabled={formLoading}
                  >
                    <option value="">Selecciona un perfil</option>
                    {perfiles.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Título (opcional)</label>
                  <input
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Título de la notificación (se genera automáticamente si está vacío)"
                    disabled={formLoading}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Mensaje *</label>
                  <textarea
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Escribe el mensaje de la notificación (mínimo 10 caracteres)..."
                    rows="3"
                    required
                    disabled={formLoading}
                    minLength={10}
                  />
                </div>

                <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Tipo</label>
                    <select name="tipo" value={formData.tipo} onChange={handleFormChange} className="w-full px-2 py-2 rounded border" disabled={formLoading}>
                      {tipos.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Prioridad</label>
                    <select name="prioridad" value={formData.prioridad} onChange={handleFormChange} className="w-full px-2 py-2 rounded border" disabled={formLoading}>
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Nivel de peligro</label>
                    <select name="nivel_peligro" value={formData.nivel_peligro} onChange={handleFormChange} className="w-full px-2 py-2 rounded border" disabled={formLoading}>
                      {niveles.map((n) => (
                        <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Canal</label>
                    <select name="canal" value={formData.canal} onChange={handleFormChange} className="w-full px-2 py-2 rounded border" disabled={formLoading}>
                      {canales.map((c) => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Zona (opcional)</label>
                  <select
                    name="zona"
                    value={formData.zona}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    disabled={formLoading}
                  >
                    <option value="">Sin zona</option>
                    {zonas.map((z) => (
                      <option key={z.id} value={z.nombre}>{z.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                  <p className="text-sm text-blue-700">
                    <strong>Consejo:</strong> Las notificaciones manuales son útiles para enviar 
                    alertas específicas a los guardias. Asegúrate de seleccionar el perfil correcto 
                    y el nivel de peligro adecuado.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formLoading ? 'Enviando...' : 'Enviar Notificación'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setFormError("");
                      setFormData({
                        perfil: "",
                        titulo: "",
                        mensaje: "",
                        tipo: "Violence",
                        prioridad: "media",
                        nivel_peligro: "rojo",
                        canal: "dashboard",
                        zona: ""
                      });
                    }}
                    disabled={formLoading}
                    className="flex-1 bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-500 transition-all duration-300"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal para detalle de notificación */}
        {detalle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto text-gray-900">
              <h2 className="text-2xl font-bold mb-6">Detalle de Notificación</h2>
              <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800" onClick={() => setDetalle(null)}>&times;</button>
              <div className="mb-2"><span className="font-semibold">Tipo:</span> {detalle.tipo}</div>
              <div className="mb-2"><span className="font-semibold">Nivel de peligro:</span> {detalle.nivel_peligro}</div>
              <div className="mb-2"><span className="font-semibold">Canal:</span> {detalle.canal}</div>
              <div className="mb-2"><span className="font-semibold">Zona:</span> {detalle.zona || "Sin zona"}</div>
              <div className="mb-2"><span className="font-semibold">Fecha y hora:</span> {new Date(detalle.fecha_hora).toLocaleString()}</div>
              <div className="mb-2"><span className="font-semibold">Mensaje:</span> {detalle.mensaje}</div>
              <div className="mb-2"><span className="font-semibold">Leída:</span> {detalle.leida ? "Sí" : "No"}</div>
              <div className="mb-2"><span className="font-semibold">Recibida:</span> {detalle.recibida ? "Sí" : "No"}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Toast Container para notificaciones en tiempo real */}
      <ToastContainer 
        position="top-right"
        theme="light"
        newestOnTop
        limit={3}
      />
    </div>
  );
};

export default Notificaciones;
