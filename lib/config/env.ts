/**
 * Configuración de ambientes
 * Detecta automáticamente el ambiente actual
 */

export type Environment = "development" | "staging" | "production"

/**
 * Obtiene el ambiente actual
 */
export function getEnvironment(): Environment {
  const env = process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || "development"
  
  if (env === "production") return "production"
  if (env === "staging") return "staging"
  return "development"
}

/**
 * Verifica si estamos en desarrollo
 */
export function isDevelopment(): boolean {
  return getEnvironment() === "development"
}

/**
 * Verifica si estamos en staging
 */
export function isStaging(): boolean {
  return getEnvironment() === "staging"
}

/**
 * Verifica si estamos en producción
 */
export function isProduction(): boolean {
  return getEnvironment() === "production"
}

/**
 * Configuración por ambiente
 */
export const envConfig = {
  development: {
    useRealSSO: false,
    sessionDuration: 24 * 60 * 60, // 24 horas
    logLevel: "debug",
    apiUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/",
    secureCookies: false,
    cookieDomain: process.env.COOKIE_DOMAIN || ".glam-urban.dev",
  },
  staging: {
    useRealSSO: true,
    sessionDuration: 24 * 60 * 60, // 24 horas
    logLevel: "info",
    apiUrl: process.env.NEXT_PUBLIC_STAGING_URL || "https://stagin-gssc.glam-urban.com/",
    secureCookies: true,
    cookieDomain: process.env.COOKIE_DOMAIN || ".glam-urban.com",
  },
  production: {
    useRealSSO: true,
    sessionDuration: 12 * 60 * 60, // 12 horas
    logLevel: "error",
    apiUrl: process.env.NEXT_PUBLIC_PRODUCTION_URL || "https://gssc.glam-urban.com/",
    secureCookies: true,
    cookieDomain: process.env.COOKIE_DOMAIN || ".glam-urban.com",
  },
}

/**
 * Obtiene la configuración del ambiente actual
 */
export function getConfig() {
  return envConfig[getEnvironment()]
}

/**
 * Verifica si se debe usar SSO real o simulado
 */
export function shouldUseRealSSO(): boolean {
  return getConfig().useRealSSO
}

/**
 * Obtiene el nivel de log para el ambiente actual
 */
export function getLogLevel(): string {
  return getConfig().logLevel
}

/**
 * Logger adaptativo según el ambiente
 */
export const logger = {
  debug: (...args: any[]) => {
    if (getLogLevel() === "debug") {
      console.log("🐛 [DEBUG]", ...args)
    }
  },
  info: (...args: any[]) => {
    if (["debug", "info"].includes(getLogLevel())) {
      console.info("ℹ️ [INFO]", ...args)
    }
  },
  warn: (...args: any[]) => {
    console.warn("⚠️ [WARN]", ...args)
  },
  error: (...args: any[]) => {
    console.error("❌ [ERROR]", ...args)
  },
}

