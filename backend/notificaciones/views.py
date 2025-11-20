from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notificacion, DispositivoFCM
from .serializer import NotificacionSerializer, DispositivoFCMSerializer
from perfil.models import Perfil
import logging

logger = logging.getLogger(__name__)


class NotificacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar notificaciones.
    SIN PERMISOS (proyecto académico).
    
    list: Obtener lista de notificaciones (con filtros)
    create: Crear nueva notificación (envía por WebSocket y FCM)
    retrieve: Obtener detalle de una notificación
    update/partial_update: Actualizar notificación (marcar como leída)
    destroy: Eliminar notificación
    
    Acciones personalizadas:
    - marcar_leida: Marcar una notificación como leída
    - marcar_todas_leidas: Marcar todas como leídas para un perfil
    - no_leidas: Obtener contador de notificaciones no leídas
    - enviar_a_grupo: Enviar notificación a múltiples perfiles
    """
    queryset = Notificacion.objects.all()
    serializer_class = NotificacionSerializer

    def create(self, request, *args, **kwargs):
        """Crear notificación y enviarla por WebSocket y FCM"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        notificacion = serializer.save()
        
        # Envío inteligente por WebSocket (filtra por rol/zona/severidad)
        self._enviar_por_websocket_inteligente(notificacion)
        
        # Enviar por FCM si el canal es 'push'
        if notificacion.canal == 'push':
            self._enviar_por_fcm(notificacion)
        
        # Retornar respuesta
        response_serializer = NotificacionSerializer(notificacion)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def list(self, request, *args, **kwargs):
        """Listar notificaciones con filtros avanzados"""
        queryset = self.get_queryset()
        
        # Filtros
        perfil_id = request.query_params.get('perfil_id')
        prioridad = request.query_params.get('prioridad')
        tipo = request.query_params.get('tipo')
        nivel_peligro = request.query_params.get('nivel_peligro')
        canal = request.query_params.get('canal')
        zona = request.query_params.get('zona')
        leida = request.query_params.get('leida')
        limit = request.query_params.get('limit', 50)
        
        if perfil_id:
            queryset = queryset.filter(perfil_id=perfil_id)
        if prioridad:
            queryset = queryset.filter(prioridad=prioridad)
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        if nivel_peligro:
            queryset = queryset.filter(nivel_peligro=nivel_peligro)
        if canal:
            queryset = queryset.filter(canal=canal)
        if zona:
            queryset = queryset.filter(zona__icontains=zona)
        if leida is not None:
            queryset = queryset.filter(leida=leida.lower() == 'true')
        
        # Limitar resultados
        queryset = queryset[:int(limit)]
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data
        })

    @action(detail=True, methods=['post'])
    def marcar_leida(self, request, pk=None):
        """Marcar una notificación como leída"""
        notificacion = self.get_object()
        notificacion.marcar_como_leida()
        
        serializer = self.get_serializer(notificacion)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def marcar_todas_leidas(self, request):
        """Marcar todas las notificaciones como leídas para un perfil"""
        perfil_id = request.data.get('perfil_id')
        
        if not perfil_id:
            return Response(
                {'error': 'perfil_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.utils import timezone
        count = Notificacion.objects.filter(
            perfil_id=perfil_id,
            leida=False
        ).update(leida=True, fecha_lectura=timezone.now())
        
        return Response({
            'status': 'success',
            'count': count,
            'message': f'{count} notificaciones marcadas como leídas'
        })
    
    @action(detail=False, methods=['get'])
    def no_leidas(self, request):
        """Obtener contador de notificaciones no leídas"""
        perfil_id = request.query_params.get('perfil_id')
        
        if not perfil_id:
            return Response(
                {'error': 'perfil_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        count = Notificacion.objects.filter(
            perfil_id=perfil_id,
            leida=False
        ).count()
        
        return Response({
            'perfil_id': perfil_id,
            'no_leidas': count
        })
    
    @action(detail=False, methods=['post'])
    def enviar_a_grupo(self, request):
        """Enviar notificación a múltiples perfiles"""
        perfiles_ids = request.data.get('perfiles_ids', [])
        titulo = request.data.get('titulo', 'Notificación')
        mensaje = request.data.get('mensaje')
        tipo = request.data.get('tipo', 'sistema')
        prioridad = request.data.get('prioridad', 'media')
        nivel_peligro = request.data.get('nivel_peligro', 'verde')
        canal = request.data.get('canal', 'websocket')
        
        if not mensaje or not perfiles_ids:
            return Response(
                {'error': 'mensaje y perfiles_ids son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        notificaciones_creadas = []
        
        for perfil_id in perfiles_ids:
            try:
                perfil = Perfil.objects.get(id=perfil_id)
                notificacion = Notificacion.objects.create(
                    perfil=perfil,
                    titulo=titulo,
                    mensaje=mensaje,
                    tipo=tipo,
                    prioridad=prioridad,
                    nivel_peligro=nivel_peligro,
                    canal=canal
                )
                
                # Enviar por WebSocket
                self._enviar_por_websocket(notificacion)
                
                # Enviar por FCM si es push
                if canal == 'push':
                    self._enviar_por_fcm(notificacion)
                
                notificaciones_creadas.append(notificacion.id)
            
            except Perfil.DoesNotExist:
                logger.warning(f"Perfil {perfil_id} no encontrado")
                continue
        
        return Response({
            'status': 'success',
            'count': len(notificaciones_creadas),
            'notificaciones_ids': notificaciones_creadas
        }, status=status.HTTP_201_CREATED)
    
    # Métodos auxiliares privados
    def _enviar_por_websocket_inteligente(self, notificacion):
        """
        SECURITY VISION: Envío inteligente de notificación por WebSocket.
        
        NUEVA LÓGICA REFACTORIZADA:
        1. Obtener zona_id desde camara_id si existe
        2. Filtrar perfiles usando puede_recibir_alerta(zona_evento_id)
           - Jefes de seguridad: SIEMPRE reciben (sin filtro)
           - Guardias de seguridad: SOLO si perfil.zona_id == zona_evento_id
        3. NO usar severidad, NO usar categorías
        
        Grupos WebSocket:
        - notificaciones_{perfil_id}: Individual
        - supervision_global: Todos los jefes de seguridad
        - zona_{zona_id}: Guardias de una zona específica
        """
        try:
            from perfil.models import Perfil
            from camaras.models import CamaraDetalles
            
            channel_layer = get_channel_layer()
            serializer = NotificacionSerializer(notificacion)
            grupos_enviados = []
            
            # 1. Enviar a perfil específico si existe
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
            
            # 2. Obtener zona_id desde la cámara (si existe)
            zona_evento_id = None
            if notificacion.camara_id:
                try:
                    camara_detalle = CamaraDetalles.objects.get(id=notificacion.camara_id)
                    if camara_detalle.zona:
                        zona_evento_id = camara_detalle.zona.id
                except CamaraDetalles.DoesNotExist:
                    logger.warning(f"CamaraDetalles {notificacion.camara_id} no encontrada")
            
            # 3. Obtener perfiles activos que pueden recibir esta alerta
            perfiles = Perfil.objects.filter(user_id__is_active=True).select_related('zona')
            perfiles_destinatarios = [
                p for p in perfiles 
                if p.puede_recibir_alerta(zona_evento_id)
            ]
            
            # 4. Enviar a todos los jefes de seguridad (supervisión global)
            async_to_sync(channel_layer.group_send)(
                'supervision_global',
                {
                    'type': 'nueva_notificacion',
                    'notificacion': serializer.data
                }
            )
            grupos_enviados.append('supervision_global')
            
            # 5. Enviar a grupo de zona específica si existe zona_evento_id
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
            
            # 6. Enviar a grupos de rol únicos (evitar duplicados)
            roles_enviados = set()
            for perfil in perfiles_destinatarios:
                rol = perfil.rol
                if rol and rol not in roles_enviados:
                    group_name = f'rol_{rol}'
                    async_to_sync(channel_layer.group_send)(
                        group_name,
                        {
                            'type': 'nueva_notificacion',
                            'notificacion': serializer.data
                        }
                    )
                    grupos_enviados.append(group_name)
                    roles_enviados.add(rol)
            
            logger.info(
                f"📡 [Security Vision] Notificación {notificacion.id} enviada a {len(grupos_enviados)} grupos: "
                f"{', '.join(grupos_enviados)} | Zona: {zona_evento_id} | Destinatarios: {len(perfiles_destinatarios)}"
            )
        
        except Exception as e:
            logger.error(f"❌ Error en envío inteligente por WebSocket: {str(e)}")
    
    def _enviar_por_websocket(self, notificacion):
        """Enviar notificación por WebSocket (método legacy)"""
        try:
            channel_layer = get_channel_layer()
            room_group_name = f'notificaciones_{notificacion.perfil.id}'
            
            serializer = NotificacionSerializer(notificacion)
            
            async_to_sync(channel_layer.group_send)(
                room_group_name,
                {
                    'type': 'nueva_notificacion',
                    'notificacion': serializer.data
                }
            )
            logger.info(f"Notificación {notificacion.id} enviada por WebSocket")
        except Exception as e:
            logger.error(f"Error enviando por WebSocket: {str(e)}")
    
    def _enviar_por_fcm(self, notificacion):
        """Enviar notificación por Firebase Cloud Messaging"""
        try:
            from .utils import enviar_notificacion_fcm
            enviar_notificacion_fcm(notificacion)
            logger.info(f"Notificación {notificacion.id} enviada por FCM")
        except Exception as e:
            logger.error(f"Error enviando por FCM: {str(e)}")


class DispositivoFCMViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar tokens FCM de dispositivos móviles.
    SIN PERMISOS (proyecto académico).
    
    list: Listar dispositivos registrados
    create: Registrar nuevo dispositivo
    update: Actualizar token de dispositivo
    destroy: Eliminar dispositivo
    """
    queryset = DispositivoFCM.objects.all()
    serializer_class = DispositivoFCMSerializer
    
    def get_queryset(self):
        """Filtrar por perfil si se proporciona"""
        queryset = super().get_queryset()
        perfil_id = self.request.query_params.get('perfil_id')
        
        if perfil_id:
            queryset = queryset.filter(perfil_id=perfil_id)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Registrar o actualizar dispositivo FCM"""
        perfil_id = request.data.get('perfil')
        token_fcm = request.data.get('token_fcm')
        dispositivo_id = request.data.get('dispositivo_id')
        plataforma = request.data.get('plataforma', 'android')
        
        if not perfil_id or not token_fcm:
            return Response(
                {'error': 'perfil y token_fcm son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar si el dispositivo ya existe y actualizarlo
        dispositivo, created = DispositivoFCM.objects.update_or_create(
            perfil_id=perfil_id,
            token_fcm=token_fcm,
            defaults={
                'dispositivo_id': dispositivo_id,
                'plataforma': plataforma,
                'activo': True
            }
        )
        
        serializer = self.get_serializer(dispositivo)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        
        return Response(serializer.data, status=status_code)
    
    @action(detail=True, methods=['post'])
    def desactivar(self, request, pk=None):
        """Desactivar un dispositivo"""
        dispositivo = self.get_object()
        dispositivo.activo = False
        dispositivo.save()
        
        serializer = self.get_serializer(dispositivo)
        return Response(serializer.data)
