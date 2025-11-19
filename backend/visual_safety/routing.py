"""
WebSocket URL routing for visual_safety project.
"""

from django.urls import path
#from notificaciones.consumers import NotificacionConsumer

websocket_urlpatterns = [
    # path('ws/notificaciones/', NotificacionConsumer.as_asgi()),
    # Puedes agregar más rutas WebSocket aquí según necesites
    # path('ws/camaras/<int:camara_id>/', CamaraConsumer.as_asgi()),
]