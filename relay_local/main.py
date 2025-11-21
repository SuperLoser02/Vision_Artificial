"""
Relay Local - Escáner de cámaras en LAN
Solo detecta cámaras IP y RTSP, NO procesa video ni ejecuta IA
"""
import os
import socket
import requests
from datetime import datetime
from fastapi import FastAPI, HTTPException
from concurrent.futures import ThreadPoolExecutor, as_completed
import uvicorn

app = FastAPI(title="Relay Local - Camera Scanner", version="2.0.0")

# Configuración desde variables de entorno
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8000')
RELAY_ID = os.getenv('RELAY_ID', 'relay-local-001')
BASE_IP = os.getenv('BASE_IP', '192.168.0')  # Base de red local
SCAN_START = int(os.getenv('SCAN_START', '2'))
SCAN_END = int(os.getenv('SCAN_END', '255'))

# Estado del relay
relay_state = {
    'status': 'initialized',
    'last_scan': None,
    'cameras_found': 0,
    'backend_url': BACKEND_URL,
    'relay_id': RELAY_ID,
    'scan_range': f"{BASE_IP}.{SCAN_START}-{SCAN_END}"
}


@app.get("/")
async def root():
    """Información del relay"""
    return {
        "service": "Relay Local - Camera Scanner",
        "version": "2.0.0",
        "description": "Escanea red LAN y detecta cámaras IP/RTSP",
        "status": relay_state['status'],
        "backend_url": BACKEND_URL,
        "relay_id": RELAY_ID,
        "scan_range": relay_state['scan_range']
    }


@app.get("/health")
async def health_check():
    """Health check del relay"""
    return {
        "status": "healthy",
        "relay_id": RELAY_ID,
        "last_scan": relay_state['last_scan'],
        "cameras_found": relay_state['cameras_found']
    }


@app.get("/status")
async def get_status():
    """Estado detallado del relay"""
    return relay_state


