from django.db import models
from camaras.models import CamaraDetalles
from django.contrib.auth.models import User

# Create your models here.

class DetectionEvent(models.Model):
    camara_id = models.ForeignKey(CamaraDetalles, on_delete=models.DO_NOTHING)
    timeStamp = models.DateTimeField(auto_now_add=True)
    tipo_alerta = models.CharField(max_length=30)
    zona = models.CharField(max_length=100, null=True, blank=True)
    video_file = models.CharField(max_length=255, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    #SUPABASE