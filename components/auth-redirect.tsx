"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getDefaultRouteByRole } from "@/lib/menu-config"

/**
 * Componente para redirigir usuarios autenticados desde la página de login
 * Se ejecuta en el cliente como verificación adicional al middleware
 */
export function AuthRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay sesión en localStorage
    const userStr = localStorage.getItem("user")
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        
        if (user && user.role) {
          console.log("🔄 [CLIENT] Usuario autenticado detectado en login, redirigiendo...")
          
          // Obtener ruta por defecto según el rol
          const defaultRoute = getDefaultRouteByRole(user.role)
          
          // Redirigir
          router.replace(defaultRoute)
        }
      } catch (error) {
        console.error("❌ [CLIENT] Error al parsear usuario de localStorage:", error)
        // Si hay error, limpiar localStorage
        localStorage.clear()
      }
    }
  }, [router])

  // No renderizar nada
  return null
}

