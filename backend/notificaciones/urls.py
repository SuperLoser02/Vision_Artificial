from rest_framework.routers import DefaultRouter
from .views import NotificacionViewSet, DispositivoFCMViewSet

router = DefaultRouter()
router.register(r'notificaciones', NotificacionViewSet, basename='notificacion')
router.register(r'dispositivos-fcm', DispositivoFCMViewSet, basename='dispositivo-fcm')

urlpatterns = router.urls
