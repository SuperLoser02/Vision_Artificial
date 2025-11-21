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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../services/Api';

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

            const response = await api.get('ia_detection/metricas_eventos/', {
                params: {
                    fecha_inicio: rangoFechas.inicio,
                    fecha_fin: rangoFechas.fin
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

    const generarReportePDF = async () => {
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let yOffset = 15;

            // Encabezado del reporte
            pdf.setFontSize(22);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Reporte de Métricas de Eventos', pageWidth / 2, yOffset, { align: 'center' });
            
            yOffset += 8;
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Sistema de Vigilancia - Detección de Agresión', pageWidth / 2, yOffset, { align: 'center' });
            
            // Fecha de generación del reporte
            yOffset += 10;
            pdf.setFontSize(10);
            pdf.setTextColor(100);
            const fechaReporte = new Date().toLocaleString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            pdf.text(`Fecha de generación: ${fechaReporte}`, pageWidth / 2, yOffset, { align: 'center' });
            
            // Período analizado
            yOffset += 5;
            pdf.setTextColor(0);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Período analizado: ${rangoFechas.inicio} a ${rangoFechas.fin}`, pageWidth / 2, yOffset, { align: 'center' });
            
            // Línea separadora
            yOffset += 5;
            pdf.setDrawColor(200);
            pdf.line(14, yOffset, pageWidth - 14, yOffset);
            
            // Estadísticas principales
            yOffset += 10;
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0);
            pdf.text('Estadísticas Generales', 14, yOffset);
            
            yOffset += 8;
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'normal');
            
            // Caja de estadísticas
            const statsBoxHeight = 30;
            pdf.setFillColor(249, 250, 251);
            pdf.rect(14, yOffset, pageWidth - 28, statsBoxHeight, 'F');
            pdf.setDrawColor(229, 231, 235);
            pdf.rect(14, yOffset, pageWidth - 28, statsBoxHeight);
            
            yOffset += 8;
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(220, 38, 38);
            pdf.text(`Total de Eventos: ${estadisticas.total}`, 20, yOffset);
            
            yOffset += 8;
            pdf.setTextColor(234, 88, 12);
            pdf.text(`Promedio Diario: ${estadisticas.promedio} eventos`, 20, yOffset);
            
            yOffset += 8;
            pdf.setTextColor(147, 51, 234);
            pdf.text(`Máximo en un Día: ${estadisticas.maximo} eventos`, 20, yOffset);
            
            // Capturar el gráfico
            yOffset += 20;
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0);
            pdf.text('Gráfico de Eventos por Fecha', 14, yOffset);
            
            yOffset += 5;
            
            const chartElement = document.querySelector('canvas');
            if (chartElement) {
                const canvas = await html2canvas(chartElement, {
                    backgroundColor: '#ffffff',
                    scale: 2
                });
                const imgData = canvas.toDataURL('image/png');
                
                const imgWidth = pageWidth - 28;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                // Verificar si necesitamos una nueva página
                if (yOffset + imgHeight > pageHeight - 20) {
                    pdf.addPage();
                    yOffset = 20;
                }
                
                pdf.addImage(imgData, 'PNG', 14, yOffset, imgWidth, imgHeight);
                yOffset += imgHeight + 10;
            }
            
            // Pie de página
            const totalPages = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                pdf.setPage(i);
                pdf.setFontSize(9);
                pdf.setTextColor(150);
                pdf.text(
                    `Página ${i} de ${totalPages}`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
            }
            
            // Guardar el PDF
            const nombreArchivo = `reporte-metricas-${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(nombreArchivo);
            
        } catch (error) {
            console.error('Error al generar el reporte PDF:', error);
            alert('Hubo un error al generar el reporte PDF. Por favor, intenta nuevamente.');
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <div className="flex items-end">
                        <button
                            onClick={generarReportePDF}
                            disabled={loading || chartData.labels.length === 0}
                            className="w-full px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Generar PDF
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
