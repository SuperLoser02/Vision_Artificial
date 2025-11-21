import cv2
import time
from pathlib import Path
from collections import deque
from threading import Lock
import numpy as np
from camaras.models import CamaraDetalles, DetectionEvent


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
        self.segment_duration = 10
        self.before_seconds = 10
        self.after_seconds = 20
        self.fps = 16
        
        # Buffer circular de segmentos
        self.max_segments = int(self.before_seconds / self.segment_duration)
        self.segment_buffer = deque(maxlen=self.max_segments)
        
        # Segmento actual
        self.current_segment_writer = None
        self.current_segment_path = None
        self.current_segment_frames = 0
        self.frames_per_segment = self.segment_duration * self.fps
        
        # Estado de grabación post-alerta
        self.recording_alert = False
        self.alert_info = None
        self.before_segments = []
        self.after_segments = []
        self.after_frames_recorded = 0
        self.after_frames_needed = int(self.after_seconds * self.fps)
        
        # Dimensiones del video
        self.frame_width = None
        self.frame_height = None
        
        self.lock = Lock()
        
        print(f"✅ VideoRecorder creado para cámara {camera_id}")
        print(f"   Buffer: {self.max_segments} segmentos de {self.segment_duration}s")
    
    def add_frame(self, frame):
        """Añade un frame. Siempre está grabando en segmentos."""
        with self.lock:
            if self.frame_width is None:
                self.frame_height, self.frame_width = frame.shape[:2]
                self._create_new_segment()
            
            if self.current_segment_frames >= self.frames_per_segment:
                self._rotate_segment()
            
            if self.current_segment_writer:
                self.current_segment_writer.write(frame)
                self.current_segment_frames += 1
            
            if self.recording_alert:
                self.after_frames_recorded += 1
                if self.after_frames_recorded >= self.after_frames_needed:
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
        """Cierra el segmento actual y lo añade al buffer."""
        if self.current_segment_writer:
            self.current_segment_writer.release()
            self.current_segment_writer = None
        
        segment_info = {
            'path': self.current_segment_path,
            'frames': self.current_segment_frames,
            'timestamp': time.time()
        }
        
        if self.recording_alert:
            self.after_segments.append(segment_info)
            print(f"📹 Segmento post-alerta guardado: {self.current_segment_path.name}")
        else:
            if len(self.segment_buffer) == self.max_segments:
                oldest = self.segment_buffer[0]
                if oldest['path'].exists():
                    oldest['path'].unlink()
                    print(f"🗑️ Segmento antiguo eliminado: {oldest['path'].name}")
            
            self.segment_buffer.append(segment_info)
        
        self._create_new_segment()
    
    def trigger_alert(self, alert_type, confidence, detection_id=None):
        """Activa la grabación de alerta."""
        with self.lock:
            if self.recording_alert:
                print(f"⚠️ Ya hay una grabación en proceso")
                return
            
            print(f"\n🚨 TRIGGER ALERTA - Cámara {self.camera_id}")
            print(f"   Tipo: {alert_type}")
            print(f"   Confianza: {confidence:.2%}")
            print(f"   Detection ID: {detection_id}")
            print(f"   Segmentos previos: {len(self.segment_buffer)}")
            
            self.recording_alert = True
            self.alert_info = {
                'type': alert_type,
                'confidence': confidence,
                'timestamp': time.time(),
                'detection_id': detection_id  # Guardar el ID de detección
            }
            
            self.before_segments = [seg['path'] for seg in self.segment_buffer]
            self.after_segments = []
            self.after_frames_recorded = 0
            
            print(f"   Grabará próximos {self.after_seconds}s...")
    
    def _update_detection_event(self, video_path):
        """Actualiza el DetectionEvent con la ruta del video."""
        detection_id = self.alert_info.get('detection_id')
        if detection_id:
            try:
                detection = DetectionEvent.objects.get(id=detection_id)
                detection.video_file = str(video_path)
                detection.save()
                print(f"✅ DetectionEvent {detection_id} actualizado con video: {video_path}")
            except DetectionEvent.DoesNotExist:
                print(f"⚠️ DetectionEvent con id {detection_id} no encontrado")
            except Exception as e:
                print(f"❌ Error actualizando DetectionEvent: {e}")
        else:
            print("⚠️ No se proporcionó detection_id, video no asociado a DetectionEvent")
    
    def _consolidate_video(self):
        """Consolida todos los segmentos en un solo video final."""
        print(f"\n💾 Consolidando video de alerta...")
        
        if self.current_segment_writer:
            self.current_segment_writer.release()
            self.current_segment_writer = None
        
        if self.current_segment_path and self.current_segment_path.exists():
            self.after_segments.append({
                'path': self.current_segment_path,
                'frames': self.current_segment_frames,
                'timestamp': time.time()
            })
        
        timestamp_str = time.strftime('%Y%m%d_%H%M%S', 
                                      time.localtime(self.alert_info['timestamp']))
        alert_type_clean = self.alert_info['type'].replace(' ', '_')
        filename = f"cam{self.camera_id}_{alert_type_clean}_{timestamp_str}.mp4"
        output_path = self.output_dir / filename
        
        temp_output = self.output_dir / f"temp_final_{timestamp_str}.avi"
        fourcc = cv2.VideoWriter_fourcc(*'XVID')
        out = cv2.VideoWriter(
            str(temp_output),
            fourcc,
            self.fps,
            (self.frame_width, self.frame_height)
        )
        
        if not out.isOpened():
            print("❌ Error: No se pudo crear el VideoWriter")
            self._reset_state()
            return None
        
        total_frames = 0
        all_segment_paths = self.before_segments + [s['path'] for s in self.after_segments]
        
        print(f"   Before segments: {len(self.before_segments)}")
        print(f"   After segments: {len(self.after_segments)}")
        print(f"   Total: {len(all_segment_paths)} segmentos")
        
        for i, seg_path in enumerate(all_segment_paths):
            if not seg_path.exists():
                print(f"⚠️ Segmento no encontrado: {seg_path}")
                continue
            
            cap = cv2.VideoCapture(str(seg_path))
            if not cap.isOpened():
                print(f"⚠️ No se pudo abrir: {seg_path}")
                continue
            
            segment_frames = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                time_offset = (total_frames / self.fps) - self.before_seconds
                frame_with_overlay = self._add_overlay(frame, time_offset)
                out.write(frame_with_overlay)
                total_frames += 1
                segment_frames += 1
            
            cap.release()
            print(f"   ✓ Segmento {i+1}/{len(all_segment_paths)}: {segment_frames} frames")
        
        out.release()
        time.sleep(0.5)
        
        if temp_output.exists():
            temp_output.rename(output_path.with_suffix('.avi'))
            output_path = output_path.with_suffix('.avi')
        
        if output_path.exists():
            duration = total_frames / self.fps
            file_size = output_path.stat().st_size / (1024 * 1024)
            
            print(f"\n✅ Video consolidado:")
            print(f"   Archivo: {output_path.name}")
            print(f"   Duración: {duration:.1f}s ({duration/60:.1f} min)")
            print(f"   Frames: {total_frames}")
            print(f"   Tamaño: {file_size:.1f} MB")
            
            # Actualizar el DetectionEvent con la ruta del video
            self._update_detection_event(output_path)
        else:
            print(f"❌ Error: El archivo no se creó correctamente")
        
        self._cleanup_all_temp_files(all_segment_paths)
        self._reset_state()
        self._create_new_segment()
        
        return str(output_path) if output_path.exists() else None
    
    def _cleanup_all_temp_files(self, used_paths):
        """Elimina todos los archivos temporales que se usaron."""
        print("🧹 Eliminando archivos temporales...")
        
        for seg_path in used_paths:
            if seg_path and seg_path.exists():
                try:
                    seg_path.unlink()
                    print(f"   🗑️ Eliminado: {seg_path.name}")
                except Exception as e:
                    print(f"   ❌ Error eliminando {seg_path.name}: {e}")
    
    def _reset_state(self):
        """Resetea el estado después de consolidar."""
        self.recording_alert = False
        self.alert_info = None
        self.before_segments = []
        self.after_segments = []
        self.after_frames_recorded = 0
        self.segment_buffer.clear()
    
    def _add_overlay(self, frame, time_offset):
        """Añade overlay con información al frame"""
        if self.alert_info is None:
            return frame

        frame_copy = frame.copy()
        
        if time_offset < 0:
            label = f"ANTES: {abs(time_offset):.1f}s"
            color = (255, 255, 0)
        elif abs(time_offset) < 0.5:
            label = f"ALERTA: {self.alert_info['type']}"
            color = (0, 0, 255)
        else:
            label = f"DESPUES: +{time_offset:.1f}s"
            color = (0, 255, 255)
        
        overlay = frame_copy.copy()
        cv2.rectangle(overlay, (5, 5), (400, 100), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.3, frame_copy, 0.7, 0, frame_copy)
        
        cv2.putText(frame_copy, label, (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        cv2.putText(frame_copy, f"Camara {self.camera_id}", (10, 60),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        cv2.putText(frame_copy, f"Conf: {self.alert_info['confidence']:.1%}", (10, 85),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
        
        return frame_copy
    
    def cleanup(self):
        """Limpieza al cerrar el recorder."""
        with self.lock:
            if self.current_segment_writer:
                self.current_segment_writer.release()
            
            for seg in self.segment_buffer:
                if seg['path'].exists():
                    seg['path'].unlink()