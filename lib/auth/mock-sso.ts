/**
 * Mock de SSO para desarrollo
 * Simula respuestas de Google, Microsoft y Meta
 */

interface MockTokenPayload {
  sub: string
  email: string
  name: string
  picture: string
  email_verified: boolean
}

/**
 * Usuarios de prueba para desarrollo
 */
const mockUsers = {
  google: {
    sub: "mock_google_12345",
    email: "organizador@example.com",
    name: "Juan Organizador",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=google",
    email_verified: true,
  },
  microsoft: {
    sub: "mock_microsoft_67890",
    email: "proveedor@example.com",
    name: "María Proveedora",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=microsoft",
    email_verified: true,
  },
  meta: {
    sub: "mock_meta_11111",
    email: "pagador@example.com",
    name: "Carlos Pagador",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=meta",
    email_verified: true,
  },
}

/**
 * Valida un token mock de Google
 */
export async function validateMockGoogleToken(token: string): Promise<MockTokenPayload> {
  console.log("🎭 [MOCK] Validando token de Google (desarrollo)")
  
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // Validación básica del token
  if (!token || token.length < 10) {
    throw new Error("Invalid mock token")
  }
  
  return mockUsers.google
}

/**
 * Valida un token mock de Microsoft
 */
export async function validateMockMicrosoftToken(token: string): Promise<MockTokenPayload> {
  console.log("🎭 [MOCK] Validando token de Microsoft (desarrollo)")
  
  await new Promise(resolve => setTimeout(resolve, 300))
  
  if (!token || token.length < 10) {
    throw new Error("Invalid mock token")
  }
  
  return mockUsers.microsoft
}

/**
 * Valida un token mock de Meta
 */
export async function validateMockMetaToken(token: string): Promise<MockTokenPayload> {
  console.log("🎭 [MOCK] Validando token de Meta (desarrollo)")
  
  await new Promise(resolve => setTimeout(resolve, 300))
  
  if (!token || token.length < 10) {
    throw new Error("Invalid mock token")
  }
  
  return mockUsers.meta
}

/**
 * Genera un token mock para testing
 */
export function generateMockToken(provider: "google" | "microsoft" | "meta"): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `mock_${provider}_token_${timestamp}_${random}`
}

/**
 * Valida un token mock según el proveedor
 */
export async function validateMockToken(
  token: string,
  provider: "google" | "microsoft" | "meta"
): Promise<MockTokenPayload> {
  switch (provider) {
    case "google":
      return validateMockGoogleToken(token)
    case "microsoft":
      return validateMockMicrosoftToken(token)
    case "meta":
      return validateMockMetaToken(token)
    default:
      throw new Error(`Unsupported mock provider: ${provider}`)
  }
}

/**
 * Verifica si un token es un token mock
 */
export function isMockToken(token: string): boolean {
  return token.startsWith("mock_")
}

/**
 * Obtiene información del usuario mock para un proveedor
 */
export function getMockUserInfo(provider: "google" | "microsoft" | "meta"): MockTokenPayload {
  return mockUsers[provider]
}

