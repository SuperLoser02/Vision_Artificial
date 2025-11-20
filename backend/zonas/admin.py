from django.contrib import admin
from .models import Zona


@admin.register(Zona)
class ZonaAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre', 'activa', 'fecha_creacion']
    list_filter = ['activa', 'fecha_creacion']
    search_fields = ['nombre', 'descripcion']
    ordering = ['nombre']
