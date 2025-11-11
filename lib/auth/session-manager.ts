import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { getConfig, isDevelopment } from "@/lib/config/env"

// Nombre de la cookie de sesión
export const SESSION_COOKIE_NAME = "gssc_session"

// Duración de la sesión (24 horas)
const SESSION_DURATION = 24 * 60 * 60 // 24 horas en segundos

// Duración del refresh token (7 días)
const REFRESH_DURATION = 7 * 24 * 60 * 60 // 7 días en segundos

export interface SessionData {
  sub: string // ID del usuario (subject)
  email: string
  name?: string
  picture?: string
  provider: "google" | "microsoft" | "meta"
  role: "Organizador" | "Proveedor" | "Pagador"
  iat: number // Issued at
  exp: number // Expiration
}

/**
 * Obtiene la clave secreta para firmar tokens
 * En producción, esto debe venir de variables de entorno
 * En desarrollo, usa un secret por defecto si no está configurado
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  
  // En desarrollo, usar un secret por defecto si no está configurado
  if (!secret && isDevelopment()) {
    console.warn('⚠️ [DEV] Usando SESSION_SECRET por defecto para desarrollo local')
    console.warn('⚠️ [DEV] Para producción, configura SESSION_SECRET en variables de entorno')
    return new TextEncoder().encode('dev-secret-key-for-local-development-only-do-not-use-in-production')
  }
  
  // En staging/production es obligatorio tener SESSION_SECRET
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set. Required for staging/production.")
  }
  
  return new TextEncoder().encode(secret)
}

/**
 * Crea un token de sesión JWT firmado
 */
export async function createSessionToken(data: Omit<SessionData, "iat" | "exp">): Promise<string> {
  const secret = getSecretKey()
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + SESSION_DURATION

  const token = await new SignJWT({ ...data, iat, exp })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .setIssuer("gssc-platform")
    .setAudience("gssc-users")
    .sign(secret)

  return token
}

/**
 * Verifica y decodifica un token de sesión
 */
export async function verifySessionToken(token: string): Promise<SessionData> {
  try {
    const secret = getSecretKey()
    const { payload } = await jwtVerify(token, secret, {
      issuer: "gssc-platform",
      audience: "gssc-users",
    })

    return payload as unknown as SessionData
  } catch (error) {
    console.error("Session token verification error:", error)
    throw new Error("Invalid session token")
  }
}

/**
 * Crea una cookie de sesión segura
 * Configuración adaptada según el ambiente
 */
export async function setSessionCookie(sessionData: Omit<SessionData, "iat" | "exp">): Promise<void> {
  const token = await createSessionToken(sessionData)
  const cookieStore = await cookies()
  const config = getConfig()

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true, // No accesible desde JavaScript
    secure: config.secureCookies, // Basado en ambiente
    sameSite: "lax", // Protección CSRF
    maxAge: config.sessionDuration, // Duración basada en ambiente
    path: "/", // Disponible en toda la app
  })
}

/**
 * Obtiene la sesión actual desde la cookie
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionCookie?.value) {
      return null
    }

    const session = await verifySessionToken(sessionCookie.value)

    // Verificar si la sesión ha expirado
    const now = Math.floor(Date.now() / 1000)
    if (session.exp < now) {
      await deleteSession()
      return null
    }

    return session
  } catch (error) {
    console.error("Get session error:", error)
    await deleteSession()
    return null
  }
}

/**
 * Elimina la cookie de sesión de forma segura
 * Asegura que la cookie sea eliminada completamente
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  
  // Método 1: Delete directo
  cookieStore.delete(SESSION_COOKIE_NAME)
  
  // Método 2: Establecer cookie con maxAge 0 (expirada)
  // Esto asegura compatibilidad con todos los navegadores
  const config = getConfig()
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: "lax",
    maxAge: 0, // Expira inmediatamente
    path: "/",
    expires: new Date(0), // Fecha en el pasado
  })
}

/**
 * Refresca la sesión extendiendo su tiempo de expiración
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const session = await getSession()
    if (!session) {
      return false
    }

    // Crear nueva sesión con tiempo extendido
    await setSessionCookie({
      sub: session.sub,
      email: session.email,
      name: session.name,
      picture: session.picture,
      provider: session.provider,
      role: session.role,
    })

    return true
  } catch (error) {
    console.error("Refresh session error:", error)
    return false
  }
}

/**
 * Verifica si una sesión está próxima a expirar (menos de 1 hora)
 */
export function isSessionExpiringSoon(session: SessionData): boolean {
  const now = Math.floor(Date.now() / 1000)
  const oneHour = 60 * 60
  return session.exp - now < oneHour
}

