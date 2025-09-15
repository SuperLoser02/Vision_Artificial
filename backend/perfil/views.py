from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.timezone import now
from .models import Perfil, Categoria, Perfil_Categoria, Sesion_del_Perfil
from .serializer import PerfilSerializer, CategoriaSerializer, PerfilCategoriaSerializer
import uuid


# Create your views here.



class PerfilViewSet(viewsets.ModelViewSet):
    serializer_class = PerfilSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Perfil.objects.filter(user_id=self.request.user)
    

    @action(detail=True, methods=['patch'])
    def iniciar_sesion(self, request, pk=None):
        perfil = self.get_object()
        if perfil.user_id != request.user:
            return Response({"detail": "No autorizado."}, status=403)
        contraseña = request.data.get('contraseña')
        if not contraseña:
            return Response({"detail": "Contraseña requerida."}, status=400)
        if perfil.contraseña != contraseña:
            return Response({"detail": "Contraseña incorrecta."}, status=400)
        sesion = Sesion_del_Perfil.objects.filter(perfil=perfil, is_active=True).first() 
        if sesion: 
            sesion.ultima_actividad = now() 
            sesion.save() 
        else: 
            sesion = Sesion_del_Perfil.objects.create( perfil=perfil, token=uuid.uuid4().hex) 
        return Response({"token": sesion.token}, status=200)
    
    @action(detail=False, methods=['patch'])
    def cerrar_sesion(self, request):
        token = request.data.get('token')
        if not token:
            return Response({"detail": "Token requerido."}, status=400)
        try:
            sesion = Sesion_del_Perfil.objects.get(token=token, is_active=True)
            sesion.is_active = False
            sesion.save()
            return Response({"detail": "Sesión cerrada."}, status=200)
        except Sesion_del_Perfil.DoesNotExist:
            return Response({"detail": "Token inválido o sesión ya cerrada."}, status=400)
    
    @action(detail=False, methods=['patch'])
    def mi_perfil(self, request):
        token = request.data.get('token')
        perfil = Perfil.get_perfil(token)
        if perfil:
            serializer = self.get_serializer(perfil)
            return Response(serializer.data)
        return Response({"detail": "Perfil no encontrado."}, status=404)


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsAdminUser]
    
    def perform_create(self, serializer):
        serializer.save()
        
class PerfilCategoriaViewSet(viewsets.ModelViewSet):
    serializer_class = PerfilCategoriaSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Perfil_Categoria.objects.filter(perfil__user_id=self.request.user)
    
    @action(detail=False, methods=['post'])
    def asignar_categoria(self, request):
        token = request.data.get('token')
        perfil = Perfil.get_perfil(token)
        if not perfil:
            return Response({"detail": "Perfil no encontrado."}, status=404)
        categoria = request.data.get('categoria')
        try:
            categoria = Categoria.objects.get(id=categoria)
        except Categoria.DoesNotExist:
            return Response({"detail": "Categoría no encontrada."}, status=404)
        Perfil_Categoria.objects.create(perfil=perfil, categoria=categoria)
        return Response({"detail": "Categoría asignada."}, status=201)
    
    
 