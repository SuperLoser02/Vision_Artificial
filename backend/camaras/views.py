from rest_framework import viewsets, status
from .models import Camara, CamaraDetalles
from .serializer import CamaraSerializer, CamaraDetallesSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
import requests
import socket
from concurrent.futures import ThreadPoolExecutor, as_completed

class CamaraViewSet(viewsets.ModelViewSet):
    queryset = Camara.objects.all()
    serializer_class = CamaraSerializer

class CamaraDetallesViewSet(viewsets.ModelViewSet):
    queryset = CamaraDetalles.objects.all()
    serializer_class = CamaraDetallesSerializer

class RegistrarCamaraManualAPIView(APIView):
    def post(self, request):
        ip = request.data.get('ip')
        puerto = request.data.get('puerto', 8080)
        protocolo = request.data.get('protocolo', 'http')
        usuario = request.data.get('usuario', '')
        password = request.data.get('password', '')
        zona = request.data.get('zona', 'No especificada')
        
        if not ip:
            return Response(
                {"error": "La IP es requerida"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            url = f"{protocolo}://{ip}:{puerto}/status.json"
            if usuario and password:
                r = requests.get(url, auth=(usuario, password), timeout=2, verify=False)
            else:
                r = requests.get(url, timeout=2, verify=False)
            
            if r.status_code == 200:
                info = r.json()
                camara = Camara.objects.create(
                    cantidad=1,
                    lugar=f"Registrada manualmente en {ip}",
                    cant_zonas=1,
                    user=request.user if request.user.is_authenticated else None
                )
                detalles = CamaraDetalles.objects.create(
                    camara=camara,
                    n_camara=1,
                    zona=zona,
                    ip=ip,
                    marca="IP Webcam",
                    resolucion=str(info.get("video_size", {}).get("width", "Desconocida"))
                )
                return Response({
                    "success": True,
                    "message": "Cámara registrada exitosamente",
                    "camara": {
                        "id": detalles.id,
                        "ip": detalles.ip,
                        "marca": detalles.marca,
                        "resolucion": detalles.resolucion,
                        "stream_url": f"{protocolo}://{ip}:{puerto}/video"
                    }
                }, status=status.HTTP_201_CREATED)
            else:
                return Response(
                    {"error": f"No se pudo conectar a la cámara. Código: {r.status_code}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        except requests.exceptions.Timeout:
            return Response(
                {"error": "Tiempo de espera agotado. Verifica la IP y que la cámara esté encendida."}, 
                status=status.HTTP_408_REQUEST_TIMEOUT
            )
        except requests.exceptions.ConnectionError:
            return Response(
                {"error": "No se pudo conectar a la cámara. Verifica la IP y el puerto."}, 
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            return Response(
                {"error": f"Error al registrar cámara: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class DetectarCamarasAPIView(APIView):
    
    def check_ip_webcam(self, ip):
        for protocol in ['http', 'https']:
            try:
                r = requests.get(f"{protocol}://{ip}:8080/status.json", timeout=0.5, verify=False)
                if r.status_code == 200:
                    info = r.json()
                    return {
                        'found': True,
                        'type': 'IP Webcam',
                        'ip': ip,
                        'protocol': protocol,
                        'info': info
                    }
            except Exception:
                continue
        return {'found': False}
    
    def check_rtsp_camera(self, ip):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.3)
            result = sock.connect_ex((ip, 554))
            sock.close()
            if result == 0:
                return {
                    'found': True,
                    'type': 'RTSP',
                    'ip': ip
                }
        except Exception:
            pass
        return {'found': False}
    
    def get(self, request):
        camaras_detectadas = []
        
        # Opción para probar una IP específica (parámetro query string)
        test_ip = request.query_params.get('ip', None)
        if test_ip:
            ip_list = [test_ip]
        else:
            base_ip = "192.168.0"
            ip_list = [f"{base_ip}.{i}" for i in range(2, 255)]
        with ThreadPoolExecutor(max_workers=50) as executor:
            future_to_ip = {}
            for ip in ip_list:
                future_to_ip[executor.submit(self.check_ip_webcam, ip)] = ip
                future_to_ip[executor.submit(self.check_rtsp_camera, ip)] = ip
            for future in as_completed(future_to_ip):
                result = future.result()
                if result['found']:
                    camara = Camara.objects.create(
                        cantidad=1,
                        lugar=f"Detectada en {result['ip']}",
                        cant_zonas=1,
                        user=request.user if request.user.is_authenticated else None
                    )
                    
                    if result['type'] == 'IP Webcam':
                        info = result.get('info', {})
                        detalles = CamaraDetalles.objects.create(
                            camara=camara,
                            n_camara=1,
                            zona="Desconocida",
                            ip=result['ip'],
                            marca="IP Webcam",
                            resolucion=str(info.get("video_size", {}).get("width", "Desconocida"))
                        )
                        camaras_detectadas.append({
                            "id": detalles.id,
                            "ip": detalles.ip,
                            "marca": detalles.marca,
                            "resolucion": detalles.resolucion,
                            "stream_url": f"http://{result['ip']}:8080/video"
                        })
                    
                    elif result['type'] == 'RTSP':
                        detalles = CamaraDetalles.objects.create(
                            camara=camara,
                            n_camara=1,
                            zona="Desconocida",
                            ip=result['ip'],
                            marca="RTSP Camera",
                            resolucion="Desconocida"
                        )
                        camaras_detectadas.append({
                            "id": detalles.id,
                            "ip": detalles.ip,
                            "marca": detalles.marca,
                            "resolucion": detalles.resolucion,
                            "stream_url": f"rtsp://{result['ip']}:554/"
                        })

        return Response(camaras_detectadas)
