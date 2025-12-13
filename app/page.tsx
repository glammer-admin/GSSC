import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"
import { AuthRedirect } from "@/components/auth-redirect"

function LoginFormFallback() {
  return (
    <div className="w-full max-w-md animate-pulse">
      <div className="h-64 bg-muted rounded-lg" />
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {/* Verificar sesión del cliente y redirigir si existe */}
      <AuthRedirect />
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
