# ai_detection/views.py

from rest_framework.decorators import action
from rest_framework.response import Response
from .camara_manager import camera_manager
from rest_framework import viewsets
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
