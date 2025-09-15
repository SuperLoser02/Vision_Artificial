from django.db import models
from django.contrib.auth import get_user_model
from datetime import date
from dateutil.relativedelta import relativedelta
User = get_user_model()
# Create your models here.

class Plan(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    duracion_meses = models.IntegerField()
    fecha_creacion = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.nombre
    
class Suscripcion(models.Model):
    fecha_inicio = models.DateField(auto_now_add=True)
    fecha_fin = models.DateField()
    activa = models.BooleanField(default=True)
    fecha_creacion = models.DateField(auto_now_add=True)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    plan_id = models.ForeignKey(Plan, on_delete=models.DO_NOTHING)

    @staticmethod
    def tengo_suscripcion_activa(user):
        return Suscripcion.objects.filter(user_id=user, activa=True).exists()
    
    @staticmethod
    def calcular_fecha_fin(meses):
        return date.today() + relativedelta(months=meses)