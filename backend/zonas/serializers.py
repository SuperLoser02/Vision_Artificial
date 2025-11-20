from rest_framework import serializers
from .models import Zona


class ZonaSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Zona.
    Proporciona CRUD completo sin validaciones complejas.
    """
    class Meta:
        model = Zona
        fields = ['id', 'nombre', 'descripcion', 'activa', 'fecha_creacion', 'fecha_actualizacion']
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']
