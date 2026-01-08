"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Plus,
  Power,
  PowerOff,
  Star,
} from "lucide-react"
import type { BankAccount, VerificationStatus } from "@/lib/types/billing/types"
import { ACCOUNT_TYPES, VERIFICATION_STATUS_CONFIG } from "@/lib/types/billing/types"

interface BankAccountListProps {
  accounts: BankAccount[]
  onAddAccount: () => void
  onActivate: (accountId: string) => Promise<void>
  onDeactivate: (accountId: string) => Promise<void>
  onSetPreferred: (accountId: string) => Promise<void>
  isLoading?: boolean
}

/**
 * Lista de cuentas bancarias en formato tabla con radio buttons para seleccionar la preferida.
 * 
 * Comportamiento:
 * - Radio button habilitado solo si: is_active=true AND status=verified
 * - Cuentas inactivas en gris con icono "Reactivar"
 * - No se puede inactivar la cuenta preferida
 * - Tooltips de ayuda en restricciones y acciones
 */
export function BankAccountList({
  accounts,
  onAddAccount,
  onActivate,
  onDeactivate,
  onSetPreferred,
  isLoading = false,
}: BankAccountListProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(
    accounts.find(a => a.is_preferred)?.id
  )
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Encontrar cuenta preferida actual
  const preferredAccount = accounts.find(a => a.is_preferred)

  // Verificar si una cuenta puede ser seleccionada como preferida
  const canBePreferred = (account: BankAccount): boolean => {
    return account.is_active && account.status === "verified"
  }

  // Obtener tooltip para radio button deshabilitado
  const getDisabledTooltip = (account: BankAccount): string => {
    if (!account.is_active) {
      return "Cuenta inactiva. Reactívela primero"
    }
    if (account.status !== "verified") {
      return "Solo cuentas verificadas pueden ser seleccionadas"
    }
    return ""
  }

  // Obtener tooltip para botón inactivar
  const getDeactivateTooltip = (account: BankAccount): string => {
    if (account.is_preferred) {
      return "No puede inactivar la cuenta preferida. Seleccione otra primero"
    }
    return "Inactivar cuenta"
  }

  // Formatear número de cuenta (mostrar solo últimos 4 dígitos)
  const formatAccountNumber = (number: string): string => {
    if (number.length <= 4) return number
    return `****${number.slice(-4)}`
  }

  // Obtener icono y color de estado
  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case "verified":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  // Obtener nombre del tipo de cuenta
  const getAccountTypeName = (type: string): string => {
    return ACCOUNT_TYPES.find(t => t.id === type)?.name || type
  }

  // Handler para cambio de selección
  const handleSelectionChange = (accountId: string) => {
    setSelectedAccountId(accountId)
  }

  // Handler para confirmar selección
  const handleConfirmSelection = async () => {
    if (!selectedAccountId || selectedAccountId === preferredAccount?.id) return
    
    setActionLoading(selectedAccountId)
    try {
      await onSetPreferred(selectedAccountId)
    } finally {
      setActionLoading(null)
    }
  }

  // Handler para activar cuenta
  const handleActivate = async (accountId: string) => {
    setActionLoading(accountId)
    try {
      await onActivate(accountId)
    } finally {
      setActionLoading(null)
    }
  }

  // Handler para inactivar cuenta
  const handleDeactivate = async (accountId: string) => {
    setActionLoading(accountId)
    try {
      await onDeactivate(accountId)
    } finally {
      setActionLoading(null)
    }
  }

  // Verificar si hay cambio pendiente de confirmar
  const hasSelectionChanged = selectedAccountId && selectedAccountId !== preferredAccount?.id

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header con botón agregar */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Cuentas Bancarias</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddAccount}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar cuenta
          </Button>
        </div>

        {/* Tabla de cuentas con radio buttons */}
        <RadioGroup
          value={selectedAccountId}
          onValueChange={handleSelectionChange}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[80px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => {
                const isPreferred = account.is_preferred
                const canSelect = canBePreferred(account)
                const isInactive = !account.is_active
                const isLoadingThis = actionLoading === account.id

                return (
                  <TableRow 
                    key={account.id} 
                    className={`group transition-colors ${
                      isInactive 
                        ? "bg-muted/50 opacity-60" 
                        : ""
                    }`}
                  >
                    {/* Radio button */}
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <RadioGroupItem
                              value={account.id}
                              id={account.id}
                              disabled={!canSelect || isLoading || isLoadingThis}
                              className={!canSelect ? "cursor-not-allowed" : ""}
                            />
                          </div>
                        </TooltipTrigger>
                        {!canSelect && (
                          <TooltipContent>
                            <p>{getDisabledTooltip(account)}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TableCell>

                    {/* Banco */}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {account.bank_name}
                        {isPreferred && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cuenta preferida</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {isInactive && (
                          <Badge variant="secondary">Inactiva</Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Tipo de cuenta */}
                    <TableCell>{getAccountTypeName(account.account_type)}</TableCell>

                    {/* Número de cuenta */}
                    <TableCell className="tabular-nums">
                      {formatAccountNumber(account.account_number)}
                    </TableCell>

                    {/* Estado */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(account.status)}
                        <span className={`text-${VERIFICATION_STATUS_CONFIG[account.status].color}-600`}>
                          {VERIFICATION_STATUS_CONFIG[account.status].label}
                        </span>
                      </div>
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {isInactive ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleActivate(account.id)}
                                disabled={isLoading || isLoadingThis}
                              >
                                <Power className="h-4 w-4 text-green-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Reactivar cuenta</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDeactivate(account.id)}
                                  disabled={isPreferred || isLoading || isLoadingThis}
                                >
                                  <PowerOff className={`h-4 w-4 ${isPreferred ? "text-muted-foreground" : "text-red-600"}`} />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{getDeactivateTooltip(account)}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </RadioGroup>

        {/* Botón confirmar selección */}
        {hasSelectionChanged && (
          <div className="flex justify-end">
            <Button
              onClick={handleConfirmSelection}
              disabled={isLoading || !!actionLoading}
            >
              Confirmar selección
            </Button>
          </div>
        )}

        {/* Mensaje si no hay cuentas verificadas */}
        {accounts.length > 0 && !accounts.some(a => a.status === "verified" && a.is_active) && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No hay cuentas verificadas disponibles para seleccionar como preferida.
            Las cuentas deben estar activas y verificadas.
          </p>
        )}
      </div>
    </TooltipProvider>
  )
}
