# ai_detection/ml/camera_manager.py

from .camara_processor import CameraProcessor


class CameraManager:
    """Gestor global que corre continuamente"""
    
    def __init__(self):
        self.processors = {}  # {camera_id: CameraProcessor}
    
    def start_camera(self, camera_id, camera_type, camera_ip):
        """
        Inicia una cámara que corre INFINITAMENTE
        hasta que llames stop_camera()
        """
        if camera_id in self.processors:
            return  # Ya está corriendo
        print(f"Iniciando camara {camera_id} de tipo {camera_type} con la ip: {camera_ip}")
        processor = CameraProcessor(camera_id, camera_type, camera_ip)
        print(f"Se inicailizo la camara com CameraProcessor")
        try:
            processor.start()  # ← puede fallar
            self.processors[camera_id] = processor
        except Exception as e:
            print(f"❌ Error iniciando cámara {camera_id}: {e}")
            print("⏭ Saltando a la siguiente cámara…")
    
    def stop_camera(self, camera_id):
        """Detiene una cámara específica"""
        if camera_id in self.processors:
            self.processors[camera_id].stop()
            del self.processors[camera_id]
    
    def get_active_cameras(self):
        """Lista de cámaras activas"""
        return list(self.processors.keys())


# Singleton global
camera_manager = CameraManager()