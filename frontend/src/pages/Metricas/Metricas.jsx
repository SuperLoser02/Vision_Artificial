import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import axios from 'axios';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const Metricas = () => {
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rangoFechas, setRangoFechas] = useState({
        inicio: '',
        fin: ''
    });
    const [estadisticas, setEstadisticas] = useState({
        total: 0,
        promedio: 0,
        maximo: 0
    });

    useEffect(() => {
        const hoy = new Date();
        const hace30Dias = new Date();
        hace30Dias.setDate(hoy.getDate() - 30);

        setRangoFechas({
            inicio: hace30Dias.toISOString().split('T')[0],
            fin: hoy.toISOString().split('T')[0]
        });
    }, []);

    useEffect(() => {
        if (rangoFechas.inicio && rangoFechas.fin) {
            cargarDatosMetricas();
        }
    }, [rangoFechas]);

    const cargarDatosMetricas = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get('/api/ia_detection/ia_detection/metricas_eventos/', {
                params: {
                    fecha_inicio: rangoFechas.inicio,
                    fecha_fin: rangoFechas.fin
                },
                headers: {
                    'Authorization': `Token ${localStorage.getItem('token')}`
                }
            });

            const datos = response.data;

            setChartData({
                labels: datos.labels,
                datasets: [
                    {
                        label: 'Eventos de Agresión',
                        data: datos.data,
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: 'rgb(239, 68, 68)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }
                ]
            });

            // Calcular estadísticas
            const total = datos.data.reduce((acc, val) => acc + val, 0);
            const promedio = datos.data.length > 0 ? total / datos.data.length : 0;
            const maximo = datos.data.length > 0 ? Math.max(...datos.data) : 0;

            setEstadisticas({
                total,
                promedio: promedio.toFixed(2),
                maximo
            });

            setLoading(false);
        } catch (err) {
            console.error('Error al cargar métricas:', err);
            setError('No se pudieron cargar las métricas. Verifica tu conexión o que el backend esté ejecutándose.');
            setLoading(false);
        }
    };

    const generarDiasEnRango = (fechaInicio, fechaFin) => {
        const dias = [];
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);

        for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
            dias.push(new Date(d).toISOString().split('T')[0]);
        }

        return dias;
    };

    const opciones = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: {
                        size: 14,
                        weight: '500'
                    },
                    padding: 15
                }
            },
            title: {
                display: true,
                text: 'Eventos de Agresión por Fecha',
                font: {
                    size: 18,
                    weight: 'bold'
                },
                padding: 20
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: {
                    size: 14
                },
                bodyFont: {
                    size: 13
                },
                callbacks: {
                    label: function (context) {
                        return `${context.dataset.label}: ${context.parsed.y} evento(s)`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    font: {
                        size: 12
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                title: {
                    display: true,
                    text: 'Cantidad de Eventos',
                    font: {
                        size: 14,
                        weight: '600'
                    }
                }
            },
            x: {
                ticks: {
                    font: {
                        size: 11
                    },
                    maxRotation: 45,
                    minRotation: 45
                },
                grid: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Fecha',
                    font: {
                        size: 14,
                        weight: '600'
                    }
                }
            }
        }
    };

    const handleFechaChange = (e) => {
        const { name, value } = e.target;
        setRangoFechas(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="w-full min-h-full">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Métricas de Eventos</h1>
                <p className="text-gray-600">Análisis temporal de eventos de agresión detectados</p>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <p className="text-gray-500 text-sm font-medium mb-1">Total de Eventos</p>
                    <p className="text-3xl font-bold text-red-600">{estadisticas.total}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <p className="text-gray-500 text-sm font-medium mb-1">Promedio Diario</p>
                    <p className="text-3xl font-bold text-orange-600">{estadisticas.promedio}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <p className="text-gray-500 text-sm font-medium mb-1">Máximo en un Día</p>
                    <p className="text-3xl font-bold text-purple-600">{estadisticas.maximo}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtrar por Rango de Fechas</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha Inicio
                        </label>
                        <input
                            type="date"
                            name="inicio"
                            value={rangoFechas.inicio}
                            onChange={handleFechaChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha Fin
                        </label>
                        <input
                            type="date"
                            name="fin"
                            value={rangoFechas.fin}
                            onChange={handleFechaChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={cargarDatosMetricas}
                            className="w-full px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
                {loading ? (
                    <div className="flex justify-center items-center h-96">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                    </div>
                ) : (
                    <div style={{ height: '500px' }}>
                        <Line data={chartData} options={opciones} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Metricas;
