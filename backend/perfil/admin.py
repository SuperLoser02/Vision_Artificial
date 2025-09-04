from django.contrib import admin
from .models import Perfil, Categoria, Perfil_Categoria
# Register your models here.
admin.site.register(Perfil)
admin.site.register(Perfil_Categoria)
admin.site.register(Categoria)
