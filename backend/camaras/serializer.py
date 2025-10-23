from rest_framework import serializers
from .models import Camara, CamaraDetalles

class CamaraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Camara
        fields = '__all__'

class CamaraDetallesSerializer(serializers.ModelSerializer):
    class Meta:
        model = CamaraDetalles
        fields = '__all__'
