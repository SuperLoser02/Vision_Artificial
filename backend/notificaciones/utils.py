"""
Utilidades para enviar notificaciones push mediante Firebase Cloud Messaging (FCM)
"""
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def enviar_notificacion_fcm(notificacion):
    """
    Enviar notificación push a dispositivos registrados del perfil.
    
    Args:
        notificacion: Instancia del modelo Notificacion
    
    Returns:
        dict: Resultado del envío con contadores de éxito/fallo
    """
    from .models import DispositivoFCM
    
    # Obtener dispositivos activos del perfil
    dispositivos = DispositivoFCM.objects.filter(
        perfil=notificacion.perfil,
        activo=True
    )
    
    if not dispositivos.exists():
        logger.warning(f"No hay dispositivos FCM activos para perfil {notificacion.perfil.id}")
        return {'success': 0, 'failure': 0, 'message': 'No hay dispositivos registrados'}
    
    # Obtener tokens
    tokens = [d.token_fcm for d in dispositivos]
    
    # Construir payload de notificación
    notification_data = {
        'title': notificacion.titulo,
        'body': notificacion.mensaje,
    }
    
    data_payload = {
        'notificacion_id': str(notificacion.id),
        'tipo': notificacion.tipo,
        'prioridad': notificacion.prioridad,
        'nivel_peligro': notificacion.nivel_peligro,
        'zona': notificacion.zona or '',
        'camara_id': str(notificacion.camara_id) if notificacion.camara_id else '',
        'timestamp': notificacion.fecha_hora.isoformat(),
    }
    
    # Agregar metadata si existe
    if notificacion.metadata:
        for key, value in notificacion.metadata.items():
            data_payload[f'meta_{key}'] = str(value)
    
    try:
        # Intentar con firebase-admin
        resultado = _enviar_con_firebase_admin(tokens, notification_data, data_payload, notificacion)
        return resultado
    except Exception as e:
        logger.error(f"Error enviando notificación FCM: {str(e)}")
        return {'success': 0, 'failure': len(tokens), 'error': str(e)}


