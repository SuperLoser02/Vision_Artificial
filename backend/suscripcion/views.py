from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny

from .models import Suscripcion, Plan
from .serializer import SuscripcionSerializer, PlanSerializer
# Create your views here.

class PlanViewSet(viewsets.ModelViewSet):
    serializer_class = PlanSerializer
    queryset = Plan.objects.all()
    
    def get_permissions(self):
        """
        Permite que cualquiera vea los planes (list, retrieve)
        Solo admin puede crear, actualizar o eliminar
        """
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]

    def get_queryset(self):
        return Plan.objects.all()


class SuscripcionViewSet(viewsets.ModelViewSet):
    serializer_class = SuscripcionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filtrar solo las suscripciones del usuario actual
        return Suscripcion.objects.filter(user_id=self.request.user)

    @action(detail=False, methods=['get'])
    def mis_suscripciones(self, request):
        suscripciones = self.get_queryset()
        serializer = self.get_serializer(suscripciones, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def crear_suscripcion(self, request):
        plan_id = request.data.get('plan_id')
        if not plan_id:
            return Response({"error": "plan_id es requerido."}, status=400)
        
        try:
            plan = Plan.objects.get(id=plan_id)
        except Plan.DoesNotExist:
            return Response({"error": "Plan no encontrado."}, status=404)
        
        if Suscripcion.tengo_suscripcion_activa(request.user):
            return Response({"error": "Ya tienes una suscripción activa."}, status=400)
        
        meses = plan.duracion_meses
        fecha_fin = Suscripcion.calcular_fecha_fin(meses)
        suscripcion = Suscripcion.objects.create(
            user_id=request.user, 
            plan_id=plan, 
            fecha_fin=fecha_fin
        )
        
        serializer = self.get_serializer(suscripcion)
        return Response({
            "mensaje": "Suscripción creada exitosamente",
            "suscripcion": serializer.data,
            "plan": plan.nombre,
            "fecha_fin": fecha_fin.strftime('%Y-%m-%d')
        }, status=201)
    
    # Falta una funcion para que se cancele la suscripcion segun la fecha actual y la fecha de fin
    # y que se ejecute automaticamente cada dia a las 00:00