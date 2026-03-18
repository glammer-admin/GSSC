import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { getConfig, isDevelopment } from "@/lib/config/env"

// Nombre de la cookie de sesión
export const SESSION_COOKIE_NAME = "gssc_session"

// Duración de la sesión (24 horas)
const SESSION_DURATION = 24 * 60 * 60 // 24 horas en segundos

// Duración del refresh token (7 días)
const REFRESH_DURATION = 7 * 24 * 60 * 60 // 7 días en segundos

// Tipos de rol de sesión (en inglés, igual que la BD)
export type SessionRole = "buyer" | "organizer" | "supplier"

// Datos de sesión completa (usuario validado con rol)
export interface SessionData {
  sub: string // ID del usuario (subject — OAuth provider sub)
  email: string
  name?: string
  picture?: string
  provider: "google" | "microsoft" | "meta"
  role: SessionRole
  userId?: string // UUID de glam_users (solo si está registrado)
  // Supabase Auth tokens
  supabaseAccessToken: string  // JWT emitido por Supabase Auth (usado como Bearer en REST API)
  supabaseRefreshToken: string // Para renovar el access token
  authId: string               // auth.users.id (UUID de Supabase Auth)
  iat: number // Issued at
  exp: number // Expiration
}

// Datos de sesión temporal (antes de validar BD)
export interface TemporarySessionData {
  sub: string
  email: string
  name?: string
  picture?: string
  provider: "google" | "microsoft" | "meta"
  role: null // Sin rol asignado aún
  needsOnboarding?: boolean // Usuario nuevo, necesita registro
  needsRoleSelection?: boolean // Usuario con múltiples roles
  availableRoles?: string[] // Roles disponibles para selección
  // Supabase tokens — present from the callback step, preserved through onboarding/set-role
  supabaseAccessToken?: string
  supabaseRefreshToken?: string
  authId?: string
  iat: number
  exp: number
}

// Unión de ambos tipos de sesión
export type AnySessionData = SessionData | TemporarySessionData

/**
 * Verifica si una sesión es temporal
 */
export function isTemporarySession(session: AnySessionData): session is TemporarySessionData {
  return session.role === null || 
         ('needsOnboarding' in session && session.needsOnboarding === true) ||
         ('needsRoleSelection' in session && session.needsRoleSelection === true)
}

/**
 * Verifica si una sesión está completa
 */
export function isCompleteSession(session: AnySessionData): session is SessionData {
  return session.role !== null && 
         !('needsOnboarding' in session && session.needsOnboarding) &&
         !('needsRoleSelection' in session && session.needsRoleSelection)
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
 * Crea un token de sesión temporal JWT firmado
 */
export async function createTemporarySessionToken(
  data: Omit<TemporarySessionData, "iat" | "exp">
): Promise<string> {
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
export async function verifySessionToken(token: string): Promise<AnySessionData> {
  try {
    const secret = getSecretKey()
    const { payload } = await jwtVerify(token, secret, {
      issuer: "gssc-platform",
      audience: "gssc-users",
    })

    return payload as unknown as AnySessionData
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
  console.log("🍪 [SESSION] Creating session token for:", sessionData.email)
  
  const token = await createSessionToken(sessionData)
  console.log("🍪 [SESSION] Token created, length:", token.length)
  
  const cookieStore = await cookies()
  const config = getConfig()

  console.log("🍪 [SESSION] Cookie config:", {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: "lax",
    maxAge: config.sessionDuration,
    path: "/",
    domain: config.cookieDomain,
  })

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true, // No accesible desde JavaScript
    secure: config.secureCookies, // Basado en ambiente
    sameSite: "lax", // Protección CSRF
    maxAge: config.sessionDuration, // Duración basada en ambiente
    path: "/", // Disponible en toda la app
    domain: config.cookieDomain, // Dominio basado en ambiente
  })
  
  console.log("✅ [SESSION] Cookie set successfully")
  
  // Verificar que se guardó
  const verification = cookieStore.get(SESSION_COOKIE_NAME)
  console.log("🔍 [SESSION] Cookie verification:", !!verification)
}

/**
 * Crea una cookie de sesión temporal
 */
export async function setTemporarySessionCookie(
  sessionData: Omit<TemporarySessionData, "iat" | "exp">
): Promise<void> {
  console.log("🍪 [SESSION] Creating TEMPORARY session token for:", sessionData.email)
  
  const token = await createTemporarySessionToken(sessionData)
  console.log("🍪 [SESSION] Temporary token created, length:", token.length)
  
  const cookieStore = await cookies()
  const config = getConfig()

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: "lax",
    maxAge: config.sessionDuration,
    path: "/",
    domain: config.cookieDomain,
  })

  console.log("✅ [SESSION] Temporary cookie set successfully")
}

