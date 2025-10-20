from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Reporte_Guardia
from .serializer import Reporte_GuardiaSerializer
from perfil.models import Perfil, Perfil_Categoria

# Create your views here.

class Reporte_GuardiaViewSets(viewsets.ModelViewSet):
    serializer_class = Reporte_GuardiaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Reporte_Guardia.objects.filter(user_id=self.request.user)
    
    @action(detail=False, methods=['POST'])
    def crear_repoorte_guardia(self, request, pk=None):
        token = request.data.get("token")
        perfil = Perfil.get_perfil(token)
        if not perfil:
            return Response({"detail": "Perfil no encontrado."}, status=404)
        try:
            perfil_categoria = Perfil_Categoria.objects.get(id=request.data.get("perfil_categoria"))
        except Perfil_Categoria.DoesNotExist:
            return Response({'error': 'El horario de trabajo no encontrado'}, status=404)
        reporte = request.data.get("reporte")
        if not reporte:
            return Response({'error': 'El reporte no debe de esta vacio'}, status=404)
        # Auentar el forgeykey de la alerta cuando este hecho la alerta
        reporte_guardia = Reporte_Guardia.objects.create(
            perfil=perfil,
            perfil_categoria=perfil_categoria,
            reporte=reporte
            #alerta=alerta
        )
        return Response({'mensaje': f'Reporte generado correctamente \n{reporte}'}, status=200)