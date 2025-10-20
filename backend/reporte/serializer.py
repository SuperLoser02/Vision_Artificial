from rest_framework import serializers
from .models import Reporte_Guardia

class Reporte_GuardiaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reporte_Guardia
        fields = '__all__'