/**
 * Actualiza la sesión con el rol seleccionado
 * Preserves Supabase tokens from the temporary session
 */
export async function updateSessionWithRole(
  currentSession: AnySessionData,
  role: SessionRole,
  userId?: string
): Promise<void> {
  console.log("🔄 [SESSION] Updating session with role:", role)

  const supabaseAccessToken = (currentSession as TemporarySessionData).supabaseAccessToken ?? (currentSession as SessionData).supabaseAccessToken ?? ""
  const supabaseRefreshToken = (currentSession as TemporarySessionData).supabaseRefreshToken ?? (currentSession as SessionData).supabaseRefreshToken ?? ""
  const authId = (currentSession as TemporarySessionData).authId ?? (currentSession as SessionData).authId ?? ""

  await setSessionCookie({
    sub: currentSession.sub,
    email: currentSession.email,
    name: currentSession.name,
    picture: currentSession.picture,
    provider: currentSession.provider,
    role,
    userId,
    supabaseAccessToken,
    supabaseRefreshToken,
    authId,
  })

  console.log("✅ [SESSION] Session updated with role:", role)
}

/**
 * Obtiene la sesión actual desde la cookie
 */
export async function getSession(): Promise<AnySessionData | null> {
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
 * Obtiene la sesión completa (no temporal)
 * Retorna null si la sesión es temporal
 */
export async function getCompleteSession(): Promise<SessionData | null> {
  const session = await getSession()
  if (!session || !isCompleteSession(session)) {
    return null
  }
  return session
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
    domain: config.cookieDomain,
  })
}

/**
 * Refresca la sesión extendiendo su tiempo de expiración.
 * Si la sesión está completa, también renueva el Supabase access token.
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const session = await getSession()
    if (!session) {
      return false
    }

    // Si es sesión completa, refrescarla
    if (isCompleteSession(session)) {
      let supabaseAccessToken = session.supabaseAccessToken
      let supabaseRefreshToken = session.supabaseRefreshToken

      // Renovar el token de Supabase si hay un refresh token disponible
      if (session.supabaseRefreshToken) {
        try {
          const { refreshSupabaseToken } = await import("@/lib/auth/supabase-admin")
          const renewed = await refreshSupabaseToken(session.supabaseRefreshToken)
          supabaseAccessToken = renewed.accessToken
          supabaseRefreshToken = renewed.refreshToken
          console.log("✅ [SESSION] Supabase token renewed during session refresh")
        } catch (err) {
          console.warn("⚠️ [SESSION] Could not renew Supabase token:", err)
        }
      }

      await setSessionCookie({
        sub: session.sub,
        email: session.email,
        name: session.name,
        picture: session.picture,
        provider: session.provider,
        role: session.role,
        userId: session.userId,
        supabaseAccessToken,
        supabaseRefreshToken,
        authId: session.authId,
      })
    } else {
      // Si es temporal, refrescar como temporal (sin renovar Supabase token)
      await setTemporarySessionCookie({
        sub: session.sub,
        email: session.email,
        name: session.name,
        picture: session.picture,
        provider: session.provider,
        role: null,
        needsOnboarding: session.needsOnboarding,
        needsRoleSelection: session.needsRoleSelection,
        availableRoles: session.availableRoles,
        supabaseAccessToken: session.supabaseAccessToken,
        supabaseRefreshToken: session.supabaseRefreshToken,
        authId: session.authId,
      })
    }

    return true
  } catch (error) {
    console.error("Refresh session error:", error)
    return false
  }
}

/**
 * Verifica si una sesión está próxima a expirar (menos de 1 hora)
 */
export function isSessionExpiringSoon(session: AnySessionData): boolean {
  const now = Math.floor(Date.now() / 1000)
  const oneHour = 60 * 60
  return session.exp - now < oneHour
}
