"use client"

import { AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { VerificationStatus } from "@/lib/types/billing/types"
import { VERIFICATION_STATUS_CONFIG } from "@/lib/types/billing/types"

interface VerificationStatusDisplayProps {
  status: VerificationStatus | null
  className?: string
}

/**
 * Componente para mostrar el estado de verificación de la cuenta bancaria
 * 
 * Estados:
 * - Pendiente (amarillo): En proceso de verificación
 * - Verificada (verde): Cuenta validada
 * - Rechazada (rojo): Verificación fallida
 */
export function VerificationStatusDisplay({
  status,
  className,
}: VerificationStatusDisplayProps) {
  if (!status) {
    return null
  }

  const config = VERIFICATION_STATUS_CONFIG[status]

  const icons = {
    pending: Clock,
    verified: CheckCircle2,
    rejected: AlertCircle,
  }

  const Icon = icons[status]

  const variants = {
    pending: "default" as const,
    verified: "default" as const,
    rejected: "destructive" as const,
  }

  const alertStyles = {
    pending: "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 [&>svg]:text-yellow-600",
    verified: "border-green-500/50 bg-green-50 dark:bg-green-950/20 [&>svg]:text-green-600",
    rejected: "border-destructive/50 bg-destructive/10 [&>svg]:text-destructive",
  }

  const badgeStyles = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
    verified: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    rejected: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Estado de Verificación</h3>
        <Badge variant="outline" className={cn("font-medium", badgeStyles[status])}>
          <Icon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      </div>

      <Alert className={cn(alertStyles[status])}>
        <Icon className="h-4 w-4" />
        <AlertTitle>
          {status === "pending" && "Verificación en proceso"}
          {status === "verified" && "Cuenta verificada"}
          {status === "rejected" && "Verificación rechazada"}
        </AlertTitle>
        <AlertDescription>{config.message}</AlertDescription>
      </Alert>
    </div>
  )
}

