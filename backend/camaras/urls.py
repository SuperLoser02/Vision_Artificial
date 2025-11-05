from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import CamaraViewSet, CamaraDetallesViewSet, DetectarCamarasAPIView, RegistrarCamaraManualAPIView, estado_camara

router = DefaultRouter()
router.register(r'camaras', CamaraViewSet, basename='camara')
router.register(r'camara-detalles', CamaraDetallesViewSet, basename='camara-detalles')

urlpatterns = router.urls + [
    path('detectar/', DetectarCamarasAPIView.as_view(), name='detectar-camaras'),
    path('registrar/', RegistrarCamaraManualAPIView.as_view(), name='registrar-camara-manual'),
    path('estado-camara/<int:detalle_id>/', estado_camara, name='estado-camara'),
]