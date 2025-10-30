from rest_framework.routers import DefaultRouter
from .views import PerfilViewSet, CategoriaViewSet, PerfilCategoriaViewSet, UserViewSet

router = DefaultRouter()
router.register(r'perfiles', PerfilViewSet, basename='perfil')
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'perfil-categorias', PerfilCategoriaViewSet, basename='perfil-categoria')
router.register(r'empresa', UserViewSet, basename='user')

urlpatterns = router.urls