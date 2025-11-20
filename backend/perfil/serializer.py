from rest_framework import serializers
from .models import Perfil, Categoria, Perfil_Categoria, VinculacionDispositivo
from django.contrib.auth.models import User
from zonas.serializers import ZonaSerializer


class CategoriaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Categoria."""
    class Meta:
        model = Categoria
        fields = '__all__'
        read_only_fields = ['id', 'fecha_creacion']


class PerfilSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Perfil.
    Incluye zona como FK (nested read, ID write).
    Incluye categorias como ManyToMany (IDs para write, detalles para read).
    Rol, zona y categoria son opcionales al crear (asignados automáticamente).
    """
    zona_detalle = ZonaSerializer(source='zona', read_only=True)
    categorias_detalle = CategoriaSerializer(source='categorias', many=True, read_only=True)
    categorias = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Categoria.objects.all(),
        required=False,
        allow_empty=True
    )
    
    class Meta:
        model = Perfil
        fields = '__all__'
        read_only_fields = ['id', 'fecha_creacion']
        extra_kwargs = {
            'rol': {'required': False},
            'zona': {'required': False}
        }
    
    def update(self, instance, validated_data):
        """
        Sobrescribir update para manejar correctamente el campo ManyToMany 'categorias'.
        """
        categorias_data = validated_data.pop('categorias', None)
        
        # Actualizar campos normales
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Actualizar categorías si se proporcionaron
        if categorias_data is not None:
            instance.categorias.set(categorias_data)
        
        return instance


class PerfilCategoriaSerializer(serializers.ModelSerializer):
    """Serializer para la relación Perfil-Categoria."""
    class Meta:
        model = Perfil_Categoria
        fields = '__all__'
        read_only_fields = ['id', 'fecha_hora_inicio']

        
class UserSerializer(serializers.ModelSerializer):
    """Serializer para el modelo User de Django."""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']
        

class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de usuarios con contraseña."""
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class VinculacionDispositivoSerializer(serializers.ModelSerializer):
    """Serializer para vinculación de dispositivos móviles."""
    class Meta:
        model = VinculacionDispositivo
        fields = '__all__'
        read_only_fields = ['id', 'fecha_creacion']