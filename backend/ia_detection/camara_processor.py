# ai_detection/ml/camera_processor.py

import cv2
import numpy as np
import time
from threading import Thread, Lock
from .detector import detector


class CameraProcessor:
    """
    Procesa una cámara individual.
    Captura frames, acumula en buffer y detecta violencia.
    """
    
    def __init__(self, camera_id, camera_type, camera_ip):
        self.camera_id = camera_id
        self.camera_type = camera_type
        self.camera_ip = camera_ip
        
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
            raise ConnectionError(f"No se pudo conectar a {self.stream_url}")
        
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
    
    def _process_loop(self):
        """Loop INFINITO (no se detiene solo)"""
        
        while self.running:  # ← Corre para siempre
            ret, frame = self.cap.read()
            
            self._add_frame(frame)
            
            if len(self.frame_buffer) >= 16:
                result = self._detect()
                
                if result['is_alert']:
                    # INMEDIATAMENTE enviar por WebSocket
                    self._notify_websocket(result)
                    
                    # Guardar en BD
                    detection_id = self._save_to_db(result)
                    
                    # Enviar a Celery (background)
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
        """Ejecuta detección sobre el buffer"""
        with self.lock:
            if len(self.frame_buffer) < self.max_buffer_size:
                return
            
            # Convertir a numpy array
            frames_array = np.array(self.frame_buffer)
            
            # Detectar
            result = detector.predict(frames_array)
            
            # Guardar resultado
            self.last_result = result
            
            # Limpiar buffer para siguiente detección
            self.frame_buffer = []
    
    def get_result(self):
        """Obtiene el último resultado"""
        return self.last_result
    
    # def _notify_websocket(self, result):
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
        
        detection = DetectionEvent.objects.create(
            camara_id=self.camera_id,
            tipo_alerta=result['class_name']
        )
        
        return detection.id