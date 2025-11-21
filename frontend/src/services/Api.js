/**
 * Consultar el estado de la señal de una cámara
 * @param {number} detalleId - ID de CamaraDetalles
 * @returns {Promise}
 */
export const obtenerEstadoCamara = async (detalleId) => {
    try {
        const response = await api.get(`estado-camara/${detalleId}/`);
        return response.data;
    } catch (error) {
        return { estado: "error", mensaje: "No se pudo verificar la cámara" };
    }
};
import axios from 'axios';

// URL base del API - Configurada para Docker
export const Apiurl = process.env.NODE_ENV === 'production' 
    ? 'http://backend:8000/api/' 
    : 'http://localhost:8000/api/';

// Configuración de axios
const api = axios.create({
    baseURL: Apiurl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Lista de endpoints que NO requieren autenticación
const PUBLIC_ENDPOINTS = [
    'auth/login/',
    'auth/registro/',
    'planes/'
];

// Interceptor para agregar token de autenticación si existe
api.interceptors.request.use(
    (config) => {
        // Verificar si el endpoint es público
        const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint => 
            config.url?.includes(endpoint)
        );
        
        // Solo agregar token si NO es un endpoint público
        if (!isPublicEndpoint) {
            const token = localStorage.getItem('authToken');
            
            if (token) {
                config.headers.Authorization = `Token ${token}`;
            }
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar respuestas de error
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // El servidor respondió con un código de error
            const errorData = error.response.data;
            const status = error.response.status;
            
            // Si es error 401, limpiar tokens inválidos
            if (status === 401) {
            }
            
            // Si es error 500, agregar más contexto
            if (status === 500) {
            }
            
            // Crear un objeto de error más amigable
            const friendlyError = {
                status: status,
                error: errorData.error || errorData.detail || 'Error desconocido',
                detail: errorData.detail || errorData.error || '',
                ...errorData
            };
            
            return Promise.reject(friendlyError);
        } else if (error.request) {
            // La petición se hizo pero no hubo respuesta
            return Promise.reject({
                error: 'No se pudo conectar con el servidor',
                detail: 'Verifica que el backend esté funcionando'
            });
        } else {
            // Algo pasó al configurar la petición
            return Promise.reject({
                error: 'Error al procesar la solicitud',
                detail: error.message
            });
        }
    }
);

// ============================================
// SERVICIOS DE AUTENTICACIÓN
// ============================================

/**
 * Registrar una nueva empresa/usuario
 * @param {Object} userData - Datos del usuario
 * @returns {Promise}
 */
export const registrarUsuario = async (userData) => {
    try {
        const response = await api.post('auth/registro/', userData);
        
        // Guardar token en localStorage
        if (response.data.token) {
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Iniciar sesión de usuario administrador
 * @param {string} username 
 * @param {string} password 
 * @returns {Promise}
 */
export const loginAdmin = async (username, password) => {
    try {
        const response = await api.post('auth/login/', {
            username,
            password
        });
        
        // Guardar token en localStorage
        if (response.data.token) {
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Cerrar sesión
 */
export const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('perfilToken');
    localStorage.removeItem('perfilActual');
};

// ============================================
// SERVICIOS DE PLANES Y SUSCRIPCIONES
// ============================================

/**
 * Obtener todos los planes disponibles
 * @returns {Promise}
 */
export const obtenerPlanes = async () => {
    try {
        const response = await api.get('planes/');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al obtener planes' };
    }
};

/**
 * Crear una nueva suscripción
 * @param {number} plan_id - ID del plan seleccionado
 * @returns {Promise}
 */
export const crearSuscripcion = async (plan_id) => {
    try {
        const response = await api.post('suscripciones/crear_suscripcion/', {
            plan_id
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al crear suscripción' };
    }
};

/**
 * Obtener las suscripciones del usuario actual
 * @returns {Promise}
 */
export const obtenerMisSuscripciones = async () => {
    try {
        const response = await api.get('suscripciones/mis_suscripciones/');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al obtener suscripciones' };
    }
};

// ============================================
// SERVICIOS DE PERFILES
/**
 * Generar QR de vinculación para un perfil (POST)
 * @param {number} perfilId - ID del perfil
 * @returns {Promise}
 */
export const generarQrVinculacion = async (perfilId) => {
    try {
        const response = await api.post(`perfiles/${perfilId}/generar_qr/`);
        // El token está en response.data.qr_data
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al generar QR de vinculación' };
    }
};
// ============================================

/**
 * Obtener todos los perfiles del usuario autenticado
 * @returns {Promise}
 */
export const obtenerPerfiles = async () => {
    try {
        const response = await api.get('perfiles/');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al obtener perfiles' };
    }
};

/**
 * Crear un nuevo perfil (guardia o jefe según sea el primero)
 * @param {Object} perfilData 
 * @returns {Promise}
 */
export const crearPerfil = async (perfilData) => {
    try {
        const response = await api.post('perfiles/', perfilData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al crear perfil' };
    }
};

/**
 * Actualizar perfil existente (editar rol, zona, categoria)
 * @param {number} perfilId
 * @param {Object} perfilData
 * @returns {Promise}
 */
export const actualizarPerfil = async (perfilId, perfilData) => {
    try {
        const response = await api.patch(`perfiles/${perfilId}/`, perfilData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al actualizar perfil' };
    }
};

/**
 * Obtener un perfil específico por ID
 * @param {number} perfilId
 * @returns {Promise}
 */
export const obtenerPerfilPorId = async (perfilId) => {
    try {
        const response = await api.get(`perfiles/${perfilId}/`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al obtener perfil' };
    }
};

/**
 * Iniciar sesión de un perfil (guardia)
 * @param {number} perfilId 
 * @param {string} contraseña 
 * @returns {Promise}
 */
export const iniciarSesionPerfil = async (perfilId, contraseña) => {
    try {
        const response = await api.patch(`perfiles/${perfilId}/iniciar_sesion/`, {
            contraseña
        });
        
        // Guardar token del perfil
        if (response.data.token) {
            localStorage.setItem('perfilToken', response.data.token);
        }
        
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al iniciar sesión del perfil' };
    }
};

/**
 * Cerrar sesión de un perfil
 * @param {string} token - Token del perfil
 * @returns {Promise}
 */
export const cerrarSesionPerfil = async (token) => {
    try {
        const response = await api.patch('perfiles/cerrar_sesion/', { token });
        localStorage.removeItem('perfilToken');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al cerrar sesión del perfil' };
    }
};

/**
 * Obtener datos del perfil actual por token
 * @param {string} token 
 * @returns {Promise}
 */
export const obtenerMiPerfil = async (token) => {
    try {
        const response = await api.patch('perfiles/mi_perfil/', { token });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al obtener perfil' };
    }
};

/**
 * Cambiar contraseña de un perfil
 * @param {number} perfilId 
 * @param {Object} passwordData 
 * @returns {Promise}
 */
export const cambiarContraseñaPerfil = async (perfilId, passwordData) => {
    try {
        const response = await api.patch(`perfiles/${perfilId}/cambiar_contraseña/`, passwordData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al cambiar contraseña' };
    }
};

// ============================================
// SERVICIOS DE CÁMARAS
// ============================================

/**
 * Obtener todas las cámaras de la empresa actual
 * @returns {Promise}
 */
export const obtenerCamaras = async () => {
    try {
        const response = await api.get('camaras/');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al obtener cámaras' };
    }
};

/**
 * Obtener detalles de todas las cámaras
 * @returns {Promise}
 */
export const obtenerCamaraDetalles = async () => {
    try {
        const response = await api.get('camara-detalles/');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al obtener detalles de cámaras' };
    }
};

/**
 * Actualizar detalle de cámara (asignar zona, etc.)
 * @param {number} detalleId - ID del detalle de cámara
 * @param {Object} data - Datos a actualizar
 * @returns {Promise}
 */
export const actualizarCamaraDetalle = async (detalleId, data) => {
    try {
        const response = await api.patch(`camara-detalles/${detalleId}/`, data);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al actualizar cámara' };
    }
};

/**
 * Detectar cámaras automáticamente en la red
 * @param {string} ip - IP específica para probar (opcional)
 * @returns {Promise}
 */
export const detectarCamaras = async (ip = null) => {
    try {
        const url = ip ? `detectar/?ip=${ip}` : 'detectar/';
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al detectar cámaras' };
    }
};

/**
 * Registrar una cámara manualmente
 * @param {Object} camaraData 
 * @returns {Promise}
 */
export const registrarCamara = async (camaraData) => {
    try {
        const response = await api.post('registrar/', camaraData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al registrar cámara' };
    }
};

// ============================================
// SERVICIOS DE ZONAS
// ============================================

/**
 * Obtener todas las zonas
 * @returns {Promise}
 */
export const obtenerZonas = async () => {
    try {
        const response = await api.get('zonas/');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al obtener zonas' };
    }
};

/**
 * Crear una nueva zona
 * @param {Object} zonaData
 * @returns {Promise}
 */
export const crearZona = async (zonaData) => {
    try {
        const response = await api.post('zonas/', zonaData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al crear zona' };
    }
};

/**
 * Actualizar zona existente
 * @param {number} zonaId
 * @param {Object} zonaData
 * @returns {Promise}
 */
export const actualizarZona = async (zonaId, zonaData) => {
    try {
        const response = await api.patch(`zonas/${zonaId}/`, zonaData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al actualizar zona' };
    }
};

/**
 * Eliminar zona
 * @param {number} zonaId
 * @returns {Promise}
 */
export const eliminarZona = async (zonaId) => {
    try {
        const response = await api.delete(`zonas/${zonaId}/`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al eliminar zona' };
    }
};

// ============================================
// SERVICIOS DE CATEGORÍAS
// ============================================

/**
 * Obtener todas las categorías
 * @returns {Promise}
 */
export const obtenerCategorias = async () => {
    try {
        const response = await api.get('categorias/');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al obtener categorías' };
    }
};

/**
 * Asignar categoría a un perfil
 * @param {string} token - Token del perfil
 * @param {number} categoriaId - ID de la categoría
 * @returns {Promise}
 */
export const asignarCategoria = async (token, categoriaId) => {
    try {
        const response = await api.post('perfil-categorias/asignar_categoria/', {
            token,
            categoria: categoriaId
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al asignar categoría' };
    }
};

// ============================================
// SERVICIOS DE REPORTES
// ============================================

/**
 * Obtener reportes de guardia
 * @returns {Promise}
 */
export const obtenerReportes = async () => {
    try {
        const response = await api.get('reporte_guardia/');
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al obtener reportes' };
    }
};

/**
 * Crear un reporte de guardia
 * @param {Object} reporteData 
 * @returns {Promise}
 */
export const crearReporte = async (reporteData) => {
    try {
        const response = await api.post('reporte_guardia/crear_repoorte_guardia/', reporteData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { error: 'Error al crear reporte' };
    }
};

// Exportar instancia de axios configurada
export default api;
