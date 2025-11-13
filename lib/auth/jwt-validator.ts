import { JWTPayload, jwtVerify, importJWK } from "jose"
import { shouldUseRealSSO, logger } from "@/lib/config/env"
import { validateMockToken, isMockToken } from "./mock-sso"

interface GoogleJWK {
  keys: Array<{
    kid: string
    kty: string
    alg: string
    use: string
    n: string
    e: string
  }>
}

interface MicrosoftJWK {
  keys: Array<{
    kid: string
    kty: string
    use: string
    alg: string
    n: string
    e: string
  }>
}

interface TokenPayload extends JWTPayload {
  sub: string
  email: string
  name?: string
  picture?: string
  email_verified?: boolean
}

// Cache de claves públicas para evitar múltiples llamadas
const jwkCache = new Map<string, { keys: any; timestamp: number }>()
const CACHE_DURATION = 3600000 // 1 hora

/**
 * Obtiene las claves públicas de Google
 */
async function getGooglePublicKeys(): Promise<GoogleJWK> {
  const cached = jwkCache.get("google")
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.keys
  }

  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs")
  if (!response.ok) {
    throw new Error("Failed to fetch Google public keys")
  }

  const keys = await response.json()
  jwkCache.set("google", { keys, timestamp: Date.now() })
  return keys
}

/**
 * Obtiene las claves públicas de Microsoft
 */
async function getMicrosoftPublicKeys(): Promise<MicrosoftJWK> {
  const cached = jwkCache.get("microsoft")
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.keys
  }

  const response = await fetch(
    "https://login.microsoftonline.com/common/discovery/v2.0/keys"
  )
  if (!response.ok) {
    throw new Error("Failed to fetch Microsoft public keys")
  }

  const keys = await response.json()
  jwkCache.set("microsoft", { keys, timestamp: Date.now() })
  return keys
}

/**
 * Obtiene las claves públicas de Meta/Facebook
 */
async function getMetaPublicKeys(): Promise<any> {
  const cached = jwkCache.get("meta")
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.keys
  }

  // Meta usa App Secret para validar, no JWK
  // Necesitarás configurar esto en variables de entorno
  return { appSecret: process.env.META_APP_SECRET }
}

/**
 * Valida un ID Token de Google
 */
export async function validateGoogleToken(token: string): Promise<TokenPayload> {
  try {
    const jwks = await getGooglePublicKeys()
    
    // Decodificar header para obtener kid
    const [headerB64] = token.split(".")
    const header = JSON.parse(Buffer.from(headerB64, "base64").toString())
    
    // Buscar la clave correcta
    const key = jwks.keys.find((k) => k.kid === header.kid)
    if (!key) {
      throw new Error("Public key not found")
    }

    // Importar la clave pública
    const publicKey = await importJWK(key, key.alg)

    // Verificar el token
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    // Validar campos requeridos
    if (!payload.sub || !payload.email) {
      throw new Error("Missing required fields in token")
    }

    return payload as TokenPayload
  } catch (error) {
    console.error("Google token validation error:", error)
    throw new Error("Invalid Google token")
  }
}

/**
 * Valida un ID Token de Microsoft
 */
export async function validateMicrosoftToken(token: string): Promise<TokenPayload> {
  try {
    const jwks = await getMicrosoftPublicKeys()
    
    // Decodificar header para obtener kid
    const [headerB64] = token.split(".")
    const header = JSON.parse(Buffer.from(headerB64, "base64").toString())
    
    // Buscar la clave correcta
    const key = jwks.keys.find((k) => k.kid === header.kid)
    if (!key) {
      throw new Error("Public key not found")
    }

    // Importar la clave pública
    const publicKey = await importJWK(key, key.alg)

    // Verificar el token - Microsoft usa /common para multi-tenant
    const { payload } = await jwtVerify(token, publicKey, {
      audience: process.env.MICROSOFT_CLIENT_ID,
      // No validar issuer específico porque usamos /common (multi-tenant)
    })

    console.log("🔍 [MICROSOFT] Token payload:", payload)

    // Validar campos requeridos - Microsoft puede usar 'preferred_username' en lugar de 'email'
    if (!payload.sub) {
      throw new Error("Missing sub field in token")
    }

    // Microsoft puede tener el email en diferentes campos
    const email = (payload.email || payload.preferred_username || payload.upn) as string
    if (!email) {
      throw new Error("Missing email field in token")
    }

    // Normalizar el payload
    return {
      ...payload,
      email,
      name: payload.name || email,
    } as TokenPayload
  } catch (error) {
    console.error("❌ [MICROSOFT] Token validation error:", error)
    if (error instanceof Error) {
      throw new Error(`Invalid Microsoft token: ${error.message}`)
    }
    throw new Error("Invalid Microsoft token")
  }
}

/**
 * Valida un ID Token de Meta/Facebook
 */
export async function validateMetaToken(token: string): Promise<TokenPayload> {
  try {
    // Meta usa un enfoque diferente - validación con App Secret
    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET

    // Verificar el token con la API de Meta
    const response = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${appId}|${appSecret}`
    )

    if (!response.ok) {
      throw new Error("Failed to validate Meta token")
    }

    const data = await response.json()

    if (!data.data.is_valid) {
      throw new Error("Invalid Meta token")
    }

    // Obtener información del usuario
    const userResponse = await fetch(
      `https://graph.facebook.com/me?fields=id,email,name,picture&access_token=${token}`
    )

    if (!userResponse.ok) {
      throw new Error("Failed to fetch Meta user data")
    }

    const userData = await userResponse.json()

    return {
      sub: userData.id,
      email: userData.email,
      name: userData.name,
      picture: userData.picture?.data?.url,
    } as TokenPayload
  } catch (error) {
    console.error("Meta token validation error:", error)
    throw new Error("Invalid Meta token")
  }
}

/**
 * Valida un ID Token según el proveedor
 * En desarrollo, usa mock SSO
 * En staging/producción, usa SSO real
 */
export async function validateIdToken(
  token: string,
  provider: "google" | "microsoft" | "meta"
): Promise<TokenPayload> {
  // En desarrollo, permitir tokens mock
  if (!shouldUseRealSSO() && isMockToken(token)) {
    logger.debug("Usando mock SSO para desarrollo")
    return validateMockToken(token, provider) as Promise<TokenPayload>
  }

  // En staging/producción, usar SSO real
  logger.info("Usando SSO real", { provider })
  
  switch (provider) {
    case "google":
      return validateGoogleToken(token)
    case "microsoft":
      return validateMicrosoftToken(token)
    case "meta":
      return validateMetaToken(token)
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

