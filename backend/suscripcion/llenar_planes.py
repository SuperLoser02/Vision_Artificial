from suscripcion.models import Plan

Plan.objects.get_or_create(
    nombre="Plan 1 Mes",
    defaults={
        "descripcion": "Suscripción mensual con acceso completo al sistema de monitoreo y gestión de cámaras.",
        "precio": 10,
        "duracion_meses": 1
    }
)

Plan.objects.get_or_create(
    nombre="Plan 3 Meses",
    defaults={
        "descripcion": "Suscripción trimestral ideal para usuarios que buscan continuidad y mejor inversión.",
        "precio": 25,
        "duracion_meses": 3
    }
)

Plan.objects.get_or_create(
    nombre="Plan 12 Meses",
    defaults={
        "descripcion": "Suscripción anual con el mejor costo-beneficio y acceso ilimitado durante todo el año.",
        "precio": 80,
        "duracion_meses": 12
    }
)


# Comando para ejecutar este script:

# docker exec -i visionartificial-backend-1 bash -c "cd /app/backend && python manage.py shell < suscripcion/llenar_planes.py"