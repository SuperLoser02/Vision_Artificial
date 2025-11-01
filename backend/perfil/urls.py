from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    PerfilViewSet, 
    CategoriaViewSet, 
    PerfilCategoriaViewSet, 
    UserViewSet,
    login_empresa,
    registro_empresa
)

router = DefaultRouter()
router.register(r'perfiles', PerfilViewSet, basename='perfil')
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'perfil-categorias', PerfilCategoriaViewSet, basename='perfil-categoria')
router.register(r'empresa', UserViewSet, basename='user')

urlpatterns = [
    path('auth/login/', login_empresa, name='login-empresa'),
    path('auth/registro/', registro_empresa, name='registro-empresa'),
] + router.urls