@app.post("/verify-and-register")
async def verify_and_register_camera(ip: str, puerto: int, protocolo: str, user_id: int, zona_id: int = None, lugar: str = None):
    """
    Verifica que una cámara sea accesible y la registra en el backend.
    
    Parámetros:
    - ip: IP de la cámara
    - puerto: Puerto de la cámara
    - protocolo: "HTTP" o "RTSP"
    - user_id: ID del usuario propietario
    - zona_id: (opcional) ID de la zona
    - lugar: (opcional) Descripción del lugar
    """
    try:
        # Verificar accesibilidad según protocolo
        accesible = False
        tipo = None
        
        if protocolo.upper() == "HTTP":
            try:
                response = requests.get(f"http://{ip}:{puerto}/status.json", timeout=3)
                if response.status_code == 200:
                    accesible = True
                    tipo = "IP Webcam"
            except:
                try:
                    response = requests.get(f"http://{ip}:{puerto}/", timeout=3)
                    if response.status_code == 200:
                        accesible = True
                        tipo = "HTTP Camera"
                except:
                    pass
        
        elif protocolo.upper() == "RTSP":
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(3)
                result = sock.connect_ex((ip, puerto))
                sock.close()
                if result == 0:
                    accesible = True
                    tipo = "RTSP"
            except:
                pass
        
        if not accesible:
            return {
                "status": "error",
                "message": f"No se pudo acceder a la cámara en {ip}:{puerto}",
                "accessible": False
            }
        
        # Registrar en el backend
        payload = {
            "relay_id": RELAY_ID,
            "ip": ip,
            "puerto": puerto,
            "tipo": tipo,
            "marca": tipo,
            "user_id": user_id
        }
        
        if zona_id:
            payload["zona_id"] = zona_id
        if lugar:
            payload["lugar"] = lugar
        
        response = requests.post(
            f"{BACKEND_URL}/api/relay/registrar/",
            json=payload,
            timeout=5
        )
        
        if response.status_code in [200, 201]:
            return {
                "status": "success",
                "message": "Cámara verificada y registrada exitosamente",
                "accessible": True,
                "backend_response": response.json()
            }
        else:
            return {
                "status": "error",
                "message": "Cámara accesible pero error al registrar en backend",
                "accessible": True,
                "backend_error": response.text
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/scan")
async def scan_cameras():
    """
    Escanea la red local en busca de cámaras IP Webcam y RTSP.
    Envía cada cámara detectada al backend.
    """
    try:
        print(f"\n{'='*60}")
        print("🔍 INICIANDO ESCANEO DE RED LOCAL")
        print(f"{'='*60}")
        print(f"Rango: {BASE_IP}.{SCAN_START}-{SCAN_END}")
        print(f"Backend: {BACKEND_URL}")
        print(f"{'='*60}\n")
        
        relay_state['status'] = 'scanning'
        cameras_found = []
        
        # Generar lista de IPs a escanear
        ip_list = [f"{BASE_IP}.{i}" for i in range(SCAN_START, SCAN_END + 1)]
        
        # Escanear en paralelo
        with ThreadPoolExecutor(max_workers=50) as executor:
            # Escanear IP Webcam (puerto 8080)
            futures_ipwebcam = {
                executor.submit(_check_ip_webcam, ip): ip 
                for ip in ip_list
            }
            
            # Escanear RTSP (puerto 554)
            futures_rtsp = {
                executor.submit(_check_rtsp, ip): ip 
                for ip in ip_list
            }
            
            # Procesar resultados de IP Webcam
            for future in as_completed(futures_ipwebcam):
                result = future.result()
                if result:
                    cameras_found.append(result)
                    _send_camera_to_backend(result)
            
            # Procesar resultados de RTSP
            for future in as_completed(futures_rtsp):
                result = future.result()
                if result:
                    cameras_found.append(result)
                    _send_camera_to_backend(result)
        
        relay_state['status'] = 'idle'
        relay_state['last_scan'] = datetime.now().isoformat()
        relay_state['cameras_found'] = len(cameras_found)
        
        print(f"\n{'='*60}")
        print(f"✅ ESCANEO COMPLETADO")
        print(f"{'='*60}")
        print(f"Cámaras encontradas: {len(cameras_found)}")
        print(f"{'='*60}\n")
        
        return {
            "status": "success",
            "relay_id": RELAY_ID,
            "cameras_found": len(cameras_found),
            "cameras": cameras_found
        }
        
    except Exception as e:
        print(f"❌ Error en escaneo: {str(e)}")
        relay_state['status'] = 'error'
        raise HTTPException(status_code=500, detail=str(e))


def _check_ip_webcam(ip: str) -> dict:
    """Verifica si hay una cámara IP Webcam en la IP dada"""
    try:
        # Intentar acceder al endpoint /status.json de IP Webcam
        response = requests.get(
            f"http://{ip}:8080/status.json",
            timeout=2
        )
        
        if response.status_code == 200:
            print(f"📹 IP Webcam encontrada: {ip}:8080")
            return {
                "ip": ip,
                "puerto": 8080,
                "tipo": "IP Webcam",
                "marca": "IP Webcam",
                "accesible": True,
                "stream_url": f"http://{ip}:8080/video"
            }
    except:
        pass
    
    return None


def _check_rtsp(ip: str) -> dict:
    """Verifica si hay un servidor RTSP en la IP dada"""
    try:
        # Intentar conexión TCP al puerto 554 (RTSP)
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex((ip, 554))
        sock.close()
        
        if result == 0:
            print(f"📹 RTSP encontrado: {ip}:554")
            return {
                "ip": ip,
                "puerto": 554,
                "tipo": "RTSP",
                "marca": "RTSP Camera",
                "accesible": True,
                "stream_url": f"rtsp://{ip}:554/"
            }
    except:
        pass
    
    return None


def _send_camera_to_backend(camera_info: dict):
    """Envía información de cámara detectada al backend"""
    try:
        payload = {
            "relay_id": RELAY_ID,
            "ip": camera_info["ip"],
            "puerto": camera_info["puerto"],
            "tipo": camera_info["tipo"],
            "marca": camera_info["marca"],
            "metadata": {
                "stream_url": camera_info["stream_url"],
                "accessible": camera_info["accesible"]
            }
        }
        
        response = requests.post(
            f"{BACKEND_URL}/api/relay/camara-detectada/",
            json=payload,
            timeout=5
        )
        
        if response.status_code in [200, 201]:
            print(f"✅ Cámara {camera_info['ip']} enviada al backend")
        else:
            print(f"⚠️  Error enviando cámara al backend: {response.status_code}")
            
    except Exception as e:
        print(f"⚠️  Error comunicando con backend: {str(e)}")


if __name__ == "__main__":
    print(f"\n{'='*60}")
    print("🚀 RELAY LOCAL - INICIANDO SERVICIO")
    print(f"{'='*60}")
    print(f"Modo: Escáner de cámaras (NO ejecuta IA)")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Relay ID: {RELAY_ID}")
    print(f"Rango de escaneo: {BASE_IP}.{SCAN_START}-{SCAN_END}")
    print(f"Puerto: 7000")
    print(f"{'='*60}\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=7000,
        log_level="info"
    )
