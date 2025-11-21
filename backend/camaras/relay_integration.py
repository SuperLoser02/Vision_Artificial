"""
Integración con Relay Local - Backend recibe notificaciones de cámaras detectadas
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Camara, CamaraDetalles
from zonas.models import Zona
from django.contrib.auth.models import User


@api_view(['POST'])
@permission_classes([AllowAny])  # TODO: Agregar autenticación Token
def camara_detectada_relay(request):
    """
    Endpoint para recibir notificaciones de cámaras detectadas por el Relay Local.
    
    El relay escanea la red local y envía información de cada cámara encontrada.
    El backend puede registrarlas automáticamente o notificar al usuario.
    
    Payload esperado:
    {
        "relay_id": "relay-local-001",
        "ip": "192.168.0.100",
        "puerto": 8080,
        "tipo": "IP Webcam" | "RTSP",
        "marca": "IP Webcam",
        "metadata": {
            "status_code": 200,
            "accessible": true
        }
    }
    """
    try:
        relay_id = request.data.get('relay_id')
        ip = request.data.get('ip')
        puerto = request.data.get('puerto')
        tipo = request.data.get('tipo')
        marca = request.data.get('marca', 'Unknown')
        metadata = request.data.get('metadata', {})
        
        # Validar campos requeridos
        if not all([relay_id, ip, puerto, tipo]):
            return Response(
                {'error': 'relay_id, ip, puerto y tipo son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(f"\n{'='*60}")
        print(f"📡 CÁMARA DETECTADA POR RELAY")
        print(f"{'='*60}")
        print(f"Relay ID: {relay_id}")
        print(f"IP: {ip}:{puerto}")
        print(f"Tipo: {tipo}")
        print(f"Marca: {marca}")
        print(f"{'='*60}\n")
        
        # Construir URL de streaming
        if tipo == "IP Webcam":
            stream_url = f"http://{ip}:{puerto}/video"
        elif tipo == "RTSP":
            stream_url = f"rtsp://{ip}:{puerto}/"
        else:
            stream_url = f"http://{ip}:{puerto}/"
        
        return Response({
            'status': 'received',
            'message': 'Cámara detectada correctamente',
            'camera_info': {
                'ip': ip,
                'puerto': puerto,
                'tipo': tipo,
                'stream_url': stream_url
            },
            'relay_id': relay_id
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error procesando cámara detectada: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return Response({
            'error': str(e),
            'details': 'Error procesando cámara detectada'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])  # TODO: Agregar autenticación Token
def registrar_camara_desde_relay(request):
    """
    Endpoint para registrar automáticamente una cámara detectada por el relay.
    
    Payload esperado:
    {
        "relay_id": "relay-local-001",
        "ip": "192.168.0.100",
        "puerto": 8080,
        "tipo": "IP Webcam",
        "marca": "IP Webcam",
        "user_id": 1,
        "zona_id": 1,
        "lugar": "Entrada Principal"
    }
    """
    try:
        relay_id = request.data.get('relay_id')
        ip = request.data.get('ip')
        puerto = request.data.get('puerto', 8080)
        tipo = request.data.get('tipo')
        marca = request.data.get('marca', 'Unknown')
        user_id = request.data.get('user_id')
        zona_id = request.data.get('zona_id')
        lugar = request.data.get('lugar', 'Sin especificar')
        
        # Validar campos requeridos
        if not all([relay_id, ip, tipo, user_id]):
            return Response(
                {'error': 'relay_id, ip, tipo y user_id son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar usuario
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': f'Usuario {user_id} no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Buscar o crear zona
        zona = None
        if zona_id:
            try:
                zona = Zona.objects.get(id=zona_id)
            except Zona.DoesNotExist:
                pass
        
        # Verificar si la cámara ya existe
        existing_camera = CamaraDetalles.objects.filter(ip=ip).first()
        if existing_camera:
            return Response({
                'status': 'exists',
                'message': f'Cámara con IP {ip} ya está registrada',
                'camera_id': existing_camera.id
            }, status=status.HTTP_200_OK)
        
        # Crear cámara
        camara = Camara.objects.create(
            cantidad=1,
            lugar=lugar,
            cant_zonas=1 if zona else 0,
            user=user
        )
        
        # Crear detalles de cámara
        camara_detalle = CamaraDetalles.objects.create(
            camara=camara,
            n_camara=1,
            zona=zona,
            ip=ip,
            marca=marca,
            resolucion=f"{puerto}p"  # Placeholder
        )
        
        print(f"\n{'='*60}")
        print(f"✅ CÁMARA REGISTRADA DESDE RELAY")
        print(f"{'='*60}")
        print(f"Relay ID: {relay_id}")
        print(f"Cámara ID: {camara_detalle.id}")
        print(f"IP: {ip}:{puerto}")
        print(f"Tipo: {tipo}")
        print(f"Usuario: {user.username}")
        print(f"Zona: {zona.nombre if zona else 'Sin zona'}")
        print(f"{'='*60}\n")
        
        return Response({
            'status': 'created',
            'message': 'Cámara registrada correctamente',
            'camera_id': camara_detalle.id,
            'relay_id': relay_id
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"❌ Error registrando cámara: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return Response({
            'error': str(e),
            'details': 'Error registrando cámara'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
