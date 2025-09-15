from rest_framework.routers import DefaultRouter
from .views import SuscripcionViewSet, PlanViewSet
router = DefaultRouter()
router.register(r'suscripciones', SuscripcionViewSet, basename='suscripcion')
router.register(r'planes', PlanViewSet, basename='plan')
urlpatterns = router.urls