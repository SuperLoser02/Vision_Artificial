from rest_framework import serializers
from .models import Perfil, Categoria, Perfil_Categoria

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
        