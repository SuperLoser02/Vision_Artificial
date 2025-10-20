from rest_framework.routers import DefaultRouter
from .views import Reporte_GuardiaViewSets

router = DefaultRouter()
router.register(r'reporte_guardia', Reporte_GuardiaViewSets, basename='Reporte Guardia')
urlpatterns = router.urls