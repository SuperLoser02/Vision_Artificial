"""
Signals para el módulo de notificaciones.
Envía notificaciones automáticamente cuando se crean.
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
    """
    if not created:
        return  # Solo para notificaciones nuevas
    
    try:
        # 1. Enviar por WebSocket
        _enviar_por_websocket(instance)
        
        # 2. Enviar por FCM si el canal es 'push'
        if instance.canal == 'push':
            _enviar_por_fcm(instance)
    
    except Exception as e:
        logger.error(f"❌ Error en signal de notificación {instance.id}: {str(e)}")


def _enviar_por_websocket(notificacion):
    """Enviar notificación por WebSocket"""
    try:
        from perfil.models import Perfil
        from camaras.models import CamaraDetalles
        
        channel_layer = get_channel_layer()
        serializer = NotificacionSerializer(notificacion)
        grupos_enviados = []
        
        # 1. Enviar a perfil específico
        if notificacion.perfil:
            room_group_name = f'notificaciones_{notificacion.perfil.id}'
            async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    'type': 'nueva_notificacion',
                    'notificacion': serializer.data
                }
            )
            grupos_enviados.append(room_group_name)
            logger.info(f"📡 Notificación {notificacion.id} enviada a {room_group_name}")
        
        # 2. Obtener zona_id desde la cámara
        zona_evento_id = None
        if notificacion.camara_id:
            try:
                camara_detalle = CamaraDetalles.objects.get(id=notificacion.camara_id)
                if camara_detalle.zona:
                    zona_evento_id = camara_detalle.zona.id
            except CamaraDetalles.DoesNotExist:
                pass
        
        # 3. Enviar a supervisión global (jefes)
        async_to_sync(channel_layer.group_send)(
            'supervision_global',
            {
                'type': 'nueva_notificacion',
                'notificacion': serializer.data
            }
        )
        grupos_enviados.append('supervision_global')
        
        # 4. Enviar a grupo de zona si existe
        if zona_evento_id:
            zone_group_name = f'zona_{zona_evento_id}'
            async_to_sync(channel_layer.group_send)(
                zone_group_name,
                {
                    'type': 'nueva_notificacion',
                    'notificacion': serializer.data
                }
            )
            grupos_enviados.append(zone_group_name)
        
        logger.info(
            f"📡 [Signal] Notificación {notificacion.id} enviada a {len(grupos_enviados)} grupos: {', '.join(grupos_enviados)}"
        )
    
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
