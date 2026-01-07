"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PaymentEligibilityResponse } from "@/lib/types/billing/types"

interface EligibilityStatusProps {
  className?: string
}

/**
 * Componente que muestra el estado de elegibilidad para recibir pagos
 * 
 * Consulta el endpoint /api/settings/billing/eligibility y muestra:
 * - Verde: Elegible para recibir pagos
 * - Rojo: No elegible con mensaje de requisitos faltantes
 */
export function EligibilityStatus({ className }: EligibilityStatusProps) {
  const [eligibility, setEligibility] = useState<PaymentEligibilityResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkEligibility = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/settings/billing/eligibility")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al verificar elegibilidad")
      }

      setEligibility(result.data)
    } catch (err) {
      console.error("Error checking eligibility:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkEligibility()
  }, [])

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-3 p-4 bg-muted/50 rounded-lg", className)}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Verificando elegibilidad...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900", className)}>
        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            No se pudo verificar la elegibilidad
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400">{error}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={checkEligibility}
          className="shrink-0"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Reintentar
        </Button>
      </div>
    )
  }

  if (!eligibility) {
    return null
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border",
        eligibility.eligible
          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
          : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
        className
      )}
    >
      {eligibility.eligible ? (
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
      ) : (
        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p
          className={cn(
            "text-sm font-medium",
            eligibility.eligible
              ? "text-green-800 dark:text-green-200"
              : "text-red-800 dark:text-red-200"
          )}
        >
          {eligibility.eligible
            ? "Elegible para recibir pagos"
            : "No elegible para recibir pagos"}
        </p>
        <p
          className={cn(
            "text-xs mt-1",
            eligibility.eligible
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          )}
        >
          {eligibility.message}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={checkEligibility}
        className="shrink-0"
      >
        <RefreshCw className="h-4 w-4" />
        <span className="sr-only">Actualizar</span>
      </Button>
    </div>
  )
}

