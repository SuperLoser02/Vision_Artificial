"""
Script de prueba para verificar la configuración de Firebase
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'visual_safety.settings')
django.setup()

from notificaciones.utils import enviar_notificacion_fcm
from notificaciones.models import Notificacion
from perfil.models import Perfil

print("🔍 Verificando configuración de Firebase...\n")

# Verificar archivo de credenciales
cred_path = os.path.join(os.path.dirname(__file__), 'firebase-credentials.json')
if os.path.exists(cred_path):
    print(f"✅ Archivo de credenciales encontrado: {cred_path}")
else:
    print(f"❌ Archivo de credenciales NO encontrado: {cred_path}")
    sys.exit(1)

# Verificar Firebase Admin SDK
try:
    import firebase_admin
    print("✅ firebase-admin instalado correctamente")
    
    # Intentar inicializar
    if not firebase_admin._apps:
        from firebase_admin import credentials
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin SDK inicializado correctamente")
    else:
        print("✅ Firebase Admin SDK ya está inicializado")
        
except ImportError:
    print("❌ firebase-admin no está instalado")
    print("   Ejecuta: pip install firebase-admin")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error al inicializar Firebase: {str(e)}")
    sys.exit(1)

print("\n" + "="*50)
print("🎉 Firebase está configurado correctamente!")
print("="*50)
print("\n📝 Próximos pasos:")
print("1. Registrar dispositivos FCM desde la app Flutter")
print("2. Crear notificaciones desde el backend")
print("3. Las notificaciones llegarán automáticamente a los dispositivos")
