from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()

# Create your models here.
class Perfil(models.Model):
    ci = models.CharField(max_length=10, unique=True)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    contraseña = models.CharField(max_length=255, blank=True)
    email = models.EmailField(unique=True)
    telefono = models.CharField(max_length=15, blank=True, null=True)
    direccion = models.TextField(blank=True, null=True)
    fecha_nacimiento = models.DateField(blank=True, null=True)
    fecha_creacion = models.DateField(auto_now_add=True)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.nombre} {self.apellido}"
    
    @staticmethod
    def get_perfil(token):
        try:
            sesion = Sesion_del_Perfil.objects.get(token=token)
            return sesion.perfil
        except Sesion_del_Perfil.DoesNotExist:
            return None

class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.nombre
    
class Perfil_Categoria(models.Model):
    perfil = models.ForeignKey(Perfil, on_delete=models.CASCADE)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE)
    fecha_hora_inicio = models.DateTimeField(auto_now_add=True)
    fecha_hora_fin = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.perfil_id} - {self.categoria_id}"

class Sesion_del_Perfil(models.Model):
    perfil = models.ForeignKey(Perfil, on_delete=models.CASCADE)
    token = models.CharField(max_length=255, unique=True)
    ultima_actividad = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Sesión de {self.perfil.nombre} {self.perfil.apellido}"

class VinculacionDispositivo(models.Model):
    perfil = models.ForeignKey(Perfil, on_delete=models.CASCADE)
    token = models.CharField(max_length=64, unique=True, default=uuid.uuid4)
    dispositivo_id = models.CharField(max_length=128, blank=True, null=True)  # Puede ser el ID del dispositivo móvil
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_expiracion = models.DateTimeField(blank=True, null=True)
    usado = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = uuid.uuid4().hex
        if not self.fecha_expiracion:
            self.fecha_expiracion = timezone.now() + timezone.timedelta(minutes=10)  # Expira en 10 minutos
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Vinculación de {self.perfil} - Token: {self.token}"