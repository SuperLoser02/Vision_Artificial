import React, { useEffect, useState } from "react";
import api, { obtenerPerfiles } from "../../services/Api";
import { useNavigate } from "react-router-dom";

const nivelesColores = [
  'from-red-500 to-red-600',
  'from-yellow-500 to-yellow-600',
  'from-green-500 to-green-600',
];
const niveles = ['rojo', 'amarillo', 'verde'];
const tipos = [
  "violencia",
  "aglomeracion",
  "intrusion",
  "incendio",
  "sistema",
  "otro",
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
    canal: "",
    zona: "",
    leida: "",
  });
  const [detalle, setDetalle] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    perfil_id: "",
    mensaje: "",
    tipo: "violencia",
    nivel_peligro: "rojo",
    canal: "dashboard",
    zona: ""
  });
  const [perfiles, setPerfiles] = useState([]);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const navigate = useNavigate();

  // Obtener perfil actual del localStorage
  const perfilActual = JSON.parse(localStorage.getItem("perfilActual"));
  const perfilId = perfilActual?.id;

  useEffect(() => {
    cargarNotificaciones();
    cargarPerfiles();
    // eslint-disable-next-line
  }, [filtros]);

  const cargarNotificaciones = async () => {
    setLoading(true);
    setError("");
    try {
      let params = {};
      if (perfilId) params.perfil_id = perfilId;
      Object.entries(filtros).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const res = await api.get("notificaciones/", { params });
      setNotificaciones(res.data);
    } catch (err) {
      setError("No se pudieron cargar las notificaciones");
    }
    setLoading(false);
  };

  const cargarPerfiles = async () => {
    try {
      const data = await obtenerPerfiles();
      setPerfiles(data);
    } catch (err) {
      setPerfiles([]);
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
    if (!formData.perfil_id || !formData.mensaje.trim()) {
      setFormError("Debes seleccionar un perfil y escribir un mensaje.");
      return;
    }
    setFormLoading(true);
    try {
      await api.post("notificaciones/", formData);
      setShowForm(false);
      setFormData({
        perfil_id: "",
        mensaje: "",
        tipo: "violencia",
        nivel_peligro: "rojo",
        canal: "dashboard",
        zona: ""
      });
      cargarNotificaciones();
    } catch (err) {
      setFormError("No se pudo enviar la notificación");
    }
    setFormLoading(false);
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-r from-blue-500 to-purple-600 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Notificaciones</h1>
            <p className="text-white text-opacity-80 mt-2">
              Historial y gestión de alertas y mensajes de seguridad
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-100 transition-all duration-300"
            >
              {showForm ? "Cancelar" : "+ Nueva Notificación"}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-500 bg-opacity-50 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-opacity-70 transition-all duration-300"
            >
              Volver
            </button>
          </div>
        </div>

        {/* Formulario de nueva notificación */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Enviar Notificación Manual</h2>
            {formError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{formError}</div>
            )}
            <form onSubmit={handleEnviarNotificacion}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Perfil destinatario *</label>
                <select
                  name="perfil_id"
                  value={formData.perfil_id}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                  disabled={formLoading}
                >
                  <option value="">Selecciona un perfil</option>
                  {perfiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Mensaje *</label>
                <textarea
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Escribe el mensaje de la notificación..."
                  rows="3"
                  required
                  disabled={formLoading}
                />
              </div>
              <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Tipo</label>
                  <select name="tipo" value={formData.tipo} onChange={handleFormChange} className="w-full px-2 py-2 rounded" disabled={formLoading}>
                    {tipos.map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Nivel de peligro</label>
                  <select name="nivel_peligro" value={formData.nivel_peligro} onChange={handleFormChange} className="w-full px-2 py-2 rounded" disabled={formLoading}>
                    {niveles.map((n) => (
                      <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Canal</label>
                  <select name="canal" value={formData.canal} onChange={handleFormChange} className="w-full px-2 py-2 rounded" disabled={formLoading}>
                    {canales.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Zona</label>
                  <input
                    type="text"
                    name="zona"
                    value={formData.zona}
                    onChange={handleFormChange}
                    className="w-full px-2 py-2 rounded"
                    placeholder="Zona de interés"
                    disabled={formLoading}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? 'Enviando...' : 'Enviar Notificación'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={formLoading}
                  className="flex-1 bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-500 transition-all duration-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filtros */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-2">
          <select name="tipo" value={filtros.tipo} onChange={handleFiltroChange} className="p-2 rounded">
            <option value="">Tipo</option>
            {tipos.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <select name="nivel_peligro" value={filtros.nivel_peligro} onChange={handleFiltroChange} className="p-2 rounded">
            <option value="">Nivel</option>
            {niveles.map((n) => (
              <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
            ))}
          </select>
          <select name="canal" value={filtros.canal} onChange={handleFiltroChange} className="p-2 rounded">
            <option value="">Canal</option>
            {canales.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <input name="zona" value={filtros.zona} onChange={handleFiltroChange} placeholder="Zona" className="p-2 rounded" />
          <select name="leida" value={filtros.leida} onChange={handleFiltroChange} className="p-2 rounded">
            <option value="">Leída</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>

        {/* Error global */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Lista de notificaciones */}
        {loading && notificaciones.length === 0 ? (
          <div className="text-white text-center text-2xl py-20">
            Cargando notificaciones...
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-12 text-center text-white">
            <div className="text-6xl mb-4">🔔</div>
            <h2 className="text-2xl font-bold mb-4">No hay notificaciones registradas</h2>
            <p className="mb-6">Aún no se han generado alertas o mensajes de seguridad</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notificaciones.map((n, index) => (
              <div
                key={n.id}
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
                  <h3 className="text-2xl font-bold text-gray-900">{n.tipo.charAt(0).toUpperCase() + n.tipo.slice(1)}</h3>
                </div>
                <div className="p-6">
                  <p className="mb-4 min-h-[60px] text-gray-900">{n.mensaje}</p>
                  <div className="text-xs text-gray-700 mb-2">
                    Zona: {n.zona || "Sin zona"}
                  </div>
                  <div className="text-xs text-gray-700 mb-4">
                    {new Date(n.fecha_hora).toLocaleString()}
                  </div>
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
    </div>
  );
};

export default Notificaciones;
