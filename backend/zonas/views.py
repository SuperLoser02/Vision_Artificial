from rest_framework import viewsets
from .models import Zona
from .serializers import ZonaSerializer


class ZonaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de Zonas.
    Proporciona operaciones CRUD completas sin restricciones de permisos.
    """
    queryset = Zona.objects.all()
    serializer_class = ZonaSerializer
    
    # Sin permisos - proyecto académico
    permission_classes = []
    authentication_classes = []
