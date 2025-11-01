from django.core.management.base import BaseCommand
from suscripcion.models import Plan


class Command(BaseCommand):
    help = 'Inicializa los planes de suscripción predeterminados'

    def handle(self, *args, **kwargs):
        planes = [
            {
                'nombre': 'Básico',
                'descripcion': 'Plan básico con funcionalidades esenciales para pequeñas empresas',
                'precio': 15.00,
                'duracion_meses': 1
            },
            {
                'nombre': 'Estándar',
                'descripcion': 'Plan estándar con más funcionalidades y soporte prioritario',
                'precio': 45.00,
                'duracion_meses': 1
            },
            {
                'nombre': 'Premium',
                'descripcion': 'Plan premium con todas las funcionalidades avanzadas',
                'precio': 60.00,
                'duracion_meses': 1
            },
            {
                'nombre': 'Profesional',
                'descripcion': 'Plan profesional para empresas grandes con soporte 24/7',
                'precio': 100.00,
                'duracion_meses': 1
            }
        ]

        creados = 0
        actualizados = 0

        for plan_data in planes:
            plan, created = Plan.objects.get_or_create(
                nombre=plan_data['nombre'],
                defaults={
                    'descripcion': plan_data['descripcion'],
                    'precio': plan_data['precio'],
                    'duracion_meses': plan_data['duracion_meses']
                }
            )

            if created:
                creados += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Plan "{plan.nombre}" creado - ${plan.precio}')
                )
            else:
                # Actualizar el plan existente si los datos han cambiado
                plan.descripcion = plan_data['descripcion']
                plan.precio = plan_data['precio']
                plan.duracion_meses = plan_data['duracion_meses']
                plan.save()
                actualizados += 1
                self.stdout.write(
                    self.style.WARNING(f'⚠️  Plan "{plan.nombre}" ya existía - Actualizado')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n🎉 Proceso completado: {creados} planes creados, {actualizados} planes actualizados'
            )
        )
        
        # Mostrar resumen de todos los planes
        self.stdout.write(self.style.SUCCESS('\n📋 Planes disponibles:'))
        for plan in Plan.objects.all().order_by('precio'):
            self.stdout.write(
                f'   • {plan.nombre}: ${plan.precio} / {plan.duracion_meses} mes(es)'
            )
