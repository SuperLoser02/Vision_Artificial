from django.core.management.base import BaseCommand
from datetime import date
from suscripcion.models import Suscripcion

class Command(BaseCommand):
    help = 'Desactiva las suscripciones vencidas'

    def handle(self, *args, **kwargs):
        hoy = date.today()
        actualizadas = Suscripcion.objects.filter(fecha_fin__lt=hoy, activa=True).update(activa=False)
        self.stdout.write(self.style.SUCCESS(f'{actualizadas} suscripciones desactivadas'))
