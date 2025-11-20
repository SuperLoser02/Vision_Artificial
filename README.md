# 🔐 Visual Safety - Sistema de Detección de Violencia y Armas

Sistema inteligente de seguridad que utiliza visión artificial y deep learning para detectar violencia y armas en espacios públicos mediante cámaras IP/RTSP en tiempo real.

## 🚀 Instrucciones para Correr el Proyecto

### Paso 1: Levantar Backend con Docker
```bash
docker compose up --build
```

### Paso 2: Instalar Dependencias del Frontend
```bash
cd .\frontend\
npm install
```

### Paso 3: Ejecutar Aplicación Electron
```bash
npm run electron:dev
```

¡Listo! 🎉

---

## 📊 Diagrama de Base de Datos

El sistema utiliza PostgreSQL con las siguientes tablas y relaciones:

```plantuml
@startuml Visual_Safety_Database

!define TABLE(x) class x << (T,#FFAAAA) >>
!define PK(x) <b><color:red>PK:</color> x</b>
!define FK(x) <color:blue>FK:</color> x
!define UNIQUE(x) <color:green>UQ:</color> x

skinparam classAttributeIconSize 0
skinparam linetype ortho

' ============================================
' TABLA DE DJANGO (Sistema de Autenticación)
' ============================================

TABLE(user) {
  PK(id) : BigInteger
  --
  username : VARCHAR(150) UNIQUE
  first_name : VARCHAR(150)
  last_name : VARCHAR(150)
  email : VARCHAR(254)
  password : VARCHAR(128)
  is_superuser : Boolean
  is_staff : Boolean
  is_active : Boolean
  date_joined : DateTime
  last_login : DateTime
}

TABLE(token) {
  PK(key) : VARCHAR(40)
  --
  FK(user_id) : BigInteger
  created : DateTime
}

' ============================================
' MÓDULO: PERFIL (Gestión de Usuarios)
' ============================================

TABLE(perfil) {
  PK(id) : BigInteger
  --
  FK(user_id) : BigInteger
  UNIQUE(ci) : VARCHAR(10)
  UNIQUE(email) : VARCHAR(254)
  nombre : VARCHAR(100)
  apellido : VARCHAR(100)
  contraseña : VARCHAR(255)
  telefono : VARCHAR(15)
  direccion : TEXT
  fecha_nacimiento : Date
  fecha_creacion : Date
  --
  <i>Sistema de Notificaciones</i>
  rol : VARCHAR(20)
  zonas_asignadas : JSON
  nivel_severidad_minimo : VARCHAR(10)
}

TABLE(categoria) {
  PK(id) : BigInteger
  --
  UNIQUE(nombre) : VARCHAR(100)
  descripcion : TEXT
  fecha_creacion : Date
}

TABLE(perfil_categoria) {
  PK(id) : BigInteger
  --
  FK(perfil_id) : BigInteger
  FK(categoria_id) : BigInteger
  fecha_hora_inicio : DateTime
  fecha_hora_fin : DateTime
}

TABLE(sesion_del_perfil) {
  PK(id) : BigInteger
  --
  FK(perfil_id) : BigInteger
  UNIQUE(token) : VARCHAR(255)
  ultima_actividad : DateTime
  is_active : Boolean
}

TABLE(vinculacion_dispositivo) {
  PK(id) : BigInteger
  --
  FK(perfil_id) : BigInteger
  UNIQUE(token) : VARCHAR(64)
  dispositivo_id : VARCHAR(128)
  fecha_creacion : DateTime
  fecha_expiracion : DateTime
  usado : Boolean
}

' ============================================
' MÓDULO: SUSCRIPCIÓN (Planes y Pagos)
' ============================================

TABLE(plan) {
  PK(id) : BigInteger
  --
  nombre : VARCHAR(100)
  descripcion : TEXT
  precio : Decimal(10,2)
  duracion_meses : Integer
  fecha_creacion : Date
}

TABLE(suscripcion) {
  PK(id) : BigInteger
  --
  FK(user_id) : BigInteger
  FK(plan_id) : BigInteger
  fecha_inicio : Date
  fecha_fin : Date
  activa : Boolean
  fecha_creacion : Date
}

' ============================================
' MÓDULO: CÁMARAS (Gestión de Dispositivos)
' ============================================

TABLE(camara) {
  PK(id) : BigInteger
  --
  FK(user_id) : BigInteger
  FK(perfil_id) : BigInteger
  cantidad : Integer
  lugar : VARCHAR(255)
  cant_zonas : Integer
}

TABLE(camara_detalles) {
  PK(id) : BigInteger
  --
  FK(camara_id) : BigInteger
  n_camara : Integer
  zona : VARCHAR(100)
  ip : GenericIPAddress
  marca : VARCHAR(100)
  resolucion : VARCHAR(50)
}

' ============================================
' MÓDULO: IA DETECTION (Detección de Eventos)
' ============================================

TABLE(detection_event) {
  PK(id) : BigInteger
  --
  FK(camara_id) : BigInteger
  FK(user_id) : BigInteger
  timeStamp : DateTime
  tipo_alerta : VARCHAR(30)
  zona : VARCHAR(100)
  video_file : VARCHAR(255)
}

' ============================================
' MÓDULO: NOTIFICACIONES (Alertas)
' ============================================

TABLE(notificacion) {
  PK(id) : BigInteger
  --
  FK(perfil_id) : BigInteger
  titulo : VARCHAR(200)
  mensaje : TEXT
  fecha_hora : DateTime
  prioridad : VARCHAR(10)
  tipo : VARCHAR(20)
  nivel_peligro : VARCHAR(10)
  canal : VARCHAR(20)
  zona : VARCHAR(100)
  camara_id : Integer
  leida : Boolean
  recibida : Boolean
  fecha_lectura : DateTime
  metadata : JSON
  --
  <i>Índices:</i>
  INDEX: fecha_hora
  INDEX: perfil_id, fecha_hora
  INDEX: leida
}

TABLE(dispositivo_fcm) {
  PK(id) : BigInteger
  --
  FK(perfil_id) : BigInteger
  UNIQUE(token_fcm) : VARCHAR(255)
  dispositivo_id : VARCHAR(255)
  plataforma : VARCHAR(20)
  activo : Boolean
  fecha_registro : DateTime
  ultima_actualizacion : DateTime
  --
  UNIQUE: (perfil_id, token_fcm)
  INDEX: perfil_id, activo
}

' ============================================
' MÓDULO: REPORTES (Informes de Guardias)
' ============================================

TABLE(reporte_guardia) {
  PK(id) : BigInteger
  --
  FK(perfil_id) : BigInteger
  FK(perfil_categoria_id) : BigInteger
  reporte : TEXT
  datetime_reporte : Date
}

' ============================================
' RELACIONES
' ============================================

' Django Auth Relations
user "1" -- "0..*" token : tiene >
user "1" -- "0..*" perfil : tiene >
user "1" -- "0..*" suscripcion : tiene >
user "1" -- "0..*" camara : posee >
user "1" -- "0..*" detection_event : registra >

' Perfil Relations
perfil "1" -- "0..*" sesion_del_perfil : tiene >
perfil "1" -- "0..*" vinculacion_dispositivo : vincula >
perfil "1" -- "0..*" perfil_categoria : pertenece >
perfil "1" -- "0..*" camara : gestiona >
perfil "1" -- "0..*" notificacion : recibe >
perfil "1" -- "0..*" dispositivo_fcm : registra >
perfil "1" -- "0..*" reporte_guardia : crea >

categoria "1" -- "0..*" perfil_categoria : agrupa >
categoria "1" -- "0..*" reporte_guardia : clasifica >

' Suscripción Relations
plan "1" -- "0..*" suscripcion : define >

' Cámaras Relations
camara "1" -- "0..*" camara_detalles : tiene >
camara_detalles "1" -- "0..*" detection_event : genera >

' Perfil_Categoria Relations
perfil_categoria "1" -- "0..*" reporte_guardia : asocia >

@enduml
```

