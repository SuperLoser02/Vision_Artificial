# ai_detection/tasks.py

# from celery import shared_task

# @shared_task
# def process_alert_task(detection_id):
#     """
#     Procesa alerta en background (después de notificar).
#     No bloquea la detección.
#     """
#     from .models import DetectionEvent
    
#     detection = DetectionEvent.objects.get(id=detection_id)
    
#     # Enviar email (tarda 1-2 seg)
#     send_email_alert(detection)
    
#     # Consolidar video (tarda 30 seg)
#     if detection.video_file:
#         consolidate_video(detection)
    
#     # Generar reporte
#     generate_report(detection)
