from django.db import models
from django.contrib.auth import get_user_model
User = get_user_model()


class Camara(models.Model):
    """
    Modelo para agrupar cámaras por ubicación.
    Una cámara puede tener múltiples detalles (CamaraDetalles).
    Pertenece a user (empresa), NO a perfil.
    """
    cantidad = models.IntegerField()
    lugar = models.CharField(max_length=255)
    cant_zonas = models.IntegerField()
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        verbose_name = 'Cámara'
        verbose_name_plural = 'Cámaras'
        ordering = ['lugar']

    def __str__(self):
        return f"Cámara en {self.lugar} ({self.cantidad} unidades)"


class CamaraDetalles(models.Model):
    """
    Detalles técnicos de cada cámara individual.
    Incluye zona asignada como FK.
    """
    camara = models.ForeignKey(Camara, related_name='detalles', on_delete=models.CASCADE)
    n_camara = models.IntegerField()
    
    # REFACTORIZADO: Zona como FK en lugar de CharField
    zona = models.ForeignKey(
        'zonas.Zona',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='camaras',
        help_text='Zona donde está ubicada la cámara. Debe asignarse manualmente.'
    )
    
    ip = models.GenericIPAddressField(protocol='both', unpack_ipv4=True)
    marca = models.CharField(max_length=100)
    resolucion = models.CharField(max_length=50)

    class Meta:
        verbose_name = 'Detalle de Cámara'
        verbose_name_plural = 'Detalles de Cámaras'
        ordering = ['camara', 'n_camara']

    def __str__(self):
        return f"Detalle Cámara {self.n_camara} - Zona: {self.zona.nombre if self.zona else 'Sin asignar'}"

