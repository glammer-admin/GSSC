import { LoginForm } from "@/components/login-form"
import { AuthRedirect } from "@/components/auth-redirect"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {/* Verificar sesión del cliente y redirigir si existe */}
      <AuthRedirect />
      <LoginForm />
    </div>
  )
}
