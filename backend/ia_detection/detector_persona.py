# # ai_detection/ml/people_detector.py

# from ultralytics import YOLO
# import numpy as np
# from threading import Lock


# class PeopleDetector:
#     """
#     Detector de personas usando YOLOv8.
#     Singleton: solo una instancia en memoria.
#     """
    
#     _instance = None
#     _lock = Lock()
    
#     def __new__(cls):
#         if cls._instance is None:
#             with cls._lock:
#                 if cls._instance is None:
#                     cls._instance = super().__new__(cls)
#                     cls._instance._initialized = False
#         return cls._instance
    
#     def __init__(self):
#         if self._initialized:
#             return
        
#         # Cargar modelo YOLOv8
#         self.model = YOLO('yolov8n.pt')  # Nano = más rápido
#         self.model.to('cpu')  # Forzar CPU
        
#         # Clase "person" en COCO dataset = 0
#         self.person_class_id = 0
        
#         self._initialized = True
#         print("✅ YOLOv8 PeopleDetector cargado")
    
#     def detect(self, frame):
#         """
#         Detecta personas en un frame.
        
#         Args:
#             frame: numpy array BGR [H, W, 3]
        
#         Returns:
#             dict con resultados
#         """
#         # YOLOv8 inferencia
#         results = self.model(frame, verbose=False)[0]
        
#         # Filtrar solo personas (clase 0)
#         people = []
#         for box in results.boxes:
#             class_id = int(box.cls[0])
            
#             if class_id == self.person_class_id:
#                 confidence = float(box.conf[0])
                
#                 # Bounding box [x1, y1, x2, y2]
#                 bbox = box.xyxy[0].cpu().numpy().astype(int).tolist()
                
#                 people.append({
#                     'bbox': bbox,  # [x1, y1, x2, y2]
#                     'confidence': confidence
#                 })
        
#         return {
#             'count': len(people),
#             'people': people,
#             'frame_shape': frame.shape[:2]  # (height, width)
#         }


# # Singleton global
# people_detector = PeopleDetector()