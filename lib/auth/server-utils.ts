import { headers } from "next/headers"
import { getSession, SessionData } from "./session-manager"

/**
 * Información del usuario extraída de la sesión
 * Disponible en Server Components y API Routes
 */
export interface ServerUser {
  sub: string
  email: string
  name?: string
  picture?: string
  role: "Organizador" | "Proveedor" | "Pagador"
  provider: "google" | "microsoft" | "meta"
}

/**
 * Obtiene el usuario actual desde la sesión
 * Para usar en Server Components y API Routes
 */
export async function getCurrentUser(): Promise<ServerUser | null> {
  try {
    const session = await getSession()
    
    if (!session) {
      return null
    }

    return {
      sub: session.sub,
      email: session.email,
      name: session.name,
      picture: session.picture,
      role: session.role,
      provider: session.provider,
    }
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

/**
 * Requiere que el usuario esté autenticado
 * Lanza un error si no hay sesión válida
 */
export async function requireAuth(): Promise<ServerUser> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error("Unauthorized: No valid session")
  }
  
  return user
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export async function requireRole(
  allowedRoles: Array<"Organizador" | "Proveedor" | "Pagador">
): Promise<ServerUser> {
  const user = await requireAuth()
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Forbidden: Required role ${allowedRoles.join(" or ")}`)
  }
  
  return user
}

/**
 * Obtiene información del usuario desde headers del middleware
 * Útil cuando el middleware ya procesó la request
 */
export async function getUserFromHeaders(): Promise<ServerUser | null> {
  try {
    const headersList = await headers()
    const sub = headersList.get("X-User-Sub")
    const email = headersList.get("X-User-Email")
    const role = headersList.get("X-User-Role") as ServerUser["role"]
    const provider = headersList.get("X-User-Provider") as ServerUser["provider"]

    if (!sub || !email || !role || !provider) {
      return null
    }

    return {
      sub,
      email,
      role,
      provider,
    }
  } catch (error) {
    console.error("Get user from headers error:", error)
    return null
  }
}

/**
 * Verifica si una sesión es válida
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Obtiene el rol del usuario actual
 */
export async function getCurrentUserRole(): Promise<ServerUser["role"] | null> {
  const user = await getCurrentUser()
  return user?.role || null
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export async function hasRole(role: ServerUser["role"]): Promise<boolean> {
  const currentRole = await getCurrentUserRole()
  return currentRole === role
}

/**
 * Obtiene el email del usuario actual
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.email || null
}

