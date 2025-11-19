from django.apps import AppConfig


# ia_detection/apps.py

class IaDetectionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ia_detection'
    
    # def ready(self):
    #     """Se ejecuta cuando Django arranca"""
    #     from .ml.camera_manager import camera_manager
    #     from .models import Camera
        
    #     # Esperar 5 segundos a que todo arranque
    #     import time
    #     time.sleep(5)
        
    #     # Iniciar todas las cámaras activas
    #     cameras = Camera.objects.filter(is_active=True, enable_detection=True)
        
    #     for camera in cameras:
    #         camera_manager.start_camera(
    #             camera_id=camera.id,
    #             camera_type=camera.camera_type,
    #             camera_ip=camera.ip
    #         )
    #         print(f"✅ Cámara {camera.name} iniciada automáticamente")