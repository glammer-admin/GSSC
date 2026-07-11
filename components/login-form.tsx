"use client"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getDefaultRouteByRole } from "@/lib/menu-config"
import { generateMockToken } from "@/lib/auth/mock-sso"
import { isDevelopment } from "@/lib/config/env"
import { signInWithGoogle } from "@/lib/auth/google-oauth"
import { signInWithMicrosoft } from "@/lib/auth/microsoft-oauth"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [useRealSSO, setUseRealSSO] = useState(false)
  const [googleClientId, setGoogleClientId] = useState<string>("")
  const [microsoftClientId, setMicrosoftClientId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Verificar si viene de cancelación de registro
  useEffect(() => {
    if (searchParams.get("cancelled") === "true") {
      setSuccessMessage("Registro cancelado")
      // Limpiar el query param de la URL sin recargar
      router.replace("/", { scroll: false })
    }
  }, [searchParams, router])

  // Verificar si hay credenciales configuradas
  useEffect(() => {
    // Google
    const googleId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (googleId && googleId !== "your-google-client-id.apps.googleusercontent.com") {
      setGoogleClientId(googleId)
      setUseRealSSO(true)
      console.log("✅ [GOOGLE] Credenciales configuradas, SSO real disponible")
    }
    
    // Microsoft
    const msId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID
    if (msId && msId !== "your-microsoft-client-id") {
      setMicrosoftClientId(msId)
      console.log("✅ [MICROSOFT] Credenciales configuradas, SSO real disponible")
    }
    
    if (!googleId && !msId) {
      console.log("🎭 [DEV] Usando Mock SSO (no hay credenciales)")
    }
  }, [])

  const handleSSOLogin = async (provider: string) => {
    setLoading(true)
    setSelectedProvider(provider)
    setError(null) // Limpiar errores anteriores

    try {
      let idToken: string

      // Usar SSO real para Google si está configurado
      if (provider === "google" && useRealSSO && googleClientId) {
        console.log("🔒 [GOOGLE] Iniciando Google Sign-In real...")
        console.log("🔒 [GOOGLE] Client ID:", googleClientId.substring(0, 20) + "...")
        
        // Google usa redirect completo, no retorna inmediatamente
        // El flujo continúa en /api/auth/google/callback
        await signInWithGoogle(googleClientId)
        
        // Este código no se ejecutará porque signInWithGoogle hace un redirect
        return
      } else if (provider === "microsoft" && microsoftClientId) {
        console.log("🔒 [MICROSOFT] Iniciando Microsoft Sign-In real...")
        console.log("🔒 [MICROSOFT] Client ID:", microsoftClientId.substring(0, 20) + "...")
        
        // Microsoft usa redirect completo, no retorna inmediatamente
        // El flujo continúa en /api/auth/microsoft/callback
        await signInWithMicrosoft(microsoftClientId)
        
        // Este código no se ejecutará porque signInWithMicrosoft hace un redirect
        return
      } else {
        // Usar Mock SSO
        console.log(`🎭 [DEV] Generando token mock para ${provider}`)
        await new Promise((resolve) => setTimeout(resolve, 800))
        idToken = generateMockToken(provider as "google" | "microsoft" | "meta")
      }

      // Enviar token al backend para validación
      const response = await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          idToken, 
          provider 
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Guardar en localStorage (temporal para compatibilidad)
        localStorage.setItem("user", JSON.stringify(data.user))
        
        // Redirigir según el rol
        router.push(data.redirect)
      } else {
        console.error("Login failed:", data)
        
        // Si hay una URL de redirección de error, redirigir a ella
        if (data.redirect) {
          router.push(data.redirect)
          return
        }
        
        // Fallback: mostrar error en el formulario
        setError(data.message || "Error al procesar la autenticación. Por favor, intenta nuevamente.")
        setLoading(false)
        setSelectedProvider(null)
      }
    } catch (error) {
      console.error("SSO Login error:", error)
      const errorMessage = error instanceof Error ? error.message : "Error de conexión con el servidor"
      setError(`Error de autenticación: ${errorMessage}`)
      setLoading(false)
      setSelectedProvider(null)
    }
  }

  const providers = [
    {
      id: "google",
      name: "Google",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      ),
    },
    {
      id: "microsoft",
      name: "Microsoft",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <rect x="1" y="1" width="9" height="9" fill="#F25022" />
          <rect x="12" y="1" width="11" height="9" fill="#7FBA00" />
          <rect x="1" y="12" width="9" height="11" fill="#00A4EF" />
          <rect x="12" y="12" width="11" height="11" fill="#FFB900" />
        </svg>
      ),
    },
  ]

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4 bg-[linear-gradient(150deg,var(--secondary)_0%,#0d3b48_55%,#08252e_100%)]">
      {/* Blobs decorativos — reusan --accent (amarillo) y --primary (oliva) */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(246,183,23,0.10),transparent_40%),radial-gradient(circle_at_85%_80%,rgba(85,107,47,0.22),transparent_45%)]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[430px] rounded-[20px] bg-card pt-11 pb-8 px-10 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)]">
        {/* Logo */}
        <div className="flex justify-center">
          <img src="/logo-glam-urban.png" alt="GLAM URBAN" className="h-[124px] w-auto" />
        </div>

        {/* Título + subtítulo */}
        <div className="mt-6 mb-[30px] text-center">
          <div className="text-[22px] font-extrabold tracking-[-0.01em] text-foreground">
            GLAM Self Service Customer
          </div>
          <div className="mt-1.5 text-[13.5px] leading-[1.5] text-muted-foreground">
            Plataforma de autogestión para clientes de Glam Urban.
            <br />
            Ingresa con tu cuenta de Google o Microsoft para continuar.
          </div>
        </div>

        {/* Divider con label, estilo GBO "Single Sign-On" */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            Inicio de Sesión Único
          </div>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* SSO Buttons */}
        <div className="mb-6 space-y-3">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleSSOLogin(provider.id)}
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-[11px] border-[1.5px] border-input bg-card px-[18px] py-[14px] text-[15px] font-semibold text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 hover:border-secondary hover:bg-muted hover:shadow-[0_4px_14px_-4px_rgba(21,84,101,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div
                className={`${
                  selectedProvider === provider.id && loading
                    ? "animate-spin"
                    : "transition-transform group-hover:scale-110"
                }`}
              >
                {selectedProvider === provider.id && loading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  provider.icon
                )}
              </div>
              <span>
                {selectedProvider === provider.id && loading ? "Autenticando..." : `Continuar con ${provider.name}`}
              </span>
            </button>
          ))}
        </div>

        {/* Success Message (e.g., registration cancelled) */}
        {successMessage && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-2 rounded-lg border-2 border-border bg-muted p-4 duration-300">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-foreground font-medium text-sm">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Cerrar mensaje"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="animate-in fade-in slide-in-from-top-2 rounded-lg border-2 border-destructive/50 bg-destructive/10 p-4 duration-300">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-destructive font-semibold mb-1 text-sm">Error de Autenticación</p>
                <p className="text-destructive/90 text-xs leading-relaxed">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-destructive/70 hover:text-destructive transition-colors"
                aria-label="Cerrar mensaje de error"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
