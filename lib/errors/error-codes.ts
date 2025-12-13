/**
 * Catálogo de códigos de error para soporte técnico
 * IMPORTANTE: Este archivo es SOLO para uso interno del equipo de soporte
 * Los mensajes de usuario NO deben revelar detalles técnicos
 */

export type ErrorSeverity = "critical" | "warning" | "info"

export interface ErrorCodeEntry {
  code: string
  description: string      // Solo para soporte, NO mostrar al usuario
  userMessage: string      // Mensaje genérico para el usuario
  severity: ErrorSeverity
  action: string           // Acción recomendada para soporte
}

export const ERROR_CODES = {
  // ============================================================
  // Errores de Autenticación (AUTH)
  // ============================================================
  AUTH_NET_001: {
    code: "AUTH-NET-001",
    description: "NetworkError al consultar usuario en BD durante login",
    userMessage: "Oops! Tenemos un error",
    severity: "critical",
    action: "Verificar conectividad con backend, revisar BACKEND_API_URL"
  },
  AUTH_SRV_001: {
    code: "AUTH-SRV-001",
    description: "Error 500 del backend al consultar usuario durante login",
    userMessage: "Oops! Tenemos un error",
    severity: "critical",
    action: "Revisar logs del backend, verificar estado del servidor"
  },
  AUTH_TMO_001: {
    code: "AUTH-TMO-001",
    description: "Timeout al consultar usuario en BD durante login",
    userMessage: "Oops! Tenemos un error",
    severity: "warning",
    action: "Verificar latencia de red, considerar aumentar timeout"
  },
  AUTH_CFG_001: {
    code: "AUTH-CFG-001",
    description: "Variables de entorno del backend no configuradas",
    userMessage: "Oops! Tenemos un error",
    severity: "critical",
    action: "Verificar BACKEND_API_URL, BACKEND_API_KEY, BACKEND_DB_SCHEMA"
  },
  AUTH_VAL_001: {
    code: "AUTH-VAL-001",
    description: "Token SSO inválido o expirado",
    userMessage: "Oops! Tenemos un error",
    severity: "warning",
    action: "Usuario debe reintentar login"
  },
  AUTH_AUT_001: {
    code: "AUTH-AUT-001",
    description: "Email no verificado en proveedor SSO",
    userMessage: "Oops! Tenemos un error",
    severity: "warning",
    action: "Usuario debe verificar email en proveedor"
  },
  AUTH_SSO_001: {
    code: "AUTH-SSO-001",
    description: "Error del proveedor OAuth (error en query params)",
    userMessage: "Oops! Tenemos un error",
    severity: "warning",
    action: "Revisar configuración OAuth del proveedor"
  },
  AUTH_SSO_002: {
    code: "AUTH-SSO-002",
    description: "No se recibió código de autorización del proveedor",
    userMessage: "Oops! Tenemos un error",
    severity: "warning",
    action: "Usuario debe reintentar login"
  },
  AUTH_SSO_003: {
    code: "AUTH-SSO-003",
    description: "No se encontró code_verifier en sessionStorage (PKCE)",
    userMessage: "Oops! Tenemos un error",
    severity: "warning",
    action: "Usuario debe reintentar login, verificar que cookies estén habilitadas"
  },
  AUTH_TKN_001: {
    code: "AUTH-TKN-001",
    description: "Error al intercambiar código por token con proveedor",
    userMessage: "Oops! Tenemos un error",
    severity: "critical",
    action: "Revisar credenciales OAuth (CLIENT_ID, CLIENT_SECRET)"
  },
  AUTH_TKN_002: {
    code: "AUTH-TKN-002",
    description: "No se recibió ID token del proveedor",
    userMessage: "Oops! Tenemos un error",
    severity: "critical",
    action: "Revisar scopes OAuth configurados"
  },
  AUTH_CFG_002: {
    code: "AUTH-CFG-002",
    description: "Credenciales OAuth no configuradas (CLIENT_ID/SECRET)",
    userMessage: "Oops! Tenemos un error",
    severity: "critical",
    action: "Verificar GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o equivalentes Microsoft"
  },

  // ============================================================
  // Errores de Registro (REG)
  // ============================================================
  REG_NET_001: {
    code: "REG-NET-001",
    description: "NetworkError al crear usuario en BD",
    userMessage: "Error al crear usuario. Intenta nuevamente.",
    severity: "critical",
    action: "Verificar conectividad con backend"
  },
  REG_SRV_001: {
    code: "REG-SRV-001",
    description: "Error 500 del backend al crear usuario",
    userMessage: "Error al crear usuario. Intenta nuevamente.",
    severity: "critical",
    action: "Revisar logs del backend"
  },
  REG_VAL_001: {
    code: "REG-VAL-001",
    description: "Datos de registro inválidos (server-side)",
    userMessage: "Los datos ingresados no son válidos.",
    severity: "warning",
    action: "Revisar validaciones del formulario"
  },
  REG_DUP_001: {
    code: "REG-DUP-001",
    description: "Usuario ya existe con ese email",
    userMessage: "Este email ya está registrado.",
    severity: "info",
    action: "Usuario debe hacer login normal"
  },

  // ============================================================
  // Errores de Sesión (SES)
  // ============================================================
  SES_EXP_001: {
    code: "SES-EXP-001",
    description: "Sesión temporal expirada",
    userMessage: "Tu sesión ha expirado.",
    severity: "info",
    action: "Usuario debe reiniciar login"
  },
  SES_INV_001: {
    code: "SES-INV-001",
    description: "Token de sesión inválido o corrupto",
    userMessage: "Sesión inválida.",
    severity: "warning",
    action: "Verificar SESSION_SECRET, usuario debe reiniciar login"
  },

  // ============================================================
  // Errores de Usuario (USR)
  // ============================================================
  USR_NET_001: {
    code: "USR-NET-001",
    description: "NetworkError en operaciones de usuario",
    userMessage: "Error de conexión.",
    severity: "critical",
    action: "Verificar conectividad con backend"
  },
  USR_NTF_001: {
    code: "USR-NTF-001",
    description: "Usuario no encontrado en BD",
    userMessage: "Usuario no encontrado.",
    severity: "warning",
    action: "Verificar integridad de datos"
  },

  // ============================================================
  // Errores de Navegación (NAV)
  // ============================================================
  NAV_NTF_001: {
    code: "NAV-NTF-001",
    description: "Página no encontrada (404)",
    userMessage: "Página no encontrada",
    severity: "info",
    action: "Verificar URL, posible enlace roto o página eliminada"
  },

  // ============================================================
  // Errores Generales (ERR)
  // ============================================================
  ERR_GEN_000: {
    code: "ERR-GEN-000",
    description: "Error genérico sin código específico",
    userMessage: "Oops! Tenemos un error",
    severity: "warning",
    action: "Revisar logs para más detalles"
  },
} as const

export type ErrorCode = keyof typeof ERROR_CODES

/**
 * Obtiene la entrada de error por código
 * @param code - Código de error (ej: "AUTH-NET-001")
 * @returns ErrorCodeEntry o el error genérico si no se encuentra
 */
export function getErrorByCode(code: string): ErrorCodeEntry {
  const key = code.replace(/-/g, "_") as ErrorCode
  return ERROR_CODES[key] || ERROR_CODES.ERR_GEN_000
}

/**
 * Verifica si un código de error es crítico
 */
export function isCriticalError(code: string): boolean {
  const error = getErrorByCode(code)
  return error.severity === "critical"
}

/**
 * Formatea un mensaje de log con el código de error
 * @param code - Código de error
 * @param message - Mensaje adicional
 */
export function formatErrorLog(code: string, message: string): string {
  return `[${code}] ${message}`
}

