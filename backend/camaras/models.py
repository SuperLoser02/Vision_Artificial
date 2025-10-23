from django.db import models
from django.contrib.auth import get_user_model
User = get_user_model()

class Camara(models.Model):
    cantidad = models.IntegerField()
    lugar = models.CharField(max_length=255)
    cant_zonas = models.IntegerField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"Cámara en {self.lugar} ({self.cantidad} unidades)"

class CamaraDetalles(models.Model):
    camara = models.ForeignKey(Camara, related_name='detalles', on_delete=models.CASCADE)
    n_camara = models.IntegerField()
    zona = models.CharField(max_length=100)
    ip = models.GenericIPAddressField(protocol='both', unpack_ipv4=True)
    marca = models.CharField(max_length=100)
    resolucion = models.CharField(max_length=50)

    def __str__(self):
        return f"Detalle Cámara {self.n_camara} - Zona: {self.zona}"
