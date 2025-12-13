import { redirect } from "next/navigation"
import { getSession, isTemporarySession } from "@/lib/auth/session-manager"
import { SelectRoleForm } from "@/components/select-role-form"

/**
 * Página de selección de rol
 * Server Component que valida sesión y renderiza el formulario
 */
export default async function SelectRolePage() {
  // Obtener sesión
  const session = await getSession()

  // Validar sesión temporal con needsRoleSelection
  if (!session) {
    redirect("/")
  }

  if (!isTemporarySession(session) || !session.needsRoleSelection) {
    redirect("/")
  }

  const availableRoles = session.availableRoles || []
  const userName = session.name || session.email

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src="/logo.svg" 
            alt="GSSC Logo" 
            className="h-16 w-auto"
          />
        </div>

        {/* Card de selección */}
        <div className="bg-card rounded-xl border border-border shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              ¡Bienvenido, {userName}!
            </h1>
            <p className="text-muted-foreground">
              Tienes múltiples roles asignados. Selecciona con cuál deseas continuar.
            </p>
          </div>

          {/* Formulario de selección */}
          <SelectRoleForm 
            availableRoles={availableRoles}
            userEmail={session.email}
          />

          {/* Nota */}
          <p className="text-xs text-muted-foreground text-center mt-6">
            Podrás cambiar de rol más adelante desde tu perfil.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿Problemas para acceder?{" "}
          <a href="mailto:soporte@glamur-ssc.com" className="text-primary hover:underline">
            Contacta soporte
          </a>
        </p>
      </div>
    </main>
  )
}

