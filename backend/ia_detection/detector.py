# ai_detection/ml/detector.py

import torch
import torch.nn as nn
import numpy as np
from pathlib import Path
from visual_safety.settings import BASE_DIR


class ViolenceDetector:
    """
    Wrapper del modelo de detección de violencia.
    Singleton: solo una instancia en memoria.
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self.device = torch.device('cpu')  # Solo CPU
        self.model = None
        self.class_names = {
            0: 'No Violence',
            1: 'Violence',
            2: 'Weaponized'
        }
        self.confidence_threshold =  0.6  # Umbral de confianza para alertas
        
        self._load_model()
        self._initialized = True
    
    def _load_model(self):
        """Carga el modelo entrenado"""
        model_path = Path(BASE_DIR) / 'ml_models' / 'best_model.pth'
        
        if not model_path.exists():
            raise FileNotFoundError(f"Modelo no encontrado: {model_path}")
        
        # Importar arquitectura del modelo
        from ml_models.train_model import VideoClassifier
        
        self.model = VideoClassifier(num_classes=3)
        checkpoint = torch.load(str(model_path), map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model.to(self.device)
        self.model.eval()
        
        print(f"✅ Modelo cargado: {model_path}")
    
    @torch.no_grad()
    def predict(self, frames):
        """
        Predice violencia en secuencia de frames.
        
        Args:
            frames: numpy array [16, 224, 224, 3] normalizado [0, 1]
        
        Returns:
            dict con resultado
        """
        # Convertir a tensor: [16, 224, 224, 3] → [1, 16, 3, 224, 224]
        frames_tensor = torch.from_numpy(frames).permute(0, 3, 1, 2).unsqueeze(0)
        frames_tensor = frames_tensor.to(self.device)
        
        # Inferencia
        outputs = self.model(frames_tensor)
        probabilities = torch.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, 1)
        
        predicted_class = predicted.item()
        confidence_value = confidence.item()
        all_probs = probabilities[0].cpu().numpy()
        
        result = {
            'class_id': predicted_class,
            'class_name': self.class_names[predicted_class],
            'confidence': float(confidence_value),
            'probabilities': {
                self.class_names[i]: float(prob) 
                for i, prob in enumerate(all_probs)
            },
            'is_alert': predicted_class > 0 and confidence_value > self.confidence_threshold,
            'is_critical': predicted_class == 2
        }
        
        return result


# Instancia global singleton
detector = ViolenceDetector()