"""
WebSocket URL routing for visual_safety project.
"""

from django.urls import re_path
from notificaciones.consumers import NotificacionConsumer

websocket_urlpatterns = [
    re_path(r'ws/notificaciones/(?P<perfil_id>\d+)/$', NotificacionConsumer.as_asgi()),
    # Puedes agregar más rutas WebSocket aquí según necesites
    # re_path(r'ws/camaras/(?P<camara_id>\d+)/$', CamaraConsumer.as_asgi()),
]