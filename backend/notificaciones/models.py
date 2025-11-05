from django.db import models
from perfil.models import Perfil

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
        ('otro', 'Otro'),
    ]
    NIVEL_CHOICES = [
        ('rojo', 'Alto'),
        ('amarillo', 'Medio'),
        ('verde', 'Bajo'),
    ]
    CANAL_CHOICES = [
        ('push', 'Push'),
        ('sms', 'SMS'),
        ('email', 'Email'),
        ('dashboard', 'Dashboard'),
    ]
    perfil = models.ForeignKey(Perfil, on_delete=models.CASCADE, related_name='notificaciones')
    mensaje = models.TextField()
    fecha_hora = models.DateTimeField(auto_now_add=True)
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='media')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='otro')
    nivel_peligro = models.CharField(max_length=10, choices=NIVEL_CHOICES, default='verde')
    canal = models.CharField(max_length=20, choices=CANAL_CHOICES, default='dashboard')
    zona = models.CharField(max_length=100, blank=True, null=True)
    leida = models.BooleanField(default=False)
    recibida = models.BooleanField(default=False)  # Confirmación de recepción

    def __str__(self):
        return f"Notificación {self.tipo} [{self.nivel_peligro}] para {self.perfil.nombre} - {self.canal}"