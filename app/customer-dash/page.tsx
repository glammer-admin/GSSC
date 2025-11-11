import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session-manager"
import { ServerAuthenticatedLayout } from "@/components/server-authenticated-layout"

export default async function CustomerDashboard() {
  // SSR: Validar sesión en el servidor
  const session = await getSession()
  
  if (!session) {
    redirect("/")
  }
  
  // Verificar rol
  if (session.role !== "Proveedor") {
    // Redirigir al dashboard correcto según el rol
    if (session.role === "Organizador") {
      redirect("/dashboard")
    } else if (session.role === "Pagador") {
      redirect("/product/1234asdf")
    }
  }

  return (
    <ServerAuthenticatedLayout session={session}>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard Proveedor</h1>
          <p className="text-muted-foreground mt-2">Bienvenido, {session.name || session.email}</p>
          <p className="text-sm text-muted-foreground">Rol: {session.role} | Provider: {session.provider}</p>
        </div>
      </div>
    </ServerAuthenticatedLayout>
  )
}

