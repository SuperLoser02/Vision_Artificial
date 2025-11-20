from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()

# Create your models here.
class Perfil(models.Model):
    # Opciones de roles simplificados para Security Vision
    ROL_CHOICES = [
        ('guardia_seguridad', 'Guardia de Seguridad'),
        ('jefe_seguridad', 'Jefe de Seguridad'),
    ]
    
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
    
    # CAMPOS PARA SISTEMA DE NOTIFICACIONES SECURITY VISION
    rol = models.CharField(
        max_length=20,
        choices=ROL_CHOICES,
        null=True,
        blank=True,
        help_text='Rol del usuario: guardia_seguridad (patrulla) o jefe_seguridad (supervisa todo). Asignado automáticamente al crear.'
    )
    
    # NUEVA RELACIÓN: Zona asignada (FK en lugar de JSON)
    zona = models.ForeignKey(
        'zonas.Zona',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='perfiles',
        help_text='Zona asignada al guardia. Jefes de seguridad no requieren zona.'
    )
    
    # RELACIÓN: Categorías asignadas (ManyToMany)
    categorias = models.ManyToManyField(
        'Categoria',
        through='Perfil_Categoria',
        blank=True,
        related_name='perfiles',
        help_text='Categorías/turnos asignados al perfil.'
    )

    class Meta:
        verbose_name = 'Perfil'
        verbose_name_plural = 'Perfiles'
        ordering = ['nombre', 'apellido']

    def __str__(self):
        return f"{self.nombre} {self.apellido} - {self.get_rol_display()}"
    
    @staticmethod
    def get_perfil(token):
        try:
            sesion = Sesion_del_Perfil.objects.get(token=token)
            return sesion.perfil
        except Sesion_del_Perfil.DoesNotExist:
            return None
    
    def puede_recibir_alerta(self, zona_evento_id):
        """
        Determina si este perfil debe recibir una alerta según Security Vision.
        
        NUEVA LÓGICA SIMPLIFICADA:
        - jefe_seguridad: Recibe TODAS las alertas (supervisión total)
        - guardia_seguridad: Recibe alertas SOLO de su zona asignada
        
        Args:
            zona_evento_id: ID de la zona donde ocurrió el evento
        
        Returns:
            bool: True si debe recibir la alerta
        """
        # Jefe de seguridad SIEMPRE recibe todas las alertas
        if self.rol == 'jefe_seguridad':
            return True
        
        # Guardia de seguridad: solo recibe alertas de su zona
        if self.rol == 'guardia_seguridad':
            return self.zona_id == zona_evento_id
        
        # Por defecto no recibe (seguridad)
        return False

class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateField(auto_now_add=True)

    class Meta:
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre
    
class Perfil_Categoria(models.Model):
    perfil = models.ForeignKey(Perfil, on_delete=models.CASCADE)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE)
    fecha_hora_inicio = models.DateTimeField(auto_now_add=True)
    fecha_hora_fin = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = 'Perfil-Categoría'
        verbose_name_plural = 'Perfiles-Categorías'

    def __str__(self):
        return f"{self.perfil} - {self.categoria}"

class Sesion_del_Perfil(models.Model):
    perfil = models.ForeignKey(Perfil, on_delete=models.CASCADE)
    token = models.CharField(max_length=255, unique=True)
    ultima_actividad = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Sesión del Perfil'
        verbose_name_plural = 'Sesiones de Perfiles'

    def __str__(self):
        return f"Sesión de {self.perfil.nombre} {self.perfil.apellido}"

class VinculacionDispositivo(models.Model):
    perfil = models.ForeignKey(Perfil, on_delete=models.CASCADE)
    token = models.CharField(max_length=64, unique=True, default=uuid.uuid4)
    dispositivo_id = models.CharField(max_length=128, blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_expiracion = models.DateTimeField(blank=True, null=True)
    usado = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Vinculación de Dispositivo'
        verbose_name_plural = 'Vinculaciones de Dispositivos'

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = uuid.uuid4().hex
        if not self.fecha_expiracion:
            self.fecha_expiracion = timezone.now() + timezone.timedelta(minutes=10)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Vinculación de {self.perfil} - Token: {self.token}"