from rest_framework.routers import DefaultRouter
from .views import ZonaViewSet

router = DefaultRouter()
router.register(r'zonas', ZonaViewSet, basename='zona')

urlpatterns = router.urls
