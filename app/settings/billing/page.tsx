import { redirect } from "next/navigation"
import { getSession, isCompleteSession, type SessionData } from "@/lib/auth/session-manager"
import { loadBillingSettings } from "@/lib/mocks/billing-loader"
import { BillingForm } from "@/components/settings/billing/billing-form"

/**
 * Página de Configuración de Facturación y Pagos
 * 
 * Server Component que:
 * 1. Valida sesión y rol organizer
 * 2. Carga datos de facturación desde mocks
 * 3. Extrae user-data de la sesión para autocompletado
 * 4. Pasa datos al formulario Client Component
 */
export default async function BillingPage() {
  // SSR: Validar sesión en el servidor
  const session = await getSession()
  
  if (!session) {
    redirect("/")
  }
  
  // Verificar que la sesión sea completa
  if (!isCompleteSession(session)) {
    redirect("/")
  }

  // Verificar rol organizer
  if (session.role !== "organizer") {
    redirect("/")
  }

  // Usar el sub del usuario como organizerId (en producción sería el userId)
  const organizerId = session.userId || session.sub

  // Cargar datos de facturación desde mocks
  const billingSettings = loadBillingSettings(organizerId)

  // Extraer datos del usuario para autocompletado (si disponibles)
  // En esta implementación, usamos los datos de la sesión OAuth
  const userData = {
    name: session.name || "",
    email: session.email || "",
    // phone y address no están en la sesión OAuth, serían de user-data
    phone: "",
    address: "",
  }

  return (
    <div className="space-y-6">
      {/* Título de la sección */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Facturación y Pagos
        </h2>
        <p className="text-muted-foreground mt-1">
          Configura tu información fiscal y bancaria para recibir pagos
        </p>
      </div>

      {/* Formulario de configuración */}
      <BillingForm
        organizerId={organizerId}
        initialSettings={billingSettings}
        userData={userData}
      />
    </div>
  )
}

