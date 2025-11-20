import cv2
import collections
import time

# Configuración
BUFFER_SECONDS = 150  # 2.5 minutos
FPS = 20                 # frames por segundo
WIDTH, HEIGHT = 640, 480

# Número máximo de frames a mantener en buffer
max_frames = BUFFER_SECONDS * FPS
frame_buffer = collections.deque(maxlen=max_frames)

# Abrir cámara (0 = webcam, o URL RTSP)
cap = cv2.VideoCapture(0)

# Variable para guardar video después de la alerta
recording = False
record_frames_remaining = FPS * 3 * 60  # 3 minutos

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Redimensionar si quieres
    frame = cv2.resize(frame, (WIDTH, HEIGHT))

    # Guardar frame en buffer
    frame_buffer.append(frame)

    # --- Simulación de alerta ---
    # Aquí iría tu detector de alerta
    alerta = False
    # ejemplo: alerta = detector.detecta_violencia(frame)
    if alerta and not recording:
        print("⚠️ Alerta detectada, grabando video...")
        recording = True
        # Crear video con los frames previos
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(f'alerta_{int(time.time())}.mp4', fourcc, FPS, (WIDTH, HEIGHT))
        # Guardar los frames del buffer primero
        for f in frame_buffer:
            out.write(f)

    # Si está grabando, guardar frame actual
    if recording:
        out.write(frame)
        record_frames_remaining -= 1
        if record_frames_remaining <= 0:
            recording = False
            out.release()
            print("✅ Video guardado.")
