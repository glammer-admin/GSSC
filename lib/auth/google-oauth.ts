/**
 * Google OAuth Helper con Authorization Code Flow + PKCE
 * Usa redirect completo (más natural y seguro que Implicit Flow)
 */

export interface GoogleUser {
  sub: string
  email: string
  name: string
  picture: string
  email_verified: boolean
}

/**
 * Inicia Google Sign-In con Authorization Code Flow + PKCE
 * Usa redirect completo en la misma ventana
 */
export async function signInWithGoogle(clientId: string): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Google Sign-In solo funciona en el navegador")
  }

  console.log("🔒 [GOOGLE] Iniciando Authorization Code Flow + PKCE con redirect...")

  // 1. Generar PKCE code_verifier y code_challenge
  const codeVerifier = generateCodeVerifier()
  const state = generateState()
  
  // Guardar en sessionStorage para el callback
  sessionStorage.setItem("pkce_code_verifier", codeVerifier)
  sessionStorage.setItem("pkce_state", state)
  sessionStorage.setItem("pkce_provider", "google")

  // 2. Generar code_challenge a partir del code_verifier
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  
  // 3. Configuración de la URL de callback
  const redirectUri = `${window.location.origin}/api/auth/google/callback`
  const scope = "openid email profile"

  // 4. URL de autorización de Google con PKCE
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("response_type", "code")
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("scope", scope)
  authUrl.searchParams.set("state", state)
  authUrl.searchParams.set("code_challenge", codeChallenge)
  authUrl.searchParams.set("code_challenge_method", "S256")
  authUrl.searchParams.set("access_type", "offline")
  authUrl.searchParams.set("prompt", "select_account")

  console.log("🔒 [GOOGLE] Redirigiendo a Google...")
  console.log("🔒 [GOOGLE] Redirect URI:", redirectUri)

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

// ============================================================================
// FUNCIONES LEGACY (No usadas, mantenerlas por compatibilidad si es necesario)
// ============================================================================

function initializeGoogleSignIn_LEGACY(
  clientId: string,
  resolve: (token: string) => void,
  reject: (error: Error) => void
) {
  const google = (window as any).google

  if (!google) {
    reject(new Error("Google SDK no disponible"))
    return
  }

  // Timeout de seguridad - si no responde en 30 segundos, rechazar
  const timeout = setTimeout(() => {
    reject(new Error("Tiempo de espera agotado. Por favor, intenta nuevamente."))
  }, 30000)

  // Inicializar Google Identity Services
  try {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: any) => {
        clearTimeout(timeout)
        if (response.credential) {
          console.log("✅ [GOOGLE] ID Token obtenido")
          resolve(response.credential)
        } else if (response.error) {
          console.error("❌ [GOOGLE] Error en callback:", response.error)
          reject(new Error(`Error de Google: ${response.error}`))
        } else {
          reject(new Error("No se recibió credential de Google"))
        }
      },
      error_callback: (error: any) => {
        clearTimeout(timeout)
        console.error("❌ [GOOGLE] Error callback:", error)
        reject(new Error(`Error de autenticación: ${error.type || "desconocido"}`))
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    })

    // Mostrar el prompt de Google
    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed()) {
        clearTimeout(timeout)
        console.log("⚠️ [GOOGLE] Prompt no mostrado, usando popup como fallback")
        showGooglePopup(clientId, resolve, reject)
      } else if (notification.isSkippedMoment()) {
        clearTimeout(timeout)
        console.log("⚠️ [GOOGLE] Usuario cerró el prompt")
        reject(new Error("Popup cerrado. Por favor, intenta nuevamente."))
      } else if (notification.getDismissedReason()) {
        clearTimeout(timeout)
        const reason = notification.getDismissedReason()
        console.log("⚠️ [GOOGLE] Prompt cerrado:", reason)
        if (reason === "credential_returned") {
          // El usuario ya seleccionó, esperar callback
          return
        }
        reject(new Error("Proceso cancelado por el usuario"))
      }
    })
  } catch (error) {
    clearTimeout(timeout)
    console.error("❌ [GOOGLE] Error al inicializar:", error)
    reject(new Error("Error al inicializar Google Sign-In"))
  }
}

function showGooglePopup(
  clientId: string,
  resolve: (token: string) => void,
  reject: (error: Error) => void
) {
  const google = (window as any).google

  try {
    // Crear un contenedor temporal para el botón
    const buttonDiv = document.createElement("div")
    buttonDiv.style.display = "none"
    document.body.appendChild(buttonDiv)

    google.accounts.id.renderButton(buttonDiv, {
      theme: "outline",
      size: "large",
      type: "standard",
    })

    // Simular click en el botón
    const button = buttonDiv.querySelector("div[role='button']")
    if (button) {
      ;(button as HTMLElement).click()
      
      // Limpiar después de 1 segundo
      setTimeout(() => {
        buttonDiv.remove()
      }, 1000)
    } else {
      buttonDiv.remove()
      reject(new Error("No se pudo iniciar Google Sign-In. Verifica tu configuración."))
    }
  } catch (error) {
    console.error("❌ [GOOGLE] Error en popup:", error)
    reject(new Error("Error al mostrar popup de Google"))
  }
}

/**
 * Alternativa: Google OAuth 2.0 con popup
 */
export function signInWithGooglePopup(clientId: string): Promise<string> {
  const redirectUri = `${window.location.origin}/api/auth/google/callback`
  const scope = "openid email profile"
  const responseType = "id_token token"
  const nonce = generateNonce()

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  authUrl.searchParams.set("client_id", clientId)
  authUrl.searchParams.set("redirect_uri", redirectUri)
  authUrl.searchParams.set("response_type", responseType)
  authUrl.searchParams.set("scope", scope)
  authUrl.searchParams.set("nonce", nonce)
  authUrl.searchParams.set("prompt", "select_account")

  return new Promise((resolve, reject) => {
    const width = 500
    const height = 600
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    const popup = window.open(
      authUrl.toString(),
      "Google Sign In",
      `width=${width},height=${height},left=${left},top=${top}`
    )

    if (!popup) {
      reject(new Error("No se pudo abrir popup. Verifica que no esté bloqueado."))
      return
    }

    // Escuchar el mensaje del popup
    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data.type === "GOOGLE_AUTH_SUCCESS") {
        window.removeEventListener("message", messageHandler)
        popup?.close()
        resolve(event.data.idToken)
      } else if (event.data.type === "GOOGLE_AUTH_ERROR") {
        window.removeEventListener("message", messageHandler)
        popup?.close()
        reject(new Error(event.data.error || "Error en autenticación"))
      }
    }

    window.addEventListener("message", messageHandler)

    // Verificar si el popup fue cerrado
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        window.removeEventListener("message", messageHandler)
        reject(new Error("Popup cerrado por el usuario"))
      }
    }, 1000)
  })
}

function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

