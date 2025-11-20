import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework.authtoken.models import Token

class NotificacionConsumer(AsyncWebsocketConsumer):
    """
    Consumer para manejar notificaciones en tiempo real vía WebSocket.
    
    Ruta: ws://localhost:8000/ws/notificaciones/<perfil_id>/
    """
    
    async def connect(self):
        # Obtener el perfil_id de la URL
        self.perfil_id = self.scope['url_route']['kwargs']['perfil_id']
        self.room_group_name = f'notificaciones_{self.perfil_id}'
        
        print(f"🔌 Intento de conexión WebSocket para perfil {self.perfil_id}")
        
        # Autenticar usuario (verificar token en query params)
        user = await self.get_user_from_token()
        
        if user is None or user.is_anonymous:
            print(f"❌ Usuario no autenticado para perfil {self.perfil_id}")
            await self.close(code=4001)  # Unauthorized
            return
        
        self.user = user
        print(f"✅ Usuario autenticado: {user.username}")
        
        # Obtener información del perfil
        perfil_info = await self.get_perfil_info()
        if not perfil_info:
            print(f"❌ Perfil {self.perfil_id} no encontrado")
            await self.close(code=4004)
            return
        
        self.perfil_rol = perfil_info['rol']
        self.perfil_zonas = perfil_info['zonas_asignadas']
        print(f"👤 Perfil: Rol={self.perfil_rol}, Zonas={self.perfil_zonas}")
        
        # 1. Unirse al grupo individual del perfil
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        print(f"✅ Agregado al grupo individual: {self.room_group_name}")
        
        # 2. Unirse al grupo por ROL
        await self.channel_layer.group_add(
            f'rol_{self.perfil_rol}',
            self.channel_name
        )
        print(f"✅ Agregado al grupo de rol: rol_{self.perfil_rol}")
        
        # 3. Unirse a grupos de ZONAS asignadas
        for zona in self.perfil_zonas:
            zona_group = f'zona_{zona.replace(" ", "_").lower()}'
            await self.channel_layer.group_add(
                zona_group,
                self.channel_name
            )
            print(f"✅ Agregado al grupo de zona: {zona_group}")
        
        # 4. Jefes de seguridad se unen al grupo de supervisión global
        if self.perfil_rol == 'jefe_seguridad':
            await self.channel_layer.group_add(
                'supervision_global',
                self.channel_name
            )
            print(f"✅ Agregado al grupo de supervisión global")
        
        # 5. Grupo broadcast global (para notificaciones de lectura)
        await self.channel_layer.group_add(
            'notificaciones_broadcast',
            self.channel_name
        )
        print(f"✅ Agregado al grupo broadcast")
        
        await self.accept()
        print(f"✅ WebSocket aceptado para perfil {self.perfil_id}")
        
        # Enviar mensaje de bienvenida
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': f'Conectado al sistema de notificaciones',
            'perfil_id': self.perfil_id,
            'rol': self.perfil_rol,
            'zonas': self.perfil_zonas
        }))
        
        # Enviar notificaciones no leídas
        print(f"📨 Obteniendo notificaciones no leídas para perfil {self.perfil_id}")
        notificaciones_pendientes = await self.get_notificaciones_no_leidas()
        print(f"📊 Se encontraron {len(notificaciones_pendientes)} notificaciones pendientes")
        
        if notificaciones_pendientes:
            await self.send(text_data=json.dumps({
                'type': 'notificaciones_pendientes',
                'count': len(notificaciones_pendientes),
                'notificaciones': notificaciones_pendientes
            }))
            print(f"✅ Notificaciones enviadas al cliente")
        else:
            print(f"⚠️ No hay notificaciones pendientes para enviar")
    
    async def disconnect(self, close_code):
        # Salir de todos los grupos
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            
            await self.channel_layer.group_discard(
                'notificaciones_broadcast',
                self.channel_name
            )
            
            # Salir del grupo de rol
            if hasattr(self, 'perfil_rol'):
                await self.channel_layer.group_discard(
                    f'rol_{self.perfil_rol}',
                    self.channel_name
                )
            
            # Salir de grupos de zonas
            if hasattr(self, 'perfil_zonas'):
                for zona in self.perfil_zonas:
                    zona_group = f'zona_{zona.replace(" ", "_").lower()}'
                    await self.channel_layer.group_discard(
                        zona_group,
                        self.channel_name
                    )
            
            # Salir del grupo de supervisión global si es jefe
            if hasattr(self, 'perfil_rol') and self.perfil_rol == 'jefe_seguridad':
                await self.channel_layer.group_discard(
                    'supervision_global',
                    self.channel_name
                )
        
        print(f"🔌 WebSocket desconectado para perfil {self.perfil_id}")
    
    async def receive(self, text_data):
        """Recibir mensajes del cliente"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                # Responder a ping para mantener conexión activa
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
            
            elif message_type == 'marcar_leida':
                # Marcar notificación como leída
                notificacion_id = data.get('notificacion_id')
                if notificacion_id:
                    perfil_nombre, fecha_lectura = await self.marcar_notificacion_leida(notificacion_id)
                    
                    # Confirmar al cliente que marcó como leída
                    await self.send(text_data=json.dumps({
                        'type': 'notificacion_leida',
                        'notificacion_id': notificacion_id,
                        'status': 'success'
                    }))
                    
                    # SECURITY VISION: Broadcast selectivo de lectura
                    # Solo notificar a:
                    # 1. Jefes de seguridad (supervision_global)
                    # 2. Guardias de la misma zona (opcional)
                    grupos_notificar = [
                        'rol_jefe_seguridad',  # Todos los jefes
                        'supervision_global'    # Grupo de supervisión
                    ]
                    
                    # Opcional: notificar guardias de misma zona
                    if self.perfil_zonas:
                        for zona in self.perfil_zonas:
                            zona_group = f'zona_{zona.replace(" ", "_").lower()}'
                            if zona_group not in grupos_notificar:
                                grupos_notificar.append(zona_group)
                    
                    for grupo in grupos_notificar:
                        await self.channel_layer.group_send(
                            grupo,
                            {
                                'type': 'notificacion_leida_broadcast',
                                'notificacion_id': notificacion_id,
                                'perfil_nombre': perfil_nombre,
                                'fecha_lectura': fecha_lectura,
                                'perfil_id': self.perfil_id,
                                'rol': self.perfil_rol
                            }
                        )
                    print(f"📢 Broadcast de lectura enviado a: {', '.join(grupos_notificar)}")
            
            elif message_type == 'marcar_todas_leidas':
                # Marcar todas como leídas
                count = await self.marcar_todas_leidas()
                await self.send(text_data=json.dumps({
                    'type': 'todas_leidas',
                    'count': count,
                    'status': 'success'
                }))
        
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'JSON inválido'
            }))
    
    # Recibir notificación desde el grupo
    async def nueva_notificacion(self, event):
        """Enviar notificación al WebSocket cuando llega una nueva"""
        await self.send(text_data=json.dumps({
            'type': 'nueva_notificacion',
            'notificacion': event['notificacion']
        }))
    
    async def notificacion_leida_broadcast(self, event):
        """Enviar al panel web cuando un guardia lee una notificación"""
        await self.send(text_data=json.dumps({
            'type': 'notificacion_leida',
            'notificacion_id': event['notificacion_id'],
            'perfil_nombre': event['perfil_nombre'],
            'fecha_lectura': event['fecha_lectura'],
            'perfil_id': event['perfil_id'],
            'rol': event.get('rol', 'desconocido')
        }))
    
    # Métodos auxiliares para base de datos
    @database_sync_to_async
    def get_user_from_token(self):
        """Autenticar usuario mediante token en query params"""
        try:
            query_string = self.scope.get('query_string', b'').decode()
            params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
            token_key = params.get('token')
            
            if not token_key:
                return AnonymousUser()
            
            token = Token.objects.select_related('user').get(key=token_key)
            return token.user
        except (Token.DoesNotExist, ValueError):
            return AnonymousUser()
    
    @database_sync_to_async
    def get_perfil_info(self):
        """Obtener información del perfil (rol, zonas)"""
        from perfil.models import Perfil
        try:
            perfil = Perfil.objects.select_related('zona').get(id=self.perfil_id)
            # Construir lista de zonas: si tiene zona asignada, devolver su nombre
            zonas_list = []
            if perfil.zona:
                zonas_list = [perfil.zona.nombre]
            
            return {
                'rol': perfil.rol,
                'zonas_asignadas': zonas_list,
            }
        except Perfil.DoesNotExist:
            return None
    
    @database_sync_to_async
    def get_notificaciones_no_leidas(self):
        """Obtener notificaciones no leídas del perfil"""
        from .models import Notificacion
        from .serializer import NotificacionSerializer
        
        notificaciones = Notificacion.objects.filter(
            perfil_id=self.perfil_id,
            leida=False
        ).order_by('-fecha_hora')[:20]
        
        serializer = NotificacionSerializer(notificaciones, many=True)
        return serializer.data
    
    @database_sync_to_async
    def marcar_notificacion_leida(self, notificacion_id):
        """Marcar una notificación como leída y devolver info del perfil"""
        from .models import Notificacion
        try:
            notificacion = Notificacion.objects.select_related('perfil').get(
                id=notificacion_id,
                perfil_id=self.perfil_id
            )
            notificacion.marcar_como_leida()
            
            # Devolver nombre del perfil y fecha de lectura
            perfil_nombre = notificacion.perfil.nombre
            fecha_lectura = notificacion.fecha_lectura.isoformat() if notificacion.fecha_lectura else None
            
            return perfil_nombre, fecha_lectura
        except Notificacion.DoesNotExist:
            return None, None
    
    @database_sync_to_async
    def marcar_todas_leidas(self):
        """Marcar todas las notificaciones como leídas"""
        from .models import Notificacion
        from django.utils import timezone
        
        count = Notificacion.objects.filter(
            perfil_id=self.perfil_id,
            leida=False
        ).update(leida=True, fecha_lectura=timezone.now())
        
        return count


class ChatConsumer(AsyncWebsocketConsumer):
    """
    Consumer para chat en tiempo real entre guardias.
    
    Ruta: ws://localhost:8000/ws/chat/<sala_id>/
    """
    
    async def connect(self):
        self.sala_id = self.scope['url_route']['kwargs']['sala_id']
        self.room_group_name = f'chat_{self.sala_id}'
        
        # Autenticar usuario
        user = await self.get_user_from_token()
        
        if user is None or user.is_anonymous:
            await self.close(code=4001)
            return
        
        self.user = user
        
        # Unirse a la sala de chat
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Notificar que el usuario se unió
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'usuario_unido',
                'usuario': self.user.username,
                'perfil_id': await self.get_perfil_id()
            }
        )
    
    async def disconnect(self, close_code):
        # Notificar que el usuario salió
        if hasattr(self, 'room_group_name') and hasattr(self, 'user'):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'usuario_salio',
                    'usuario': self.user.username,
                }
            )
            
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Recibir mensaje del cliente"""
        try:
            data = json.loads(text_data)
            mensaje = data.get('mensaje')
            tipo_mensaje = data.get('tipo', 'texto')  # texto, imagen, ubicacion
            
            if not mensaje:
                return
            
            # Guardar mensaje en BD
            mensaje_id = await self.guardar_mensaje(mensaje, tipo_mensaje)
            
            perfil_id = await self.get_perfil_id()
            perfil_nombre = await self.get_perfil_nombre()
            
            # Enviar mensaje a todos en la sala
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_mensaje',
                    'mensaje_id': mensaje_id,
                    'mensaje': mensaje,
                    'tipo_mensaje': tipo_mensaje,
                    'usuario': self.user.username,
                    'perfil_id': perfil_id,
                    'perfil_nombre': perfil_nombre,
                    'timestamp': await self.get_timestamp()
                }
            )
        
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'JSON inválido'
            }))
    
    # Handlers para eventos del grupo
    async def chat_mensaje(self, event):
        """Enviar mensaje de chat al WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'mensaje',
            'mensaje_id': event['mensaje_id'],
            'mensaje': event['mensaje'],
            'tipo_mensaje': event['tipo_mensaje'],
            'usuario': event['usuario'],
            'perfil_id': event['perfil_id'],
            'perfil_nombre': event['perfil_nombre'],
            'timestamp': event['timestamp']
        }))
    
    async def usuario_unido(self, event):
        """Notificar que un usuario se unió"""
        await self.send(text_data=json.dumps({
            'type': 'usuario_unido',
            'usuario': event['usuario'],
            'perfil_id': event['perfil_id']
        }))
    
    async def usuario_salio(self, event):
        """Notificar que un usuario salió"""
        await self.send(text_data=json.dumps({
            'type': 'usuario_salio',
            'usuario': event['usuario']
        }))
    
    # Métodos auxiliares
    @database_sync_to_async
    def get_user_from_token(self):
        """Autenticar usuario mediante token"""
        try:
            query_string = self.scope.get('query_string', b'').decode()
            params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
            token_key = params.get('token')
            
            if not token_key:
                print("❌ No hay token en query params")
                return AnonymousUser()
            
            print(f"🔑 Intentando autenticar con token: {token_key[:20]}...")
            token = Token.objects.select_related('user').get(key=token_key)
            print(f"✅ Token válido para usuario: {token.user.username}")
            return token.user
        except Token.DoesNotExist:
            print(f"❌ Token no encontrado en la base de datos")
            return AnonymousUser()
        except ValueError as e:
            print(f"❌ Error parseando query params: {e}")
            return AnonymousUser()
    
    @database_sync_to_async
    def get_perfil_id(self):
        """Obtener perfil_id del usuario"""
        from perfil.models import Perfil
        try:
            perfil = Perfil.objects.get(user=self.user)
            return perfil.id
        except Perfil.DoesNotExist:
            return None
    
    @database_sync_to_async
    def get_perfil_nombre(self):
        """Obtener nombre del perfil"""
        from perfil.models import Perfil
        try:
            perfil = Perfil.objects.get(user=self.user)
            return perfil.nombre
        except Perfil.DoesNotExist:
            return self.user.username
    
    @database_sync_to_async
    def guardar_mensaje(self, mensaje, tipo_mensaje):
        """Guardar mensaje en la base de datos"""
        # Aquí crearemos un modelo de MensajeChat después
        # Por ahora retornamos un ID temporal
        import uuid
        return str(uuid.uuid4())
    
    @database_sync_to_async
    def get_timestamp(self):
        """Obtener timestamp actual"""
        from django.utils import timezone
        return timezone.now().isoformat()
