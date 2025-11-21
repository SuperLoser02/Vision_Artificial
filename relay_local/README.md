# Relay Local - Escáner de Cámaras en LAN

## 🎯 Descripción

El Relay Local es un servicio **ligero** que escanea la red local en busca de cámaras IP Webcam y RTSP.

**NO procesa video, NO ejecuta IA, NO graba videos.**

Solo detecta cámaras y envía sus IPs al backend, donde la IA se ejecuta normalmente.

## 🏗️ Arquitectura

```
Cámaras LAN (192.168.x.x)
    ↓
Relay Local (Docker) - SOLO ESCANEO
    ├─ Detecta IPs con puerto 8080 (IP Webcam)
    ├─ Detecta IPs con puerto 554 (RTSP)
    └─ POST /api/camaras/relay/camara-detectada/
        ↓
Backend DO (Django) - EJECUTA IA AQUÍ
    ├─ Recibe URL de streaming
    ├─ CameraProcessor (backend)
    ├─ ViolenceDetector (backend)
    ├─ VideoRecorder (backend)
    └─ Notificaciones (WebSocket + FCM)
```

## 🚀 Inicio Rápido

### 1. Construir y levantar el relay

```bash
cd relay_local
docker-compose -f docker-compose.relay.yml up -d --build
```

### 2. Verificar que está corriendo

```bash
curl http://localhost:7000/health
```

### 3. Iniciar escaneo de red

```bash
curl -X POST http://localhost:7000/scan
```

**Respuesta esperada:**

```json
{
  "status": "success",
  "relay_id": "relay-local-001",
  "cameras_found": 2,
  "cameras": [
    {
      "ip": "192.168.0.100",
      "puerto": 8080,
      "tipo": "IP Webcam",
      "stream_url": "http://192.168.0.100:8080/video"
    }
  ]
}
```

## 📋 Endpoints Disponibles

### `GET /`

Información básica del relay

### `GET /health`

Health check del servicio

### `GET /status`

Estado detallado (última exploración, cámaras encontradas)

### `POST /scan`

**PRINCIPAL:** Escanea la red local y envía cámaras al backend

## 🔧 Configuración

Editar `docker-compose.relay.yml`:

```yaml
environment:
  - BACKEND_URL=http://host.docker.internal:8000 # URL del backend
  - RELAY_ID=relay-local-001 # ID único
  - BASE_IP=192.168.0 # Red a escanear
  - SCAN_START=2 # IP inicial
  - SCAN_END=255 # IP final
```

## 🧪 Pruebas Locales

### 1. Backend corriendo

```bash
cd Vision_Artificial
docker-compose up -d
```

### 2. Levantar relay

```bash
cd relay_local
docker-compose -f docker-compose.relay.yml up -d
```

### 3. Escanear red

```bash
curl -X POST http://localhost:7000/scan
```

### 4. Ver logs

```bash
docker logs -f relay_local
```

**Salida esperada:**

```
🔍 INICIANDO ESCANEO DE RED LOCAL
Rango: 192.168.0.2-255
Backend: http://host.docker.internal:8000

📹 IP Webcam encontrada: 192.168.0.100:8080
✅ Cámara 192.168.0.100 enviada al backend

✅ ESCANEO COMPLETADO
Cámaras encontradas: 1
```

### 5. Verificar en backend

Las cámaras detectadas aparecen en:

- Logs del backend: `docker logs backend`
- Backend recibe las IPs y puede procesarlas con IA

## 🐛 Troubleshooting

### El relay no encuentra cámaras

**Solución:**

1. Verificar que las cámaras estén en la misma red (192.168.0.x)
2. Ajustar `BASE_IP`, `SCAN_START`, `SCAN_END` en docker-compose.yml
3. Probar manualmente: `curl http://192.168.0.100:8080/status.json`

### El relay no se conecta al backend

**Solución:**

1. Verificar que el backend esté corriendo: `docker ps`
2. Usar `host.docker.internal` en Windows/Mac Docker Desktop
3. En Linux, usar IP del host: `172.17.0.1` o nombre del contenedor

## 📊 Diferencias con Versión Anterior

| Aspecto           | ❌ Versión Anterior (incorrecta)          | ✅ Versión Nueva (correcta)     |
| ----------------- | ----------------------------------------- | ------------------------------- |
| **Función**       | Procesaba video y ejecutaba IA            | Solo escanea red y detecta IPs  |
| **Dependencias**  | PyTorch, OpenCV (pesadas)                 | Solo FastAPI, requests (ligero) |
| **Volúmenes**     | Montaba /backend/media, /ml_models        | NO monta nada del backend       |
| **Imports**       | Importaba detector, processor del backend | NO importa nada del backend     |
| **IA**            | Ejecutaba modelo ML en relay              | IA corre 100% en backend        |
| **Videos**        | Grababa videos                            | NO graba videos                 |
| **Tamaño imagen** | ~2GB (PyTorch + OpenCV)                   | ~200MB (Python + FastAPI)       |

## 🔐 Seguridad

- El relay NO expone puertos al exterior (solo localhost:7000)
- No almacena ni procesa datos sensibles
- Solo comunica IPs y puertos al backend

## 📝 Notas Importantes

- **El relay es opcional:** El backend puede seguir detectando cámaras por sí mismo
- **La IA corre en el backend:** El relay solo es un "buscador de cámaras"
- **No requiere GPU ni recursos pesados:** Es un escáner de red liviano
- **Backend procesa todo:** CameraProcessor, ViolenceDetector, VideoRecorder, Notificaciones

## 🚀 Próximos Pasos

1. **Autenticación:** Agregar token para endpoint `/api/camaras/relay/camara-detectada/`
2. **Auto-registro:** Backend puede registrar cámaras automáticamente cuando el relay las detecta
3. **Escaneo programado:** Agregar cron job para escanear periódicamente
4. **Notificaciones:** Alertar al usuario cuando se detectan nuevas cámaras
