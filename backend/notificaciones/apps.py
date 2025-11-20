from django.apps import AppConfig


class NotificacionesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notificaciones'

    def ready(self):
        """Importar signals cuando la app esté lista"""
        import notificaciones.signals  # noqa
