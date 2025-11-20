from rest_framework import serializers
from .models import Notificacion, DispositivoFCM


class NotificacionSerializer(serializers.ModelSerializer):
    """
    Serializer para Notificaciones.
    Sin validaciones complejas (proyecto académico).
    """
    perfil_nombre = serializers.CharField(source='perfil.nombre', read_only=True)
    tiempo_transcurrido = serializers.SerializerMethodField()
    
    class Meta:
        model = Notificacion
        fields = '__all__'
        read_only_fields = ['id', 'fecha_hora', 'fecha_lectura']
    
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


class DispositivoFCMSerializer(serializers.ModelSerializer):
    """
    Serializer para Dispositivos FCM.
    Sin validaciones complejas (proyecto académico).
    """
    perfil_nombre = serializers.CharField(source='perfil.nombre', read_only=True)
    
    class Meta:
        model = DispositivoFCM
        fields = '__all__'
        read_only_fields = ['id', 'fecha_registro', 'ultima_actualizacion']
