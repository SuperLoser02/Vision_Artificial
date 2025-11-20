# ai_detection/ml/camera_processor.py

import cv2
import numpy as np
import time
from threading import Thread, Lock
from .detector import detector
from .video_recorder import VideoRecorder

class CameraProcessor:
    """
    Procesa una cámara individual.
    Captura frames, acumula en buffer y detecta violencia.
    """
    
    def __init__(self, camera_id, camera_type, camera_ip):
        self.camera_id = camera_id
        self.camera_type = camera_type
        self.camera_ip = camera_ip
        self.recorder = None
        
        self.cooldown_active = False
        self.cooldown_until = 0
        self.cooldown_seconds = 60 # 1 minuto
        
        # Construir stream URL
        if camera_type == "IP Webcam":
            self.stream_url = f"http://{camera_ip}:8080/video"
        elif camera_type == "RTSP":
            self.stream_url = f"rtsp://{camera_ip}:554/"
        else:
            raise ValueError(f"Tipo de cámara no soportado: {camera_type}")
        
        # Buffer de frames
        self.frame_buffer = []
        self.max_buffer_size = 16
        self.lock = Lock()
        
        # Control
        self.running = False
        self.thread = None
        self.cap = None
        
        # Resultado actual
        self.last_result = None
    
    def start(self):
        """Inicia el procesamiento"""
        if self.running:
            return
        
        # Conectar a cámara
        self.cap = cv2.VideoCapture(self.stream_url)
    
        if not self.cap.isOpened():
            print(f"No se pudo conectar a {self.stream_url}")
            raise ConnectionError(f"No se pudo conectar a {self.stream_url}")
        print(f"Conectado a {self.stream_url}")
        self.recorder = VideoRecorder(self.camera_id)
        self.running = True
        self.thread = Thread(target=self._process_loop, daemon=True)
        self.thread.start()
    
    def stop(self):
        """Detiene el procesamiento"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        if self.cap:
            self.cap.release()
        if hasattr(self, 'recorder') and self.recorder:
            self.recorder.cleanup()


    def _process_loop(self):
        """Loop INFINITO que procesa frames mientras la cámara esté activa"""

        while self.running:
            ret, frame = self.cap.read()

            # Si la cámara no entrega frame
            if not ret or frame is None:
                print("⚠️ Frame vacío o error de cámara, reintentando...")
                time.sleep(0.05)
                continue
            
            # ← NUEVO: Verificar si cooldown expiró
            if self.cooldown_active and time.time() >= self.cooldown_until:
                self.cooldown_active = False
                print(f"✅ Cooldown terminado - Cámara {self.camera_id}")
            
            try:
                self.recorder.add_frame(frame)
            except Exception as e:
                print(f"⚠️ Error al grabar frame en recorder: {e}")

            self._add_frame(frame)

            # Esperar hasta tener suficientes frames
            if len(self.frame_buffer) < self.max_buffer_size:
                continue
            
            result = self._detect()

            # Protección para evitar crashes
            if not result or not isinstance(result, dict):
                print("⚠️ _detect() devolvió None o formato inválido, saltando…")
                continue
            
            # ← MODIFICADO: Solo alertar si NO hay cooldown activo
            if result.get("is_alert", False) and not self.cooldown_active:

                # Websocket inmediatamente
                self._notify_websocket(result)

                # Guardar en BD
                detection_id = self._save_to_db(result)

                # ← NUEVO: Enviar notificaciones automáticas
                try:
                    self._enviar_notificacion_sistema(detection_id, result)
                except Exception as e:
                    print(f"⚠️ Error al enviar notificaciones: {e}")

                # Activar grabación especial BEFORE + AFTER
                try:
                    self.recorder.trigger_alert(
                        alert_type=result.get("class_name", "alerta"),
                        confidence=result.get("confidence", 0)
                    )
                except Exception as e:
                    print(f"⚠️ Error al activar grabación de alerta: {e}")

                # ← NUEVO: Activar cooldown de 1 minuto
                self.cooldown_active = True
                self.cooldown_until = time.time() + self.cooldown_seconds
                print(f"⏸️  Cooldown activado: 1 minuto - Cámara {self.camera_id}")

                # Si usas celery → habilitar:
                # process_alert_task.delay(detection_id)



    
    def _add_frame(self, frame):
        """Preprocesa y añade frame al buffer"""
        with self.lock:
            # Resize a 224x224
            frame_resized = cv2.resize(frame, (224, 224))
            
            # BGR → RGB
            frame_rgb = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2RGB)
            
            # Normalizar [0, 255] → [0, 1]
            frame_normalized = frame_rgb.astype(np.float32) / 255.0
            
            # Añadir al buffer
            self.frame_buffer.append(frame_normalized)
            
            # Mantener solo últimos 16
            if len(self.frame_buffer) > self.max_buffer_size:
                self.frame_buffer.pop(0)
    
    def _detect(self):
        with self.lock:

            # Si no hay frames
            if len(self.frame_buffer) == 0:
                return {
                    "is_alert": False,
                    "is_critical": False,
                    "class_id": -1,
                    "class_name": "no_frames",
                    "confidence": 0.0,
                    "probabilities": {},
                }

            # Si no hay 16 frames → rellenar duplicando el último
            if len(self.frame_buffer) < self.max_buffer_size:
                missing = self.max_buffer_size - len(self.frame_buffer)
                last_frame = self.frame_buffer[-1]
                self.frame_buffer += [last_frame] * missing

            # Convertir a numpy array
            frames_array = np.array(self.frame_buffer)

            # Modelo detecta
            result = detector.predict(frames_array)

            # Prevención si el modelo falla
            if result is None:
                return {
                    "is_alert": False,
                    "is_critical": False,
                    "class_id": -1,
                    "class_name": "model_error",
                    "confidence": 0.0,
                    "probabilities": {},
                }

            # Guardar último resultado
            self.last_result = result

            # Limpiar buffer
            self.frame_buffer = []

            return result


    
    def get_result(self):
        """Obtiene el último resultado"""
        return self.last_result
    
    def _notify_websocket(self, result):
        # ========== DEBUG: IMPRIME RESULTADOS ==========
        print("\n" + "="*60)
        print("🔍 DETECCIÓN REALIZADA")
        print("="*60)
        print(f"📹 Cámara ID: {self.camera_id}")
        print(f"📍 IP: {self.camera_ip}")
        print(f"📊 Clase Detectada: {result['class_name']} (ID: {result['class_id']})")
        print(f"💯 Confianza: {result['confidence']:.2%}")
        print(f"⚠️  Es Alerta: {result['is_alert']}")
        print(f"🚨 Es Crítico: {result['is_critical']}")
        print(f"\n📈 Probabilidades:")
        for clase, prob in result['probabilities'].items():
            bar = "█" * int(prob * 50)
            print(f"   {clase:15s} {prob:6.2%} {bar}")
        print("="*60 + "\n")
    #     """Envía alerta inmediata por WebSocket"""
    #     from channels.layers import get_channel_layer
    #     from asgiref.sync import async_to_sync
    #     from notificaciones.views import notify_alert
        
    #     channel_layer = get_channel_layer()
    #     async_to_sync(channel_layer.group_send)(
    #         'alerts',  # Grupo de WebSocket
    #         {
    #             'type': 'alert_message',
    #             'data': {
    #                 'camera_id': self.camera_id,
    #                 'detection': result['class_name'],
    #                 'confidence': result['confidence'],
    #                 'timestamp': time.time()
    #             }
    #         }
    #     )
    def _save_to_db(self, result):
        """Guarda evento de detección en la base de datos"""
        from .models import DetectionEvent
        from camaras.models import CamaraDetalles
        id_camara = CamaraDetalles.objects.get(id=self.camera_id)
        user = id_camara.camara.user
        detection = DetectionEvent.objects.create(
            camara_id=id_camara,
            tipo_alerta=result['class_name'],
            zona = id_camara.zona,
            user=user
        )
        
        return detection.id
    
    def _enviar_notificacion_sistema(self, detection_id, result):
        """
        Envía notificación automática al sistema cuando se detecta violencia.
        Filtra perfiles por zona y rol según puede_recibir_alerta().
        Funciona aunque zona sea None o datos sean fallback.
        """
        try:
            from notificaciones.models import Notificacion
            from perfil.models import Perfil
            from camaras.models import CamaraDetalles
            from django.utils import timezone
            
            # Obtener datos de cámara y zona
            try:
                camara_detalle = CamaraDetalles.objects.select_related('zona', 'camara').get(
                    id=self.camera_id
                )
                zona = camara_detalle.zona
                zona_id = zona.id if zona else None
                zona_nombre = zona.nombre if zona else "Sin zona"
            except Exception as e:
                print(f"⚠️ Error obteniendo datos de cámara: {e}")
                zona_id = None
                zona_nombre = "Sin zona"
            
            # Determinar nivel según criticidad
            event_type = result.get('event_type', 'AI Detection')
            if result.get('is_critical'):
                nivel_peligro = 'rojo'
                prioridad = 'alta'
                titulo = f"🚨 CRÍTICO: {result['class_name']} detectado"
            else:
                nivel_peligro = 'amarillo'
                prioridad = 'media'
                titulo = f"⚠️ ALERTA: {result['class_name']} detectado"
            
            # Filtrar perfiles que deben recibir esta alerta
            try:
                perfiles = Perfil.objects.filter(user_id__is_active=True).select_related('zona')
                perfiles_destinatarios = [
                    p for p in perfiles 
                    if p.puede_recibir_alerta(zona_id)
                ]
            except Exception as e:
                print(f"⚠️ Error filtrando perfiles: {e}")
                perfiles_destinatarios = []
            
            # Crear notificaciones para cada destinatario
            notificaciones_creadas = 0
            for perfil in perfiles_destinatarios:
                try:
                    Notificacion.objects.create(
                        perfil=perfil,
                        titulo=titulo,
                        mensaje=f"Detección en zona {zona_nombre}. Confianza: {result['confidence']:.0%}. Tipo: {event_type}",
                        tipo='violencia',
                        prioridad=prioridad,
                        nivel_peligro=nivel_peligro,
                        canal='push',
                        zona=zona_nombre,
                        camara_id=self.camera_id,
                        metadata={
                            'detection_id': detection_id,
                            'confidence': result['confidence'],
                            'class_id': result.get('class_id', 1),
                            'class_name': result['class_name'],
                            'probabilities': result.get('probabilities', {}),
                            'camera_ip': self.camera_ip,
                            'event_type': event_type,
                            'timestamp': timezone.now().isoformat()
                        }
                    )
                    notificaciones_creadas += 1
                except Exception as e:
                    print(f"⚠️ Error creando notificación para perfil {perfil.id}: {e}")
                    continue
            
            print(f"📢 Notificaciones enviadas: {notificaciones_creadas} destinatarios | Zona: {zona_nombre} | Evento: {event_type}")
        
        except Exception as e:
            print(f"❌ Error general en _enviar_notificacion_sistema: {str(e)}")
            import traceback
            traceback.print_exc()