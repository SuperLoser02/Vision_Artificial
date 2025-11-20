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
        user = self.request.user
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
        user = self.request.user
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