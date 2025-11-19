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
    
    # Niveles de severidad mínimos que puede recibir
    NIVEL_SEVERIDAD_CHOICES = [
        ('rojo', 'Alto - Solo alertas críticas'),
        ('amarillo', 'Medio - Alertas medias y críticas'),
        ('verde', 'Bajo - Todas las alertas'),
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
        default='guardia_seguridad',
        help_text='Rol del usuario: guardia_seguridad (patrulla) o jefe_seguridad (supervisa todo)'
    )
    zonas_asignadas = models.JSONField(
        default=list,
        blank=True,
        help_text='Lista de zonas a las que está asignado este perfil. Ej: ["Zona Norte", "Zona Centro"]'
    )
    nivel_severidad_minimo = models.CharField(
        max_length=10,
        choices=NIVEL_SEVERIDAD_CHOICES,
        default='verde',
        help_text='Nivel mínimo de severidad de alertas que recibirá. Verde=todas, Amarillo=medias y altas, Rojo=solo críticas'
    )

    def __str__(self):
        return f"{self.nombre} {self.apellido} - {self.get_rol_display()}"
    
    @staticmethod
    def get_perfil(token):
        try:
            sesion = Sesion_del_Perfil.objects.get(token=token)
            return sesion.perfil
        except Sesion_del_Perfil.DoesNotExist:
            return None
    
    def puede_recibir_alerta(self, nivel_peligro, zona=None):
        """
        Determina si este perfil debe recibir una alerta según Security Vision.
        
        Reglas:
        - jefe_seguridad: Recibe TODAS las alertas (supervisión total)
        - guardia_seguridad: Filtrado por zona asignada y nivel de severidad
        
        Args:
            nivel_peligro: 'rojo', 'amarillo' o 'verde'
            zona: Nombre de la zona (opcional)
        
        Returns:
            bool: True si debe recibir la alerta
        """
        # Jefe de seguridad SIEMPRE recibe todas las alertas
        if self.rol == 'jefe_seguridad':
            return True
        
        # Guardia de seguridad: aplicar filtros
        if self.rol == 'guardia_seguridad':
            # 1. Verificar nivel de severidad
            niveles = {'rojo': 3, 'amarillo': 2, 'verde': 1}
            nivel_alerta = niveles.get(nivel_peligro, 1)
            nivel_minimo = niveles.get(self.nivel_severidad_minimo, 1)
            
            if nivel_alerta < nivel_minimo:
                return False  # Alerta no cumple con severidad mínima
            
            # 2. Verificar zona asignada
            if zona:  # Si la alerta tiene zona específica
                if not self.zonas_asignadas:  # Si guardia no tiene zonas asignadas
                    return True  # Recibe todas las alertas
                return zona in self.zonas_asignadas  # Solo si está en su zona
            
            # Sin zona específica, el guardia la recibe (alerta global)
            return True
        
        # Por defecto no recibe (seguridad)
        return False

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