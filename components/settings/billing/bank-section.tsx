"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { BankAccountList } from "./bank-account-list"
import { BankInfoForm } from "./bank-info"
import { VerificationStatusDisplay } from "./verification-status"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { BankAccount, BankInfo, VerificationStatus } from "@/lib/types/billing/types"

interface BankSectionProps {
  accounts: BankAccount[]
  bankInfo: Partial<BankInfo>
  onBankInfoChange: (value: Partial<BankInfo>) => void
  onFileChange: (file: File | undefined) => void
  onAccountsChange: (accounts: BankAccount[]) => void
  errors?: Partial<Record<keyof BankInfo, string>>
  disabled?: boolean
  verificationStatus?: VerificationStatus | null
}

/**
 * Sección de información bancaria con soporte para múltiples cuentas.
 * 
 * Comportamiento (v2.2):
 * - Si no hay cuentas: muestra formulario automáticamente (RN-30)
 * - Si hay cuentas: muestra lista con radio buttons (RN-31, RN-32)
 * - Radio buttons habilitados solo si active + verified (RN-33)
 * - Cuentas inactivas en gris con botón "Reactivar" (RN-34)
 * - No se puede inactivar cuenta preferida (RN-35)
 * - Cambio de preferida requiere confirmación (RN-36)
 */
export function BankSection({
  accounts,
  bankInfo,
  onBankInfoChange,
  onFileChange,
  onAccountsChange,
  errors = {},
  disabled = false,
  verificationStatus,
}: BankSectionProps) {
  // Estado para mostrar formulario de nueva cuenta
  const [showForm, setShowForm] = useState(accounts.length === 0)
  const [isLoading, setIsLoading] = useState(false)

  // RN-30: Si no hay cuentas, mostrar formulario automáticamente
  const shouldShowList = accounts.length > 0 && !showForm

  // Handler para agregar nueva cuenta
  const handleAddAccount = useCallback(() => {
    setShowForm(true)
    // Limpiar el formulario
    onBankInfoChange({})
  }, [onBankInfoChange])

  // Handler para volver a la lista
  const handleBackToList = useCallback(() => {
    setShowForm(false)
  }, [])

  // Handler para activar cuenta
  const handleActivate = useCallback(async (accountId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/settings/billing/accounts/${accountId}/activate`, {
        method: "POST",
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || result.error || "Error al activar la cuenta")
      }

      // Actualizar la lista de cuentas
      const updatedAccounts = accounts.map(a => 
        a.id === accountId ? { ...a, is_active: true } : a
      )
      onAccountsChange(updatedAccounts)
      
      toast.success("Cuenta reactivada exitosamente")
    } catch (error) {
      console.error("Error activating account:", error)
      toast.error(error instanceof Error ? error.message : "Error al activar la cuenta")
    } finally {
      setIsLoading(false)
    }
  }, [accounts, onAccountsChange])

  // Handler para inactivar cuenta
  const handleDeactivate = useCallback(async (accountId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/settings/billing/accounts/${accountId}/deactivate`, {
        method: "POST",
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        // Manejar error específico de cuenta preferida
        if (result.error === "CANNOT_INACTIVATE_PREFERRED") {
          throw new Error(result.message || "No puede inactivar la cuenta preferida")
        }
        throw new Error(result.message || result.error || "Error al inactivar la cuenta")
      }

      // Actualizar la lista de cuentas
      const updatedAccounts = accounts.map(a => 
        a.id === accountId ? { ...a, is_active: false } : a
      )
      onAccountsChange(updatedAccounts)
      
      toast.success("Cuenta inactivada exitosamente")
    } catch (error) {
      console.error("Error deactivating account:", error)
      toast.error(error instanceof Error ? error.message : "Error al inactivar la cuenta")
    } finally {
      setIsLoading(false)
    }
  }, [accounts, onAccountsChange])

  // Handler para marcar como preferida
  const handleSetPreferred = useCallback(async (accountId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/settings/billing/accounts/${accountId}/preferred`, {
        method: "POST",
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        // Manejar errores específicos
        if (result.error === "CANNOT_SET_PREFERRED_INACTIVE") {
          throw new Error(result.message || "Cuenta inactiva. Reactívela primero")
        }
        if (result.error === "CANNOT_SET_PREFERRED_UNVERIFIED") {
          throw new Error(result.message || "Solo cuentas verificadas pueden ser preferidas")
        }
        throw new Error(result.message || result.error || "Error al seleccionar la cuenta")
      }

      // Actualizar la lista de cuentas (desmarcar la anterior, marcar la nueva)
      const updatedAccounts = accounts.map(a => ({
        ...a,
        is_preferred: a.id === accountId,
      }))
      onAccountsChange(updatedAccounts)
      
      toast.success("Cuenta preferida actualizada exitosamente")
    } catch (error) {
      console.error("Error setting preferred account:", error)
      toast.error(error instanceof Error ? error.message : "Error al seleccionar la cuenta")
    } finally {
      setIsLoading(false)
    }
  }, [accounts, onAccountsChange])

  return (
    <div className="space-y-6">
      {shouldShowList ? (
        <>
          {/* Lista de cuentas con radio buttons */}
          <BankAccountList
            accounts={accounts}
            onAddAccount={handleAddAccount}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onSetPreferred={handleSetPreferred}
            isLoading={isLoading || disabled}
          />

          {/* Estado de verificación de la cuenta preferida */}
          {verificationStatus && (
            <VerificationStatusDisplay status={verificationStatus} />
          )}
        </>
      ) : (
        <>
          {/* Botón para volver a la lista (si hay cuentas) */}
          {accounts.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                disabled={disabled}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a la lista
              </Button>
            </div>
          )}

          {/* Formulario de nueva cuenta */}
          <BankInfoForm
            value={bankInfo}
            onChange={onBankInfoChange}
            onFileChange={onFileChange}
            errors={errors}
            disabled={disabled || isLoading}
          />

          {/* Estado de verificación (solo si es edición de cuenta existente) */}
          {verificationStatus && accounts.length === 0 && (
            <VerificationStatusDisplay status={verificationStatus} />
          )}
        </>
      )}
    </div>
  )
}

