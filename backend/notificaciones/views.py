from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Notificacion
from .serializer import NotificacionSerializer
from perfil.models import Perfil

class NotificacionViewSet(viewsets.ModelViewSet):
    queryset = Notificacion.objects.all()
    serializer_class = NotificacionSerializer

    def create(self, request, *args, **kwargs):
        perfil_id = request.data.get('perfil_id')
        mensaje = request.data.get('mensaje')
        prioridad = request.data.get('prioridad', 'media')
        tipo = request.data.get('tipo', 'otro')
        nivel_peligro = request.data.get('nivel_peligro', 'verde')
        canal = request.data.get('canal', 'dashboard')
        zona = request.data.get('zona', None)
        if not perfil_id or not mensaje:
            return Response({'error': 'perfil_id y mensaje son requeridos'}, status=status.HTTP_400_BAD_REQUEST)
        perfil = Perfil.objects.filter(id=perfil_id).first()
        if not perfil:
            return Response({'error': 'Perfil no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        notificacion = Notificacion.objects.create(
            perfil=perfil,
            mensaje=mensaje,
            prioridad=prioridad,
            tipo=tipo,
            nivel_peligro=nivel_peligro,
            canal=canal,
            zona=zona
        )
        # Aquí puedes disparar integración con servicios externos según canal
        # Ejemplo: if canal == 'push': enviar_push(notificacion)
        serializer = self.get_serializer(notificacion)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def list(self, request, *args, **kwargs):
        filtros = {}
        perfil_id = request.query_params.get('perfil_id')
        prioridad = request.query_params.get('prioridad')
        tipo = request.query_params.get('tipo')
        nivel_peligro = request.query_params.get('nivel_peligro')
        canal = request.query_params.get('canal')
        zona = request.query_params.get('zona')
        leida = request.query_params.get('leida')
        recibida = request.query_params.get('recibida')
        if perfil_id:
            filtros['perfil_id'] = perfil_id
        if prioridad:
            filtros['prioridad'] = prioridad
        if tipo:
            filtros['tipo'] = tipo
        if nivel_peligro:
            filtros['nivel_peligro'] = nivel_peligro
        if canal:
            filtros['canal'] = canal
        if zona:
            filtros['zona'] = zona
        if leida is not None:
            filtros['leida'] = leida.lower() == 'true'
        if recibida is not None:
            filtros['recibida'] = recibida.lower() == 'true'
        notificaciones = Notificacion.objects.filter(**filtros).order_by('-fecha_hora')
        serializer = self.get_serializer(notificaciones, many=True)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        # Permite marcar como leída y recibida
        instance = self.get_object()
        leida = request.data.get('leida')
        recibida = request.data.get('recibida')
        if leida is not None:
            instance.leida = leida
        if recibida is not None:
            instance.recibida = recibida
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
