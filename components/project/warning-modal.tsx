"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from "lucide-react"

export type WarningType = "commission" | "packaging" | "delivery" | "pause" | "finish"

interface WarningConfig {
  title: string
  description: string
  impact: string[]
  confirmText: string
}

const WARNING_CONFIGS: Record<WarningType, WarningConfig> = {
  commission: {
    title: "Cambio de comisión",
    description: "Estás a punto de modificar la comisión del proyecto.",
    impact: [
      "Este cambio afectará el precio de todos los productos del proyecto.",
      "Los pedidos existentes no se verán afectados.",
    ],
    confirmText: "Confirmar cambio",
  },
  packaging: {
    title: "Cambio de packaging",
    description: "Estás a punto de modificar la opción de packaging personalizado.",
    impact: [
      "Este cambio solo aplicará a nuevos productos.",
      "Los productos existentes mantendrán su configuración actual.",
    ],
    confirmText: "Confirmar cambio",
  },
  delivery: {
    title: "Cambio de modos de entrega",
    description: "Estás a punto de modificar los modos de entrega del proyecto.",
    impact: [
      "Este cambio afectará las opciones de entrega disponibles.",
      "Los pedidos existentes no se verán afectados.",
    ],
    confirmText: "Confirmar cambio",
  },
  pause: {
    title: "Pausar proyecto",
    description: "Este proyecto tiene pedidos en curso.",
    impact: [
      "Los pedidos existentes continuarán su proceso normal de entrega.",
      "No se aceptarán nuevos pedidos mientras el proyecto esté pausado.",
    ],
    confirmText: "Confirmar pausa",
  },
  finish: {
    title: "Finalizar proyecto",
    description: "Esta acción es permanente.",
    impact: [
      "El proyecto no podrá reactivarse después de finalizado.",
      "Los pedidos en curso continuarán su proceso normal.",
    ],
    confirmText: "Finalizar proyecto",
  },
}

interface WarningModalProps {
  open: boolean
  type: WarningType | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/**
 * Modal de advertencia para cambios que impactan productos o pedidos
 */
export function WarningModal({
  open,
  type,
  onOpenChange,
  onConfirm,
}: WarningModalProps) {
  if (!type) return null
  
  const config = WARNING_CONFIGS[type]
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <AlertDialogTitle>{config.title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>{config.description}</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {config.impact.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {config.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

