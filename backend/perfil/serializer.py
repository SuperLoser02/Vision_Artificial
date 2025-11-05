from rest_framework import serializers
from .models import Perfil, Categoria, Perfil_Categoria, VinculacionDispositivo
from django.contrib.auth.models import User

class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Perfil
        fields = '__all__'

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class PerfilCategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Perfil_Categoria
        fields = '__all__'
        
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']
        

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class VinculacionDispositivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = VinculacionDispositivo
        fields = '__all__'