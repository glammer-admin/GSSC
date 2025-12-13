import { redirect } from "next/navigation"
import { getSession, isTemporarySession } from "@/lib/auth/session-manager"
import { OnboardingForm } from "@/components/onboarding-form"

/**
 * Página de onboarding para nuevos usuarios
 * Server Component que valida sesión y renderiza el formulario
 */
export default async function OnboardingPage() {
  // Obtener sesión
  const session = await getSession()

  // Validar sesión temporal con needsOnboarding
  if (!session) {
    redirect("/")
  }

  if (!isTemporarySession(session) || !session.needsOnboarding) {
    redirect("/")
  }

  // Datos pre-llenados del SSO
  const prefillData = {
    name: session.name || "",
    email: session.email,
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header con patrón decorativo */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.svg" 
              alt="GSSC Logo" 
              className="h-12 w-auto"
            />
          </div>

          {/* Título */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              ¡Completa tu perfil!
            </h1>
            <p className="text-muted-foreground">
              Solo necesitamos algunos datos más para configurar tu cuenta
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-card rounded-xl border border-border shadow-lg p-6 md:p-8">
          <OnboardingForm prefillData={prefillData} />
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-muted-foreground">
            Al registrarte, aceptas nuestros{" "}
            <a href="/terms" className="text-primary hover:underline">
              Términos de Servicio
            </a>{" "}
            y{" "}
            <a href="/privacy" className="text-primary hover:underline">
              Política de Privacidad
            </a>
          </p>
          <p className="text-xs text-muted-foreground">
            ¿Necesitas ayuda?{" "}
            <a href="mailto:soporte@glamur-ssc.com" className="text-primary hover:underline">
              Contacta soporte
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}

