import { SignJWT } from "jose"
import { cookies } from "next/headers"
import { getConfig, isDevelopment } from "@/lib/config/env"

// Re-export everything from gssc-authn so existing imports continue to work
export {
  SESSION_COOKIE_NAME,
  isTemporarySession,
  isCompleteSession,
  verifySessionToken,
  isSessionExpiringSoon,
  getSession,
  getCompleteSession,
} from "@glam-urban/gssc-authn"

export type {
  SessionData,
  TemporarySessionData,
  AnySessionData,
  SessionRole,
} from "@glam-urban/gssc-authn"

// Import types locally for use in write functions
import type { SessionData, TemporarySessionData, AnySessionData, SessionRole } from "@glam-urban/gssc-authn"
import { SESSION_COOKIE_NAME, isCompleteSession } from "@glam-urban/gssc-authn"

// Duración de la sesión (24 horas)
const SESSION_DURATION = 24 * 60 * 60 // 24 horas en segundos

/**
 * Obtiene la clave secreta para firmar tokens.
 * Usada solo para CREAR sesiones (las funciones de escritura).
 * La verificación usa gssc-authn (inicializado via instrumentation.ts).
 */
function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET

  if (!secret && isDevelopment()) {
    console.warn('⚠️ [DEV] Usando SESSION_SECRET por defecto para desarrollo local')
    return new TextEncoder().encode('dev-secret-key-for-local-development-only-do-not-use-in-production')
  }

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
 * Crea una cookie de sesión segura
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
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: "lax",
    maxAge: config.sessionDuration,
    path: "/",
    domain: config.cookieDomain,
  })

  console.log("✅ [SESSION] Cookie set successfully")

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
 * Elimina la cookie de sesión de forma segura
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.delete(SESSION_COOKIE_NAME)

  const config = getConfig()
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
    expires: new Date(0),
    domain: config.cookieDomain,
  })
}

/**
 * Refresca la sesión extendiendo su tiempo de expiración.
 * Si la sesión está completa, también renueva el Supabase access token.
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const { getSession } = await import("@glam-urban/gssc-authn")
    const session = await getSession()
    if (!session) {
      return false
    }

    if (isCompleteSession(session)) {
      let supabaseAccessToken = session.supabaseAccessToken
      let supabaseRefreshToken = session.supabaseRefreshToken

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
