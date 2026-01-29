import { SessionData } from "@/lib/auth/session-manager"
import { ClientNavbar } from "@/components/client-navbar"

interface ServerAuthenticatedLayoutProps {
  session: SessionData
  children: React.ReactNode
}

/**
 * Layout autenticado para Server Components
 * Recibe la sesión validada desde el servidor
 */
export function ServerAuthenticatedLayout({ session, children }: ServerAuthenticatedLayoutProps) {
  // Convertir SessionData a formato User para el Navbar
  const user = {
    name: session.name || session.email,
    email: session.email,
    avatar: session.picture,
    role: session.role,
    provider: session.provider,
  }

  return (
    <div className="flex min-h-screen bg-background">
      <ClientNavbar user={user} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}

