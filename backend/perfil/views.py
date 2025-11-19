from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.hashers import make_password, check_password
from django.utils.timezone import now
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Perfil, Categoria, Perfil_Categoria, Sesion_del_Perfil, VinculacionDispositivo
from .serializer import PerfilSerializer, CategoriaSerializer, PerfilCategoriaSerializer, UserSerializer, UserCreateSerializer, VinculacionDispositivoSerializer
import uuid
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiResponse
from django.utils import timezone

# ============================================
# ENDPOINTS DE AUTENTICACIÓN DE EMPRESA
# ============================================


@extend_schema(
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "username": {"type": "string", "example": "empresa_xyz"},
                "password": {"type": "string", "example": "supersegura123"}
            },
            "required": ["username", "password"]
        }
    },
    responses={
        200: OpenApiResponse(
            response={
                "type": "object",
                "properties": {
                    "token": {"type": "string"},
                    "user": {"type": "object"},
                    "mensaje": {"type": "string"}
                }
            },
            description="Login exitoso"
        ),
        400: OpenApiResponse(description="Datos faltantes"),
        401: OpenApiResponse(description="Credenciales incorrectas"),
    },
    examples=[
        OpenApiExample(
            "Ejemplo de login",
            value={"username": "empresa", "password": "empresa123"},
            request_only=True
        )
    ]
)
@api_view(['POST'])
@permission_classes([AllowAny])
def login_empresa(request):
    """Login para empresas/administradores"""
    username = request.data.get('username')
    password = request.data.get('password')
    if not username or not password:
        return Response(
            {"error": "Usuario y contraseña son requeridos"},
            status=status.HTTP_400_BAD_REQUEST
        )
    user = authenticate(username=username, password=password)
    if user is not None:
        # Obtener o crear token de Django REST Framework
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "token": token.key,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name
            },
            "mensaje": "Inicio de sesión exitoso"
        }, status=status.HTTP_200_OK)
    else:
        return Response(
            {"error": "Credenciales incorrectas"},
            status=status.HTTP_401_UNAUTHORIZED
        )



