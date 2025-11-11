"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { getDefaultRouteByRole } from "@/lib/menu-config"
import { generateMockToken } from "@/lib/auth/mock-sso"
import { isDevelopment } from "@/lib/config/env"

export function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)

  const handleSSOLogin = async (provider: string) => {
    setLoading(true)
    setSelectedProvider(provider)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200))

      // En desarrollo, generar token mock
      let idToken: string
      if (isDevelopment()) {
        console.log("🎭 [DEV] Generando token mock para desarrollo")
        idToken = generateMockToken(provider as "google" | "microsoft" | "meta")
      } else {
        // En staging/producción, usar SDK real del proveedor
        console.log("🔒 [PROD] Obteniendo token real de SSO")
        // TODO: Implementar obtención de token real con SDK
        // Por ahora, lanzar error para que se implemente
        throw new Error("SSO real no implementado aún. Configura los SDKs de SSO.")
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
        alert(`Error de login: ${data.message || "Error desconocido"}`)
        setLoading(false)
        setSelectedProvider(null)
      }
    } catch (error) {
      console.error("SSO Login error:", error)
      alert(`Error: ${error instanceof Error ? error.message : "Error de conexión"}`)
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
    {
      id: "meta",
      name: "Meta",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm0 22c-5.5 0-10-4.5-10-10S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10zm3.5-11c1.9 0 3.5-1.6 3.5-3.5S17.4 4 15.5 4 12 5.6 12 7.5s1.6 3.5 3.5 3.5zm-7 0c1.9 0 3.5-1.6 3.5-3.5S8.4 4 6.5 4 3 5.6 3 7.5 4.6 11 6.5 11zm3.5 8c-3.3 0-6.2-1.9-7.7-4.7.5 0 1 .1 1.5.1 2.1 0 4.1-.7 5.7-1.9 1.6 1.3 3.6 1.9 5.7 1.9.5 0 1-.1 1.5-.1-1.5 2.8-4.4 4.7-7.7 4.7z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-2 border-primary bg-card shadow-xl">
        <CardContent className="pt-8 pb-8">
          {/* Logo y titulo */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 mb-4">
              <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <p className="text-secondary text-sm">Gestión y Seguimiento de Servicios al Cliente</p>
          </div>

          {/* Divider */}
          <div className="mb-6 h-px bg-border"></div>

          {/* SSO Buttons */}
          <div className="space-y-3 mb-6">
            {providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleSSOLogin(provider.id)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-secondary hover:bg-opacity-90 text-secondary-foreground rounded-lg transition-all duration-200 border-2 border-secondary hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group font-medium"
              >
                <div
                  className={`${
                    selectedProvider === provider.id && loading
                      ? "animate-spin"
                      : "group-hover:scale-110 transition-transform"
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

          {/* Demo Info */}
          <div className="p-4 bg-muted/20 border-2 border-muted rounded-lg">
            <p className="text-muted font-semibold mb-1 text-xs">MODO DEMOSTRACIÓN</p>
            <p className="text-foreground/70 text-xs">
              Haz clic en cualquier botón SSO para simular el login y ver todas las interacciones del dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
