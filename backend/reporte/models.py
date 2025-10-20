from django.db import models
from perfil.models import Perfil, Perfil_Categoria
# from alerta.models import Aletas
# Create your models here.

class Reporte_Guardia(models.Model):
    perfil=models.ForeignKey(Perfil, on_delete=models.DO_NOTHING)
    perfil_categoria=models.ForeignKey(Perfil_Categoria, on_delete=models.DO_NOTHING)
    reporte=models.TextField()
    datetime_reporte=models.DateField(auto_now_add=True)
    # alerta = models.ForeignKey(Alerta, on delete=models.DO_NOTHING)