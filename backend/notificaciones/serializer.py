from rest_framework import serializers
from .models import Notificacion, DispositivoFCM

class NotificacionSerializer(serializers.ModelSerializer):
    perfil_nombre = serializers.CharField(source='perfil.nombre', read_only=True)
    tiempo_transcurrido = serializers.SerializerMethodField()
    
    class Meta:
        model = Notificacion
        fields = [
            'id', 'perfil', 'perfil_nombre', 'titulo', 'mensaje',
            'fecha_hora', 'tiempo_transcurrido', 'prioridad', 'tipo',
            'nivel_peligro', 'canal', 'zona', 'camara_id',
            'leida', 'recibida', 'fecha_lectura', 'metadata'
        ]
        read_only_fields = ['fecha_hora', 'fecha_lectura']
    
    def get_tiempo_transcurrido(self, obj):
        from django.utils import timezone
        delta = timezone.now() - obj.fecha_hora
        
        if delta.days > 0:
            return f"hace {delta.days} día{'s' if delta.days > 1 else ''}"
        elif delta.seconds >= 3600:
            horas = delta.seconds // 3600
            return f"hace {horas} hora{'s' if horas > 1 else ''}"
        elif delta.seconds >= 60:
            minutos = delta.seconds // 60
            return f"hace {minutos} minuto{'s' if minutos > 1 else ''}"
        else:
            return "hace un momento"


class NotificacionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear notificaciones con validaciones"""
    
    class Meta:
        model = Notificacion
        fields = [
            'perfil', 'titulo', 'mensaje', 'prioridad', 'tipo',
            'nivel_peligro', 'canal', 'zona', 'camara_id', 'metadata'
        ]
    
    def validate_mensaje(self, value):
        if len(value) < 10:
            raise serializers.ValidationError("El mensaje debe tener al menos 10 caracteres")
        return value


class DispositivoFCMSerializer(serializers.ModelSerializer):
    perfil_nombre = serializers.CharField(source='perfil.nombre', read_only=True)
    
    class Meta:
        model = DispositivoFCM
        fields = [
            'id', 'perfil', 'perfil_nombre', 'token_fcm',
            'dispositivo_id', 'plataforma', 'activo',
            'fecha_registro', 'ultima_actualizacion'
        ]
        read_only_fields = ['fecha_registro', 'ultima_actualizacion']
    
    def validate_token_fcm(self, value):
        if len(value) < 50:
            raise serializers.ValidationError("Token FCM inválido")
        return value
