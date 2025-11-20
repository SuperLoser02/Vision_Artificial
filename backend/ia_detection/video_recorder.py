# ai_detection/ml/video_recorder.py

import cv2
import time
from pathlib import Path
from collections import deque
from threading import Lock
import numpy as np
from camaras.models import CamaraDetalles


class VideoRecorder:
    """
    Sistema de grabación con buffer circular.
    Graba continuamente en segmentos y consolida al detectar alerta.
    """
    
    def __init__(self, camera_id, output_dir='media'):
        self.user = CamaraDetalles.objects.get(id=camera_id).camara.user
        self.camera_id = camera_id
        if not self.user:
            self.output_dir = Path(output_dir, "user_tester")
        else:
            self.output_dir = Path(output_dir, f"user_{self.user.id}_{self.user.username}")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Configuración
        self.segment_duration = 10  # Cada segmento dura 30 segundos
        self.before_seconds = 10  # 2.5 minutos antes (150 segundos)
        self.after_seconds = 20    # 2.5 minutos después (150 segundos)
        self.fps = 16               # FPS del video de salida
        
        # Buffer circular de segmentos (archivos temporales)
        self.max_segments = int(self.before_seconds / self.segment_duration)  # 5 segmentos
        self.segment_buffer = deque(maxlen=self.max_segments)
        
        # Segmento actual
        self.current_segment_writer = None
        self.current_segment_path = None
        self.current_segment_frames = 0
        self.frames_per_segment = self.segment_duration * self.fps  # 750 frames
        
        # Estado de grabación post-alerta
        self.recording_alert = False
        self.alert_info = None
        self.after_segments = []
        self.after_frames_needed = int(self.after_seconds * self.fps)  # 3750 frames
        
        # Dimensiones del video
        self.frame_width = None
        self.frame_height = None
        
        self.lock = Lock()
        
        print(f"✅ VideoRecorder creado para cámara {camera_id}")
        print(f"   Buffer: {self.max_segments} segmentos de {self.segment_duration}s")
    
    def add_frame(self, frame):
        """
        Añade un frame. Siempre está grabando en segmentos.
        """
        with self.lock:
            # Inicializar dimensiones
            if self.frame_width is None:
                self.frame_height, self.frame_width = frame.shape[:2]
                self._create_new_segment()
            
            # Si llegamos al límite del segmento, crear uno nuevo
            if self.current_segment_frames >= self.frames_per_segment:
                self._rotate_segment()
            
            # Escribir frame al segmento actual
            if self.current_segment_writer:
                self.current_segment_writer.write(frame)
                self.current_segment_frames += 1
            
            # Si estamos grabando post-alerta, contar frames
            if self.recording_alert:
                self.after_frames_needed -= 1
                
                # Si completamos los frames post-alerta, consolidar
                if self.after_frames_needed <= 0:
                    self._consolidate_video()
    
    def _create_new_segment(self):
        """Crea un nuevo segmento de video"""
        timestamp = int(time.time() * 1000)
        segment_path = self.output_dir / f"temp_cam{self.camera_id}_{timestamp}.avi"
        
        fourcc = cv2.VideoWriter_fourcc(*'XVID')
        writer = cv2.VideoWriter(
            str(segment_path),
            fourcc,
            self.fps,
            (self.frame_width, self.frame_height)
        )
        
        self.current_segment_writer = writer
        self.current_segment_path = segment_path
        self.current_segment_frames = 0
        
        print(f"📹 Nuevo segmento: {segment_path.name}")
    
    def _rotate_segment(self):
        """
        Cierra el segmento actual y lo añade al buffer.
        Si el buffer está lleno, elimina el más antiguo.
        """
        # Cerrar writer actual
        if self.current_segment_writer:
            self.current_segment_writer.release()
        
        # Añadir al buffer
        self.segment_buffer.append({
            'path': self.current_segment_path,
            'frames': self.current_segment_frames,
            'timestamp': time.time()
        })
        
        # Si estamos grabando alerta, también guardar en lista de "después"
        if self.recording_alert:
            self.after_segments.append(self.current_segment_path)
        
        # Si el buffer está lleno, eliminar el más antiguo
        if len(self.segment_buffer) > self.max_segments:
            old_segment = self.segment_buffer.popleft()
            if old_segment['path'].exists() and not self.recording_alert:
                old_segment['path'].unlink()
                print(f"🗑️  Segmento antiguo eliminado: {old_segment['path'].name}")
        
        # Crear nuevo segmento
        self._create_new_segment()
    
    def trigger_alert(self, alert_type, confidence):
        """
        Activa la grabación de alerta.
        Guarda los segmentos del buffer (antes) + próximos segmentos (después).
        """
        with self.lock:
            if self.recording_alert:
                print(f"⚠️  Ya hay una grabación en proceso")
                return
            
            print(f"\n🚨 TRIGGER ALERTA - Cámara {self.camera_id}")
            print(f"   Tipo: {alert_type}")
            print(f"   Confianza: {confidence:.2%}")
            print(f"   Segmentos previos: {len(self.segment_buffer)}")
            
            self.recording_alert = True
            self.alert_info = {
                'type': alert_type,
                'confidence': confidence,
                'timestamp': time.time()
            }
            
            # Los segmentos "antes" son los del buffer actual
            self.before_segments = [seg['path'] for seg in self.segment_buffer]
            self.after_segments = []
            self.after_frames_needed = self.after_seconds * self.fps
            
            print(f"   Grabará próximos {self.after_seconds}s...")
    
    def _consolidate_video(self):
        """
        Consolida todos los segmentos en un solo video final.
        """
        print(f"\n💾 Consolidando video de alerta...")
        
        # Cerrar writer actual
        if self.current_segment_writer:
            self.current_segment_writer.release()
            self.current_segment_writer = None
        
        # Nombre del archivo final
        timestamp_str = time.strftime('%Y%m%d_%H%M%S', time.localtime(self.alert_info['timestamp']))
        alert_type_clean = self.alert_info['type'].replace(' ', '_')
        filename = f"cam{self.camera_id}_{alert_type_clean}_{timestamp_str}.mp4"
        output_path = self.output_dir / filename
        
        # Crear video final
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(
            str(output_path),
            fourcc,
            self.fps,
            (self.frame_width, self.frame_height)
        )
        
        total_frames = 0
        all_segments = self.before_segments + self.after_segments
        
        print(f"   Consolidando {len(all_segments)} segmentos...")
        
        # Procesar cada segmento
        for i, seg_path in enumerate(all_segments):
            if not seg_path.exists():
                print(f"⚠️  Segmento no encontrado: {seg_path}")
                continue
            
            cap = cv2.VideoCapture(str(seg_path))
            segment_frames = 0
            
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Calcular tiempo relativo al momento de la alerta
                time_offset = (total_frames / self.fps) - self.before_seconds
                
                # Añadir overlay con información
                frame_with_overlay = self._add_overlay(frame, time_offset)
                
                out.write(frame_with_overlay)
                total_frames += 1
                segment_frames += 1
            
            cap.release()
            print(f"   ✓ Segmento {i+1}/{len(all_segments)}: {segment_frames} frames")
        
        out.release()
        
        # Estadísticas
        duration = total_frames / self.fps
        file_size = output_path.stat().st_size / (1024 * 1024)
        
        print(f"\n✅ Video consolidado:")
        print(f"   Archivo: {filename}")
        print(f"   Duración: {duration:.1f}s ({duration/60:.1f} min)")
        print(f"   Frames: {total_frames}")
        print(f"   Tamaño: {file_size:.1f} MB")
        print(f"   Ruta: {output_path}")
        
        # Limpiar segmentos temporales
        self._cleanup_temp_segments()
        
        # Reset
        self.recording_alert = False
        self.alert_info = None
        self.before_segments = []
        self.after_segments = []
        
        # Recrear writer para continuar grabando
        self._create_new_segment()
        
        return str(output_path)
    
    def _add_overlay(self, frame, time_offset):
        """Añade overlay con información al frame"""
        frame_copy = frame.copy()
        
        # Determinar color y texto según el momento
        if time_offset < 0:
            label = f"ANTES: {abs(time_offset):.1f}s"
            color = (255, 255, 0)  # Cyan
        elif abs(time_offset) < 0.5:
            label = f"ALERTA: {self.alert_info['type']}"
            color = (0, 0, 255)  # Rojo
        else:
            label = f"DESPUES: +{time_offset:.1f}s"
            color = (0, 255, 255)  # Amarillo
        
        # Fondo semi-transparente
        overlay = frame_copy.copy()
        cv2.rectangle(overlay, (5, 5), (400, 100), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.3, frame_copy, 0.7, 0, frame_copy)
        
        # Textos
        cv2.putText(frame_copy, label, (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        cv2.putText(frame_copy, f"Camara {self.camera_id}", (10, 60),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        cv2.putText(frame_copy, f"Conf: {self.alert_info['confidence']:.1%}", (10, 85),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        
        return frame_copy
    
    def _cleanup_temp_segments(self, segments):
        """Elimina todos los archivos temporales que ya no sirven."""
        print("🧹 Eliminando archivos temp no necesarios...")

        # Borrar segmentos previos (solo queda 1 por el buffer)
        for segment_path in list(self.segment_buffer):
            if segment_path.exists():
                try:
                    segment_path.unlink()
                    print(f"   🗑️ Eliminado previo: {segment_path.name}")
                except:
                    print(f"   ❌ No se pudo eliminar: {segment_path.name}")

        # Borrar segmentos posteriores
        for segment_path in self.after_segments:
            if segment_path.exists():
                try:
                    segment_path.unlink()
                    print(f"   🗑️ Eliminado post: {segment_path.name}")
                except:
                    print(f"   ❌ No se pudo eliminar: {segment_path.name}")

        # Vaciar los buffers
        self.segment_buffer.clear()
        self.after_segments.clear()
    def cleanup(self):
        """Limpia todo al detener la cámara"""
        if self.current_segment_writer:
            self.current_segment_writer.release()
        
        # Eliminar segmentos temporales
        for seg in self.segment_buffer:
            if seg['path'].exists():
                seg['path'].unlink()