@extend_schema(
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "nombre": {"type": "string", "example": "Empresa XYZ"},
                "email": {"type": "string", "example": "empresa@xyz.com"},
                "username_admin": {"type": "string", "example": "empresa_xyz"},
                "password": {"type": "string", "example": "supersegura123"},
                "plan_id": {"type": "integer", "example": 1}
            },
            "required": ["nombre", "email", "username_admin", "password", "plan_id"]
        }
    },
    responses={
        201: OpenApiResponse(description="Empresa registrada exitosamente"),
        400: OpenApiResponse(description="Datos faltantes o duplicados"),
        500: OpenApiResponse(description="Error interno"),
    },
    examples=[
        OpenApiExample(
            "Ejemplo de registro",
            value={
                "nombre": "Empresa",
                "email": "empresa@gmail.com",
                "username_admin": "empresa",
                "password": "empresa123",
                "plan_id": 1
            },
            request_only=True
        )
    ]
)
@api_view(['POST'])
@permission_classes([AllowAny])
def registro_empresa(request):
    """Registro de nuevas empresas"""
    # Validar campos requeridos
    campos_requeridos = ['nombre', 'email', 'username_admin', 'password', 'plan_id']
    for campo in campos_requeridos:
        if not request.data.get(campo):
            return Response(
                {"error": f"El campo '{campo}' es requerido"},
                status=status.HTTP_400_BAD_REQUEST
            )
    username = request.data.get('username_admin')
    email = request.data.get('email')
    password = request.data.get('password')
    nombre_empresa = request.data.get('nombre')
    # Verificar si el usuario ya existe
    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "El nombre de usuario ya está en uso"},
            status=status.HTTP_400_BAD_REQUEST
        )
    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "El correo electrónico ya está registrado"},
            status=status.HTTP_400_BAD_REQUEST
        )
    try:
        # Crear usuario
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=nombre_empresa
        )
        # Generar token para el nuevo usuario
        token = Token.objects.create(user=user)
        return Response({
            "mensaje": "Empresa registrada exitosamente",
            "token": token.key,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "nombre_empresa": nombre_empresa
            }
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            {"error": f"Error al registrar empresa: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Create your views here.
# --- Vistas independientes para vinculación y desvinculación de perfil ---

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@extend_schema(
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "token": {"type": "string", "example": "abc123"},
                "dispositivo_id": {"type": "string", "example": "device-xyz"}
            },
            "required": ["token", "dispositivo_id"]
        }
    },
    responses={
        200: OpenApiResponse(
            response={
                "type": "object",
                "properties": {
                    "perfil": {"type": "object"},
                    "perfil_id": {"type": "integer"},
                    "token": {"type": "string"},
                    "dispositivo_id": {"type": "string"}
                }
            },
            description="Vinculación exitosa"
        ),
        400: OpenApiResponse(description="Token inválido o expirado")
    },
)
@api_view(['POST'])
@permission_classes([AllowAny])
def vincular_perfil(request):
    """
    Vincula un perfil a un dispositivo usando el token QR.
    Esta vinculación es PERMANENTE hasta que el usuario decida desvincular.
    """
    token = request.data.get('token')
    dispositivo_id = request.data.get('dispositivo_id')
    
    if not token or not dispositivo_id:
        return Response(
            {"error": "Token y dispositivo_id son requeridos"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verificar si este dispositivo ya está vinculado a algún perfil
    vinculacion_existente = VinculacionDispositivo.objects.filter(
        dispositivo_id=dispositivo_id,
        usado=True
    ).first()
    
    if vinculacion_existente:
        return Response({
            "error": "Este dispositivo ya está vinculado a un perfil.",
            "perfil_vinculado": {
                "id": vinculacion_existente.perfil.id,
                "nombre": vinculacion_existente.perfil.nombre,
                "apellido": vinculacion_existente.perfil.apellido,
                "ci": vinculacion_existente.perfil.ci
            },
            "mensaje": "Debes desvincular el perfil actual primero."
        }, status=status.HTTP_409_CONFLICT)
    
    try:
        # Buscar el token QR
        vinc = VinculacionDispositivo.objects.get(token=token, usado=False)
        
        # Verificar expiración
        if vinc.fecha_expiracion < timezone.now():
            return Response(
                {"error": "Token expirado. Solicita un nuevo QR al administrador."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vincular permanentemente
        perfil = vinc.perfil
        vinc.usado = True
        vinc.dispositivo_id = dispositivo_id
        vinc.save()
        
        perfil_data = PerfilSerializer(perfil).data
        
        return Response({
            "mensaje": "Dispositivo vinculado exitosamente",
            "perfil": perfil_data,
            "perfil_id": perfil.id,
            "dispositivo_id": dispositivo_id
        }, status=status.HTTP_200_OK)
        
    except VinculacionDispositivo.DoesNotExist:
        return Response(
            {"error": "Token QR inválido o ya fue usado."}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def verificar_dispositivo(request):
    """
    Verifica si un dispositivo ya está vinculado a un perfil.
    Si está vinculado, retorna la información del perfil.
    Esto permite el login directo sin escanear QR nuevamente.
    """
    dispositivo_id = request.data.get('dispositivo_id')
    
    if not dispositivo_id:
        return Response(
            {"error": "dispositivo_id es requerido"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Buscar vinculación activa
    vinculacion = VinculacionDispositivo.objects.filter(
        dispositivo_id=dispositivo_id,
        usado=True
    ).first()
    
    if vinculacion:
        perfil = vinculacion.perfil
        return Response({
            "vinculado": True,
            "perfil": {
                "id": perfil.id,
                "ci": perfil.ci,
                "nombre": perfil.nombre,
                "apellido": perfil.apellido,
                "email": perfil.email,
                "telefono": perfil.telefono,
                "direccion": perfil.direccion
            }
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            "vinculado": False,
            "mensaje": "Este dispositivo no está vinculado a ningún perfil."
        }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def desvincular_perfil(request):
    """
    Desvincula un perfil de un dispositivo.
    Esto permite vincular un nuevo perfil al mismo dispositivo.
    También cierra todas las sesiones activas.
    """
    dispositivo_id = request.data.get('dispositivo_id')
    
    if not dispositivo_id:
        return Response(
            {"error": "dispositivo_id es requerido"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Buscar vinculación
    vinculacion = VinculacionDispositivo.objects.filter(
        dispositivo_id=dispositivo_id,
        usado=True
    ).first()
    
    if vinculacion:
        perfil = vinculacion.perfil
        
        # Cerrar sesiones activas de este perfil
        Sesion_del_Perfil.objects.filter(
            perfil=perfil,
            is_active=True
        ).update(is_active=False)
        
        # Eliminar vinculación
        vinculacion.delete()
        
        return Response({
            "mensaje": "Perfil desvinculado exitosamente.",
            "perfil_desvinculado": f"{perfil.nombre} {perfil.apellido}"
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            "error": "No se encontró ninguna vinculación para este dispositivo."
        }, status=status.HTTP_404_NOT_FOUND)
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Obtener información del usuario actual"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class PerfilViewSet(viewsets.ModelViewSet):
    serializer_class = PerfilSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Perfil.objects.filter(user_id=user)
        return Perfil.objects.all()
    
    @action(detail=False, methods=['post'])
    def crear_perfil(self, request):
        campos_requeridos = ['ci', 'nombre', 'apellido', 'email']
        for campo in campos_requeridos:
            if not request.data.get(campo):
                return Response(
                    {"error": f"El campo '{campo}' es requerido"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        apellido = request.data.get('apellido')
        ci = request.data.get('ci')
        contraseña_temp = f"{iniciales(apellido)}.{ci}"
        data = request.data.copy()
        data['contraseña'] = make_password(contraseña_temp)
        data['user_id'] = request.user.id
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            perfil = serializer.save()
            return Response(
                {
                    "mensaje": "Perfil creado exitosamente",
                    "contraseña_temporal": contraseña_temp,  # Para que el usuario la conozca
                    "perfil": serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'])
    def cambiar_contraseña(self, request, pk=None):
        token = request.data.get('token')
        perfil = Perfil.get_perfil(token)
        contraseña_actual = request.data.get('contraseña_actual')
        contraseña_nueva = request.data.get('contraseña_nueva')
        confirmar_contraseña = request.data.get('confirmar_contraseña')
        if not all([contraseña_actual, contraseña_nueva, confirmar_contraseña]):
            return Response(
                {"detail": "Todos los campos son requeridos."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not check_password(contraseña_actual, perfil.contraseña):
            return Response(
                {"detail": "La contraseña actual es incorrecta."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        if contraseña_nueva != confirmar_contraseña:
            return Response(
                {"detail": "Las contraseñas nuevas no coinciden."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if len(contraseña_nueva) < 8:
            return Response(
                {"detail": "La contraseña debe tener al menos 8 caracteres."},
                status=status.HTTP_400_BAD_REQUEST
            )
        perfil.contraseña = make_password(contraseña_nueva)
        perfil.save()
        return Response({"mensaje": "Contraseña actualizada exitosamente."},status=status.HTTP_200_OK )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def generar_qr(self, request, pk=None):
        perfil = self.get_object()
        VinculacionDispositivo.objects.filter(perfil=perfil, usado=False, dispositivo_id__isnull=True).delete()
        VinculacionDispositivo.objects.filter(perfil=perfil, usado=False).exclude(dispositivo_id__isnull=True).update(usado=True)
        vinc = VinculacionDispositivo.objects.create(perfil=perfil)
        serializer = VinculacionDispositivoSerializer(vinc)
        return Response({"qr_data": vinc.token, "vinculacion": serializer.data}, status=200)

    
# sinceramente me da flojera hacer esto la ia se encargo pero debo de ajustarlo que peresa 
    # @action(detail=True, methods=['post'])
    # def restablecer_contraseña(self, request, pk=None):
    #     """Restablecer contraseña a la predeterminada (solo admin)"""
    #     perfil = self.get_object()
        
    #     # Solo permitir a staff/admin
    #     if not request.user.is_staff:
    #         return Response(
    #             {"detail": "No tienes permisos para esta acción."},
    #             status=status.HTTP_403_FORBIDDEN
    #         )
        
    #     # Generar nueva contraseña temporal
    #     contraseña_temp = f"{iniciales(perfil.apellido)}.{perfil.ci}"
    #     perfil.contraseña = make_password(contraseña_temp)
    #     perfil.save()
        
    #     # Invalidar sesiones activas
    #     Sesion_del_Perfil.objects.filter(perfil=perfil, is_active=True).update(
    #         is_active=False
    #     )
        
    #     return Response(
    #         {
    #             "mensaje": "Contraseña restablecida exitosamente.",
    #             "contraseña_temporal": contraseña_temp,
    #             "nota": "El usuario debe cambiar esta contraseña en su próximo inicio de sesión."
    #         },
    #         status=status.HTTP_200_OK
    #     )

    @action(detail=True, methods=['patch'], permission_classes=[AllowAny])
    def iniciar_sesion(self, request, pk=None):
        perfil = self.get_object()
        contraseña = request.data.get('contraseña')
        if not contraseña:
            return Response({"detail": "Contraseña requerida."}, status=400)
        if not check_password(contraseña, perfil.contraseña):
            return Response({"detail": "Contraseña incorrecta."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Actualizar sesión personalizada
        sesion = Sesion_del_Perfil.objects.filter(perfil=perfil, is_active=True).first() 
        if sesion: 
            sesion.ultima_actividad = now() 
            sesion.save() 
        else: 
            sesion = Sesion_del_Perfil.objects.create(perfil=perfil, token=uuid.uuid4().hex)
        
        # Obtener o crear token DRF para el user asociado al perfil
        drf_token, created = Token.objects.get_or_create(user=perfil.user_id)
        
        return Response({
            "token": drf_token.key,  # Token DRF para autenticación API/WebSocket
            "session_token": sesion.token,  # Token de sesión personalizado (legacy)
            "perfil": PerfilSerializer(perfil).data
        }, status=200)
    
    @action(detail=False, methods=['patch'])
    def cerrar_sesion(self, request):
        token = request.data.get('token')
        if not token:
            return Response({"detail": "Token requerido."}, status=400)
        try:
            sesion = Sesion_del_Perfil.objects.get(token=token, is_active=True)
            sesion.is_active = False
            sesion.save()
            return Response({"detail": "Sesión cerrada."}, status=200)
        except Sesion_del_Perfil.DoesNotExist:
            return Response({"detail": "Token inválido o sesión ya cerrada."}, status=400)
    
    @action(detail=False, methods=['patch'], permission_classes=[AllowAny])
    def mi_perfil(self, request):
        token = request.data.get('token')
        perfil = Perfil.get_perfil(token)
        if perfil:
            serializer = self.get_serializer(perfil)
            return Response(serializer.data)
        return Response({"detail": "Perfil no encontrado."}, status=404)


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsAdminUser]
    
    def perform_create(self, serializer):
        serializer.save()
        
class PerfilCategoriaViewSet(viewsets.ModelViewSet):
    serializer_class = PerfilCategoriaSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Perfil_Categoria.objects.filter(perfil__user_id=self.request.user)
    
    @action(detail=False, methods=['post'])
    def asignar_categoria(self, request):
        token = request.data.get('token')
        perfil = Perfil.get_perfil(token)
        if not perfil:
            return Response({"detail": "Perfil no encontrado."}, status=404)
        categoria = request.data.get('categoria')
        try:
            categoria = Categoria.objects.get(id=categoria)
        except Categoria.DoesNotExist:
            return Response({"detail": "Categoría no encontrada."}, status=404)
        Perfil_Categoria.objects.create(perfil=perfil, categoria=categoria)
        return Response({"detail": "Categoría asignada."}, status=201)
    
    
def iniciales(entrada):
    if not entrada:
        return ""
    apellidos = entrada.split()
    return "".join(apellido[0].upper() for apellido in apellidos if apellido)