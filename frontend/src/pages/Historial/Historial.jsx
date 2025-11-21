import { useState, useEffect } from 'react';
import api from '../../services/Api';

const Historial = () => {
    const [eventos, setEventos] = useState([]);
    const [eventosFiltrados, setEventosFiltrados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filtros
    const [filtros, setFiltros] = useState({
        tipoAlerta: '',
        zona: '',
        fechaInicio: '',
        fechaFin: ''
    });

    // Paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const eventosPorPagina = 10;

    useEffect(() => {
        cargarEventos();
    }, []);

    useEffect(() => {
        aplicarFiltros();
    }, [filtros, eventos]);

    const cargarEventos = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('ia_detection/detection-events/all_events_by_user/');
            console.log('Eventos cargados:', response.data);
            
            // Asegurarse de que sea un array
            const eventosData = Array.isArray(response.data) ? response.data : [];
            setEventos(eventosData);
            setEventosFiltrados(eventosData);
        } catch (err) {
            console.error('Error al cargar eventos:', err);
            setError('No se pudieron cargar los eventos. Verifica tu conexión o que el backend esté ejecutándose.');
            setEventos([]);
            setEventosFiltrados([]);
        } finally {
            setLoading(false);
        }
    };

    const aplicarFiltros = () => {
        let resultados = [...eventos];

        // Filtro por tipo de alerta
        if (filtros.tipoAlerta) {
            resultados = resultados.filter(evento => 
                evento.tipo_alerta === filtros.tipoAlerta
            );
        }

        // Filtro por zona
        if (filtros.zona) {
            resultados = resultados.filter(evento => 
                evento.zona === filtros.zona
            );
        }

        // Filtro por rango de fechas
        if (filtros.fechaInicio) {
            resultados = resultados.filter(evento => 
                new Date(evento.timeStamp) >= new Date(filtros.fechaInicio)
            );
        }

        if (filtros.fechaFin) {
            const fechaFinAjustada = new Date(filtros.fechaFin);
            fechaFinAjustada.setHours(23, 59, 59, 999);
            resultados = resultados.filter(evento => 
                new Date(evento.timeStamp) <= fechaFinAjustada
            );
        }

        setEventosFiltrados(resultados);
        setPaginaActual(1);
    };

    const handleFiltroChange = (e) => {
        const { name, value } = e.target;
        setFiltros(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const limpiarFiltros = () => {
        setFiltros({
            tipoAlerta: '',
            zona: '',
            fechaInicio: '',
            fechaFin: ''
        });
    };

    const formatearFecha = (fecha) => {
        const date = new Date(fecha);
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const descargarVideo = async (eventoId, nombreArchivo) => {
        try {
            const response = await api.get(
                `ia_detection/detection-events/${eventoId}/download_video/`,
                { responseType: 'blob' }
            );
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', nombreArchivo || `evento_${eventoId}.avi`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error al descargar video:', err);
            alert('No se pudo descargar el video. Puede que no exista o no esté disponible.');
        }
    };

    // Calcular eventos de la página actual
    const indiceUltimo = paginaActual * eventosPorPagina;
    const indicePrimero = indiceUltimo - eventosPorPagina;
    const eventosActuales = eventosFiltrados.slice(indicePrimero, indiceUltimo);
    const totalPaginas = Math.ceil(eventosFiltrados.length / eventosPorPagina);

    const cambiarPagina = (numeroPagina) => {
        setPaginaActual(numeroPagina);
    };

    const obtenerTiposAlertas = () => {
        const tipos = [...new Set(eventos.map(e => e.tipo_alerta))];
        return tipos.filter(Boolean);
    };

    const obtenerZonas = () => {
        const zonas = [...new Set(eventos.map(e => e.zona))];
        return zonas.filter(Boolean);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-full">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Historial de Eventos</h1>
                <p className="text-gray-600">Registro completo de eventos de detección de agresión</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-yellow-800">{error}</p>
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtros de Búsqueda</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Alerta
                        </label>
                        <select
                            name="tipoAlerta"
                            value={filtros.tipoAlerta}
                            onChange={handleFiltroChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                            <option value="">Todos los tipos</option>
                            {obtenerTiposAlertas().map(tipo => (
                                <option key={tipo} value={tipo}>{tipo}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Zona
                        </label>
                        <select
                            name="zona"
                            value={filtros.zona}
                            onChange={handleFiltroChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                            <option value="">Todas las zonas</option>
                            {obtenerZonas().map(zona => (
                                <option key={zona} value={zona}>{zona}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha Inicio
                        </label>
                        <input
                            type="date"
                            name="fechaInicio"
                            value={filtros.fechaInicio}
                            onChange={handleFiltroChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha Fin
                        </label>
                        <input
                            type="date"
                            name="fechaFin"
                            value={filtros.fechaFin}
                            onChange={handleFiltroChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={limpiarFiltros}
                            className="w-full px-6 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Eventos Registrados ({eventosFiltrados.length})
                    </h2>
                    <button
                        onClick={cargarEventos}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Actualizar
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID Cámara
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha y Hora
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo de Alerta
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Zona
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Video
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {eventosActuales.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        {eventos.length === 0 
                                            ? 'Aún no se han detectado eventos de agresión'
                                            : 'No se encontraron eventos con los filtros aplicados'
                                        }
                                    </td>
                                </tr>
                            ) : (
                                eventosActuales.map((evento) => (
                                    <tr key={evento.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            #{evento.camara_id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {formatearFecha(evento.timeStamp)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                {evento.tipo_alerta}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {evento.zona || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {evento.video_file ? (
                                                <button
                                                    onClick={() => descargarVideo(evento.id, evento.video_file)}
                                                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    Descargar
                                                </button>
                                            ) : (
                                                <span className="text-gray-400">No disponible</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPaginas > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Mostrando <span className="font-medium">{indicePrimero + 1}</span> a{' '}
                            <span className="font-medium">
                                {Math.min(indiceUltimo, eventosFiltrados.length)}
                            </span>{' '}
                            de <span className="font-medium">{eventosFiltrados.length}</span> resultados
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => cambiarPagina(paginaActual - 1)}
                                disabled={paginaActual === 1}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Anterior
                            </button>
                            
                            {[...Array(totalPaginas)].map((_, index) => {
                                const numeroPagina = index + 1;
                                if (
                                    numeroPagina === 1 ||
                                    numeroPagina === totalPaginas ||
                                    (numeroPagina >= paginaActual - 1 && numeroPagina <= paginaActual + 1)
                                ) {
                                    return (
                                        <button
                                            key={numeroPagina}
                                            onClick={() => cambiarPagina(numeroPagina)}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                                paginaActual === numeroPagina
                                                    ? 'bg-red-600 text-white'
                                                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {numeroPagina}
                                        </button>
                                    );
                                } else if (
                                    numeroPagina === paginaActual - 2 ||
                                    numeroPagina === paginaActual + 2
                                ) {
                                    return <span key={numeroPagina} className="px-2 text-gray-500">...</span>;
                                }
                                return null;
                            })}
                            
                            <button
                                onClick={() => cambiarPagina(paginaActual + 1)}
                                disabled={paginaActual === totalPaginas}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Historial;