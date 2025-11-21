"""
Signals para el módulo de notificaciones.
Envía notificaciones automáticamente cuando se crean (usado por IA).
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

from .models import Notificacion
from .serializer import NotificacionSerializer

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Notificacion)
def enviar_notificacion_automaticamente(sender, instance, created, **kwargs):
    """
    Signal que se ejecuta después de guardar una Notificacion.
    Envía automáticamente por WebSocket y FCM si es nueva.
    NOTA: Solo envía al perfil destinatario individual para evitar duplicados.
    """
    if not created:
        return  # Solo para notificaciones nuevas
    
    try:
        # 1. Enviar por WebSocket (solo al perfil individual)
        _enviar_por_websocket(instance)
        
        # 2. Enviar por FCM si el canal es 'push'
        if instance.canal == 'push':
            _enviar_por_fcm(instance)
    
    except Exception as e:
        logger.error(f"❌ Error en signal de notificación {instance.id}: {str(e)}")


def _enviar_por_websocket(notificacion):
    """
    Enviar notificación por WebSocket SOLO al perfil destinatario.
    NO envía a grupos adicionales para evitar duplicados.
    """
    try:
        channel_layer = get_channel_layer()
        serializer = NotificacionSerializer(notificacion)
        
        # Enviar ÚNICAMENTE al perfil destinatario específico
        if notificacion.perfil:
            room_group_name = f'notificaciones_{notificacion.perfil.id}'
            async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    'type': 'nueva_notificacion',
                    'notificacion': serializer.data
                }
            )
            logger.info(f"📡 [Signal] Notificación {notificacion.id} enviada a {room_group_name}")
        else:
            logger.warning(f"⚠️ [Signal] Notificación {notificacion.id} sin perfil destinatario")
    
    except Exception as e:
        logger.error(f"❌ Error enviando por WebSocket: {str(e)}")


def _enviar_por_fcm(notificacion):
    """Enviar notificación por Firebase Cloud Messaging"""
    try:
        from .utils import enviar_notificacion_fcm
        resultado = enviar_notificacion_fcm(notificacion)
        logger.info(
            f"📱 [Signal] FCM para notificación {notificacion.id}: "
            f"{resultado.get('success', 0)} éxitos, {resultado.get('failure', 0)} fallos"
        )
    except Exception as e:
        logger.error(f"❌ Error enviando por FCM: {str(e)}")
