/**
 * Microsoft OAuth Helper con Authorization Code Flow + PKCE
 * Usa redirect completo (más natural que popup)
 */

export interface MicrosoftUser {
  sub: string
  email: string
  name: string
  picture?: string
}

/**
 * Inicia Microsoft Sign-In con redirect completo en la misma ventana
 */
export async function signInWithMicrosoft(clientId: string): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Microsoft Sign-In solo funciona en el navegador")
  }

  console.log("🔒 [MICROSOFT] Iniciando Authorization Code Flow + PKCE con redirect...")

  // 1. Generar PKCE code_verifier y code_challenge
  const codeVerifier = generateCodeVerifier()
  const state = generateState()
  
  // Guardar en sessionStorage para el callback
  sessionStorage.setItem("pkce_code_verifier", codeVerifier)
  sessionStorage.setItem("pkce_state", state)
  sessionStorage.setItem("pkce_provider", "microsoft")

  // 2. Generar code_challenge a partir del code_verifier
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  
  // 3. Configuración de la URL de callback
  const redirectUri = `${window.location.origin}/api/auth/microsoft/callback`
  const scope = "openid email profile User.Read"

  // 4. URL de autorización de Microsoft con PKCE
  const authUrl = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("scope", scope)
  authUrl.searchParams.set("state", state)
  authUrl.searchParams.set("code_challenge", codeChallenge)
  authUrl.searchParams.set("code_challenge_method", "S256")
  authUrl.searchParams.set("response_mode", "query")
  authUrl.searchParams.set("prompt", "select_account")

  console.log("🔒 [MICROSOFT] Redirigiendo a Microsoft...")
  console.log("🔒 [MICROSOFT] Redirect URI:", redirectUri)

  // 5. Hacer redirect completo
  window.location.href = authUrl.toString()
}

/**
 * Genera un code_verifier aleatorio para PKCE (43-128 caracteres)
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

/**
 * Genera el code_challenge a partir del code_verifier usando SHA-256
 */
async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return base64UrlEncode(new Uint8Array(hash))
}

/**
 * Codifica en Base64 URL-safe (sin padding)
 */
function base64UrlEncode(array: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...array))
  return base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

/**
 * Genera un state aleatorio para prevenir CSRF
 */
function generateState(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