def _enviar_con_firebase_admin(tokens, notification_data, data_payload, notificacion):
    """
    Enviar notificación usando firebase-admin SDK con FCM v1 API.
    """
    try:
        import firebase_admin
        from firebase_admin import credentials, messaging
        
        # Inicializar Firebase Admin SDK si no está inicializado
        if not firebase_admin._apps:
            # Buscar archivo de credenciales
            import os
            cred_path = os.path.join(settings.BASE_DIR, 'firebase-credentials.json')
            
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                # Especificar el project_id explícitamente para asegurar el uso de FCM v1
                firebase_admin.initialize_app(cred, {
                    'projectId': cred.project_id,
                })
                logger.info(f"Firebase inicializado para proyecto: {cred.project_id}")
            else:
                logger.warning("Archivo de credenciales Firebase no encontrado")
                return {'success': 0, 'failure': len(tokens), 'error': 'Credenciales no configuradas'}
        
        success_count = 0
        failure_count = 0
        failed_tokens = []
        
        # Enviar a cada token individualmente (más confiable que multicast)
        for token in tokens:
            try:
                # Crear mensaje individual con FCM v1
                message = messaging.Message(
                    notification=messaging.Notification(
                        title=notification_data['title'],
                        body=notification_data['body'],
                    ),
                    data=data_payload,
                    token=token,
                    android=messaging.AndroidConfig(
                        priority='high',
                        notification=messaging.AndroidNotification(
                            sound='default',
                            color=_get_color_for_priority(notificacion.nivel_peligro),
                            channel_id='security_alerts',
                        ),
                    ),
                    apns=messaging.APNSConfig(
                        payload=messaging.APNSPayload(
                            aps=messaging.Aps(
                                sound='default',
                                badge=1,
                            ),
                        ),
                    ),
                )
                
                # Enviar usando send() que usa FCM v1 API
                response = messaging.send(message)
                success_count += 1
                logger.info(f"✅ Notificación enviada exitosamente. Response: {response}")
                
            except messaging.UnregisteredError:
                logger.warning(f"Token no registrado: {token[:20]}...")
                failure_count += 1
                failed_tokens.append(token)
            except messaging.InvalidArgumentError as e:
                logger.warning(f"Token inválido: {token[:20]}... - {str(e)}")
                failure_count += 1
                failed_tokens.append(token)
            except Exception as e:
                logger.error(f"Error enviando a token {token[:20]}...: {str(e)}")
                failure_count += 1
                failed_tokens.append(token)
        
        # Desactivar tokens inválidos
        if failed_tokens:
            _desactivar_tokens_por_lista(failed_tokens)
        
        logger.info(f"FCM enviado: {success_count} éxitos, {failure_count} fallos")
        
        return {
            'success': success_count,
            'failure': failure_count,
            'message': f'{success_count} notificaciones enviadas correctamente'
        }
    
    except ImportError:
        logger.error("firebase-admin no está instalado")
        return {'success': 0, 'failure': len(tokens), 'error': 'Firebase Admin SDK no instalado'}
    except Exception as e:
        logger.error(f"Error en _enviar_con_firebase_admin: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return {'success': 0, 'failure': len(tokens), 'error': str(e)}


def _get_color_for_priority(nivel_peligro):
    """Retornar color HEX según el nivel de peligro"""
    colores = {
        'rojo': '#FF0000',
        'amarillo': '#FFA500',
        'verde': '#00FF00',
    }
    return colores.get(nivel_peligro, '#808080')


def _desactivar_tokens_invalidos(tokens, responses):
    """Desactivar tokens que fallaron"""
    from .models import DispositivoFCM
    
    for idx, response in enumerate(responses):
        if not response.success:
            error_code = response.exception.code if response.exception else None
            
            # Desactivar solo si es error de token inválido
            if error_code in ['invalid-registration-token', 'registration-token-not-registered']:
                token = tokens[idx]
                try:
                    dispositivo = DispositivoFCM.objects.get(token_fcm=token)
                    dispositivo.activo = False
                    dispositivo.save()
                    logger.info(f"Token FCM desactivado: {token[:20]}...")
                except DispositivoFCM.DoesNotExist:
                    pass


def _desactivar_tokens_por_lista(tokens):
    """Desactivar tokens de una lista"""
    from .models import DispositivoFCM
    
    for token in tokens:
        try:
            dispositivo = DispositivoFCM.objects.get(token_fcm=token)
            dispositivo.activo = False
            dispositivo.save()
            logger.info(f"Token FCM desactivado: {token[:20]}...")
        except DispositivoFCM.DoesNotExist:
            pass


def enviar_notificacion_masiva(perfiles_ids, titulo, mensaje, tipo='sistema', prioridad='media'):
    """
    Enviar notificación a múltiples perfiles de forma masiva.
    
    Args:
        perfiles_ids: Lista de IDs de perfiles
        titulo: Título de la notificación
        mensaje: Mensaje de la notificación
        tipo: Tipo de notificación
        prioridad: Prioridad de la notificación
    
    Returns:
        dict: Estadísticas del envío
    """
    from .models import Notificacion, DispositivoFCM
    from perfil.models import Perfil
    
    # Obtener todos los tokens de los perfiles
    dispositivos = DispositivoFCM.objects.filter(
        perfil_id__in=perfiles_ids,
        activo=True
    )
    
    tokens = [d.token_fcm for d in dispositivos]
    
    if not tokens:
        return {'success': 0, 'failure': 0, 'message': 'No hay dispositivos registrados'}
    
    # Construir payload
    notification_data = {
        'title': titulo,
        'body': mensaje,
    }
    
    data_payload = {
        'tipo': tipo,
        'prioridad': prioridad,
    }
    
    # Crear notificación temporal para usar la función de envío
    class TempNotificacion:
        def __init__(self):
            self.id = 0
            self.titulo = titulo
            self.mensaje = mensaje
            self.tipo = tipo
            self.prioridad = prioridad
            self.nivel_peligro = 'verde'
            self.zona = None
            self.camara_id = None
            self.metadata = None
            from django.utils import timezone
            self.fecha_hora = timezone.now()
    
    temp_notif = TempNotificacion()
    resultado = _enviar_con_firebase_admin(tokens, notification_data, data_payload, temp_notif)
    
    return resultado
