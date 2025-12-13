"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ROLE_DISPLAY_NAMES, type UserRole } from "@/lib/http/users/types"

interface SelectRoleFormProps {
  availableRoles: string[]
  userEmail: string
}

// Iconos para cada rol
const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  buyer: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  organizer: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  supplier: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
}

// Descripciones para cada rol
const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  buyer: "Compra productos y servicios de la plataforma",
  organizer: "Organiza eventos y gestiona proyectos",
  supplier: "Provee productos y servicios a organizadores",
}

export function SelectRoleForm({ availableRoles, userEmail }: SelectRoleFormProps) {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedRole) {
      setError("Por favor selecciona un rol")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: selectedRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Error al seleccionar rol")
      }

      // Redirigir al dashboard correspondiente
      if (data.redirect) {
        router.push(data.redirect)
      }
    } catch (err) {
      console.error("Error selecting role:", err)
      setError(err instanceof Error ? err.message : "Error al seleccionar rol")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Lista de roles */}
      <div className="space-y-3">
        {availableRoles.map((role) => {
          const userRole = role as UserRole
          const isSelected = selectedRole === role
          
          return (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              disabled={isLoading}
              className={`
                w-full p-4 rounded-lg border-2 text-left transition-all
                flex items-center gap-4
                ${isSelected 
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                  : "border-border hover:border-primary/50 hover:bg-accent/50"
                }
                ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {/* Icono */}
              <div className={`
                p-3 rounded-full 
                ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
              `}>
                {ROLE_ICONS[userRole]}
              </div>
              
              {/* Info */}
              <div className="flex-1">
                <h3 className={`font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                  {ROLE_DISPLAY_NAMES[userRole]}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {ROLE_DESCRIPTIONS[userRole]}
                </p>
              </div>

              {/* Indicador de selección */}
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${isSelected ? "border-primary bg-primary" : "border-muted-foreground"}
              `}>
                {isSelected && (
                  <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Botón de continuar */}
      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={!selectedRole || isLoading}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Procesando...
          </>
        ) : (
          "Continuar"
        )}
      </Button>
    </form>
  )
}