---

## 📋 Descripción de Módulos

### 🔐 **user** (Django Auth)
Sistema de autenticación por defecto de Django. Gestiona usuarios, contraseñas, permisos y tokens de autenticación.

### 👤 **perfil**
Gestión extendida de usuarios con roles (Guardia/Jefe de Seguridad), zonas asignadas y configuración de notificaciones.

### 💳 **suscripcion**
Sistema de planes y suscripciones para el servicio. Control de pagos y vigencia.

### 📹 **camaras**
Gestión de cámaras IP/RTSP. Incluye ubicación, zonas, detalles técnicos (IP, marca, resolución).

### 🤖 **ia_detection**
Registro de eventos detectados por el modelo de IA (violencia, armas). Almacena timestamp, tipo de alerta y video.

### 🔔 **notificaciones**
Sistema completo de notificaciones multicanal (Push, WebSocket, SMS, Email). Filtrado por prioridad, zona y nivel de peligro.

### 📝 **reporte**
Informes generados por guardias de seguridad sobre incidentes y alertas.

---

## 🛠️ Stack Tecnológico

### Backend
- **Django 5.2.1** - Framework web
- **Django REST Framework** - API RESTful
- **Daphne + Channels** - WebSockets
- **Celery + Redis** - Tareas asíncronas
- **PostgreSQL 15** - Base de datos

### Frontend
- **React 19.1.1** - UI Framework
- **Vite** - Build tool
- **Electron** - Aplicación de escritorio
- **TailwindCSS** - Estilos

### IA/ML
- **PyTorch** - Deep Learning
- **MobileNetV3** - Feature extraction
- **LSTM Bidireccional** - Análisis temporal
- **OpenCV** - Procesamiento de video

### Infraestructura
- **Docker + Docker Compose** - Contenedorización
- **Redis** - Cache y message broker
- **Nginx** - Reverse proxy (producción)

---

## 📱 Características Principales

✅ Detección en tiempo real de violencia y armas  
✅ Soporte para múltiples cámaras IP/RTSP  
✅ Sistema de notificaciones multicanal  
✅ Roles y permisos por zona  
✅ Dashboard web en tiempo real  
✅ Aplicación de escritorio (Electron)  
✅ Grabación automática de evidencia  
✅ Reportes y estadísticas  
✅ Integración con Firebase Cloud Messaging  

---

## 📄 Licencia

Proyecto desarrollado para **Visual Safety** - Sistema de Seguridad Inteligente

---

## 👥 Equipo de Desarrollo

Desarrollado con ❤️ por el equipo de Visual Safety
