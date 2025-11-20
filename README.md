Intrucciones para correr el proyecto
Paso 1
docker compose up --build
Paso 2
cd .\frontend\
 npm install
Paso 3
npm run electron:dev
Listo

    ## Diagrama de Clases del Backend

    ```mermaid
    classDiagram
        class User

        class Perfil {
            ci: CharField
            nombre: CharField
            apellido: CharField
            contraseña: CharField
            email: EmailField
            telefono: CharField
            direccion: TextField
            fecha_nacimiento: DateField
            fecha_creacion: DateField
            user_id: ForeignKey(User)
            rol: CharField
            zonas_asignadas: JSONField
            nivel_severidad_minimo: CharField
        }

        class Camara {
            cantidad: IntegerField
            lugar: CharField
            cant_zonas: IntegerField
            user: ForeignKey(User)
            perfil: ForeignKey(Perfil)
        }

        class CamaraDetalles {
            camara: ForeignKey(Camara)
            n_camara: IntegerField
            zona: CharField
            ip: GenericIPAddressField
            marca: CharField
            resolucion: CharField
        }

        class DetectionEvent {
            camara_id: ForeignKey(CamaraDetalles)
            timeStamp: DateTimeField
            tipo_alerta: CharField
            zona: CharField
            video_file: CharField
            user: ForeignKey(User)
        }

        class Notificacion {
            perfil: ForeignKey(Perfil)
            titulo: CharField
            mensaje: TextField
            fecha_hora: DateTimeField
            prioridad: CharField
            tipo: CharField
            nivel_peligro: CharField
            canal: CharField
            zona: CharField
            camara_id: IntegerField
            leida: BooleanField
            recibida: BooleanField
            fecha_lectura: DateTimeField
            metadata: JSONField
        }

        class DispositivoFCM {
            perfil: ForeignKey(Perfil)
            token_fcm: CharField
            dispositivo_id: CharField
            plataforma: CharField
            activo: BooleanField
            fecha_registro: DateTimeField
            ultima_actualizacion: DateTimeField
        }

        class Plan {
            nombre: CharField
            descripcion: TextField
            precio: DecimalField
            duracion_meses: IntegerField
            fecha_creacion: DateField
        }

        class Suscripcion {
            fecha_inicio: DateField
            fecha_fin: DateField
            activa: BooleanField
            fecha_creacion: DateField
            user_id: ForeignKey(User)
            plan_id: ForeignKey(Plan)
        }

        class Categoria {
            nombre: CharField
            descripcion: TextField
            fecha_creacion: DateField
        }

        class Perfil_Categoria {
            perfil: ForeignKey(Perfil)
            categoria: ForeignKey(Categoria)
            fecha_hora_inicio: DateTimeField
            fecha_hora_fin: DateTimeField
        }

        class Sesion_del_Perfil {
            perfil: ForeignKey(Perfil)
            token: CharField
            ultima_actividad: DateTimeField
            is_active: BooleanField
        }

        class VinculacionDispositivo {
            perfil: ForeignKey(Perfil)
            token: CharField
            dispositivo_id: CharField
            fecha_creacion: DateTimeField
            fecha_expiracion: DateTimeField
            usado: BooleanField
        }

        class Reporte_Guardia {
            perfil: ForeignKey(Perfil)
            perfil_categoria: ForeignKey(Perfil_Categoria)
            reporte: TextField
            datetime_reporte: DateField
        }

        %% Relaciones
        Perfil --> User
        Camara --> User
        Camara --> Perfil
        CamaraDetalles --> Camara
        DetectionEvent --> CamaraDetalles
        DetectionEvent --> User
        Notificacion --> Perfil
        DispositivoFCM --> Perfil
        Suscripcion --> User
        Suscripcion --> Plan
        Perfil_Categoria --> Perfil
        Perfil_Categoria --> Categoria
        Sesion_del_Perfil --> Perfil
        VinculacionDispositivo --> Perfil
        Reporte_Guardia --> Perfil
        Reporte_Guardia --> Perfil_Categoria
    ```
