from django.db import models
from perfil.models import Perfil
from django.utils import timezone

class Notificacion(models.Model):
    PRIORIDAD_CHOICES = [
        ('alta', 'Alta'),
        ('media', 'Media'),
        ('baja', 'Baja'),
    ]
    TIPO_CHOICES = [
        ('violencia', 'Violencia'),
        ('aglomeracion', 'Aglomeración'),
        ('intrusion', 'Intrusión'),
        ('incendio', 'Incendio'),
        ('sistema', 'Sistema'),
        ('alerta', 'Alerta'),
        ('mensaje', 'Mensaje'),
        ('otro', 'Otro'),
    ]
    NIVEL_CHOICES = [
        ('rojo', 'Alto'),
        ('amarillo', 'Medio'),
        ('verde', 'Bajo'),
    ]
    CANAL_CHOICES = [
        ('push', 'Push'),
        ('websocket', 'WebSocket'),
        ('sms', 'SMS'),
        ('email', 'Email'),
        ('dashboard', 'Dashboard'),
    ]
    
    perfil = models.ForeignKey(Perfil, on_delete=models.CASCADE, related_name='notificaciones')
    titulo = models.CharField(max_length=200, default='Notificación')
    mensaje = models.TextField()
    fecha_hora = models.DateTimeField(auto_now_add=True)
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='media')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='otro')
    nivel_peligro = models.CharField(max_length=10, choices=NIVEL_CHOICES, default='verde')
    canal = models.CharField(max_length=20, choices=CANAL_CHOICES, default='dashboard')
    zona = models.CharField(max_length=100, blank=True, null=True)
    camara_id = models.IntegerField(blank=True, null=True)  # Referencia a la cámara
    
    # Estados
    leida = models.BooleanField(default=False)
    recibida = models.BooleanField(default=False)
    fecha_lectura = models.DateTimeField(blank=True, null=True)
    
    # Datos adicionales (JSON)
    metadata = models.JSONField(blank=True, null=True)  # Para datos extra como coordenadas, imagen, etc.
    
    class Meta:
        ordering = ['-fecha_hora']
        indexes = [
            models.Index(fields=['-fecha_hora']),
            models.Index(fields=['perfil', '-fecha_hora']),
            models.Index(fields=['leida']),
        ]

    def marcar_como_leida(self):
        if not self.leida:
            self.leida = True
            self.fecha_lectura = timezone.now()
            self.save()

    def __str__(self):
        return f"Notificación {self.tipo} [{self.nivel_peligro}] para {self.perfil.nombre} - {self.canal}"


class DispositivoFCM(models.Model):
    """Modelo para almacenar tokens FCM de dispositivos móviles"""
    perfil = models.ForeignKey(Perfil, on_delete=models.CASCADE, related_name='dispositivos_fcm')
    token_fcm = models.CharField(max_length=255, unique=True)
    dispositivo_id = models.CharField(max_length=255, blank=True, null=True)
    plataforma = models.CharField(max_length=20, choices=[('android', 'Android'), ('ios', 'iOS')], default='android')
    activo = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    ultima_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['perfil', 'token_fcm']
        indexes = [
            models.Index(fields=['perfil', 'activo']),
        ]
    
    def __str__(self):
        return f"Dispositivo {self.plataforma} de {self.perfil.nombre}"