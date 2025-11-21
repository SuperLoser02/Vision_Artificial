# ai_detection/views.py

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, viewsets
from django.http import FileResponse, Http404
from .models import DetectionEvent
from .serializer import DetectionEventSerializer
import os
from .camara_manager import camera_manager
from camaras.models import CamaraDetalles

class ia_detection(viewsets.ModelViewSet):
    @action(detail=False, methods=['Get'])
    def start_detection(self, request, pk=None):
        """Inicia detección en una cámara"""
        try:
            user = self.request.user
            camaras_de_la_empresa = CamaraDetalles.objects.filter(camara__user=user)
        except:
            camaras_de_la_empresa = CamaraDetalles.objects.all()

        for camara in camaras_de_la_empresa:
            print(camara,id, camara.marca, camara.ip)
            camera_manager.start_camera(
                camera_id=camara.id,
                camera_type=camara.marca,
                camera_ip=camara.ip
            )
        return Response({'status': 'started'})
    
    @action(detail=False, methods=['get'])
    def stop_detection(self, request, pk=None):
        """Detiene detección en una cámara"""
        try:
            user = self.request.user
            camaras_de_la_empresa = CamaraDetalles.objects.filter(camara__user=user)
        except:
            camaras_de_la_empresa = CamaraDetalles.objects.all()
        for camara in camaras_de_la_empresa:
            camera_id = camara.id
            camera_manager.stop_camera(camera_id)
        
        return Response({'status': 'stopped'})
    
    @action(detail=False, methods=['get'])
    def active_detections(self, request):
        """Lista cámaras con detección activa"""
        active = camera_manager.get_active_cameras()
        user = self.request.user
        camaras_de_la_empresa = CamaraDetalles.objects.filter(camara__user=user, id__in=active)
        return Response({'active_cameras': camaras_de_la_empresa})
    
    @action(detail=False, methods=['get'])
    def metricas_eventos(self, request):
        """Obtiene métricas de eventos de agresión agrupados por fecha"""
        from django.db.models import Count
        from django.db.models.functions import TruncDate
        from .models import DetectionEvent
        from datetime import datetime, timedelta
        
        fecha_inicio = request.query_params.get('fecha_inicio')
        fecha_fin = request.query_params.get('fecha_fin')
        
        if not fecha_inicio or not fecha_fin:
            return Response({'error': 'Se requieren fecha_inicio y fecha_fin'}, status=400)
        
        # Consultar eventos agrupados por fecha
        eventos = DetectionEvent.objects.filter(
            timeStamp__date__gte=fecha_inicio,
            timeStamp__date__lte=fecha_fin
        ).annotate(
            fecha=TruncDate('timeStamp')
        ).values('fecha').annotate(
            cantidad=Count('id')
        ).order_by('fecha')
        
        # Crear diccionario de fechas con cantidad
        eventos_dict = {str(e['fecha']): e['cantidad'] for e in eventos}
        
        # Generar todas las fechas en el rango (incluidas las que no tienen eventos)
        inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
        fin = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
        
        labels = []
        data = []
        current = inicio
        while current <= fin:
            fecha_str = str(current)
            labels.append(fecha_str)
            data.append(eventos_dict.get(fecha_str, 0))
            current += timedelta(days=1)
        
        return Response({
            'labels': labels,
            'data': data
        })
class DetectionEventViewSet(viewsets.ModelViewSet):
    serializer_class = DetectionEventSerializer
    queryset = DetectionEvent.objects.all()
    """ViewSet para el modelo DetectionEvent."""
    @action(detail=True, methods=['get'])
    def download_video(self, request, pk=None):
        """
        Descarga el archivo de video asociado al DetectionEvent.
        """
        try:
            event = self.get_object()
        except DetectionEvent.DoesNotExist:
            raise Http404("Evento no encontrado")

        if not event.video_file:
            return Response({"error": "Este evento no tiene video asociado"},
                            status=status.HTTP_404_NOT_FOUND)

        file_path = event.video_file

        # Verificar que el archivo existe
        if not os.path.isfile(file_path):
            return Response({"error": "El archivo de video no existe en el servidor"},
                            status=status.HTTP_404_NOT_FOUND)

        # Permiso opcional: solo permitir al dueño descargar su propio evento
        # if event.user and event.user != request.user:
        #     return Response({"error": "No tienes permiso para descargar este video"},
        #                     status=status.HTTP_403_FORBIDDEN)

        # Respuesta de descarga
        response = FileResponse(open(file_path, 'rb'), as_attachment=True)
        response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
        return response
    @action(detail=False, methods=['get'])
    def all_events_by_user(self, request):
        """
        Obtiene todos los eventos de detección asociados al usuario autenticado.
        """
        user = request.user
        events = DetectionEvent.objects.filter(user=user).order_by('-timeStamp')
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
