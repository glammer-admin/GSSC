"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  ROLE_DISPLAY_NAMES, 
  AVAILABLE_ROLES_FOR_REGISTRATION,
  type UserRole 
} from "@/lib/http/users/types"

interface OnboardingFormProps {
  prefillData: {
    name: string
    email: string
  }
}

interface FormData {
  name: string
  phone_number: string
  city: string
  state: string
  country: string
  street: string
  additional_info: string
  roles: UserRole[]
}

interface FormErrors {
  name?: string
  phone_number?: string
  city?: string
  state?: string
  country?: string
  street?: string
  roles?: string
}

export function OnboardingForm({ prefillData }: OnboardingFormProps) {
  const router = useRouter()
  
  const [formData, setFormData] = useState<FormData>({
    name: prefillData.name,
    phone_number: "",
    city: "",
    state: "",
    country: "Colombia",
    street: "",
    additional_info: "",
    roles: ["buyer"], // Pre-seleccionado
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validar nombre
    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres"
    }

    // Validar teléfono
    const phoneRegex = /^\+?[1-9]\d{6,14}$/
    const cleanPhone = formData.phone_number.replace(/\s/g, "")
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      newErrors.phone_number = "Formato de teléfono inválido (ej: +573201234567)"
    }

    // Validar ciudad
    if (!formData.city || formData.city.trim().length < 2) {
      newErrors.city = "La ciudad es obligatoria"
    }

    // Validar departamento/estado
    if (!formData.state || formData.state.trim().length < 2) {
      newErrors.state = "El departamento es obligatorio"
    }

    // Validar país
    if (!formData.country || formData.country.trim().length < 2) {
      newErrors.country = "El país es obligatorio"
    }

    // Validar dirección
    if (!formData.street || formData.street.trim().length < 10) {
      newErrors.street = "La dirección debe tener al menos 10 caracteres"
    }

    // Validar roles
    if (formData.roles.length === 0) {
      newErrors.roles = "Debe seleccionar al menos un rol"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleRoleToggle = (role: UserRole) => {
    setFormData(prev => {
      const newRoles = prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
      return { ...prev, roles: newRoles }
    })
    // Limpiar error de roles
    if (errors.roles) {
      setErrors(prev => ({ ...prev, roles: undefined }))
    }
  }

  const handleCancel = async () => {
    setIsCancelling(true)

    try {
      // Llamar al endpoint de logout para eliminar la sesión
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      // Limpiar localStorage si el servidor lo indica
      if (data.clearStorage) {
        localStorage.removeItem("user")
      }

      // Redirigir a la página de login con mensaje de cancelación
      router.push("/?cancelled=true")
    } catch (error) {
      console.error("Error cancelling registration:", error)
      // Incluso si hay error, intentar redirigir
      router.push("/?cancelled=true")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setErrorCode(null)

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone_number: formData.phone_number.replace(/\s/g, ""),
          delivery_address: {
            street: formData.street.trim(),
            city: formData.city.trim(),
            state: formData.state.trim(),
            country: formData.country.trim(),
            additional_info: formData.additional_info.trim() || undefined,
          },
          roles: formData.roles,
        }),
      })

      const data = await response.json()

      // Si hay error con redirect, ir a página de error
      if (data.error && data.redirect) {
        router.push(data.redirect)
        return
      }

      if (!response.ok) {
        // Guardar código de error si viene (para errores inline)
        if (data.code) {
          setErrorCode(data.code)
        }
        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(data.errors.join(". "))
        }
        throw new Error(data.message || data.error || "Error al registrar usuario")
      }

      // Redirigir según respuesta
      if (data.redirect) {
        router.push(data.redirect)
      }
    } catch (err) {
      console.error("Error registering user:", err)
      setSubmitError(err instanceof Error ? err.message : "Error al registrar usuario")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sección: Información Personal */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground border-b pb-2">
          Información Personal
        </h2>

        {/* Email (solo lectura) */}
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            value={prefillData.email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Este correo viene de tu cuenta de Google/Microsoft
          </p>
        </div>

        {/* Nombre */}
        <div className="space-y-2">
          <Label htmlFor="name">Nombre completo *</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Tu nombre completo"
            disabled={isLoading}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono celular *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone_number}
            onChange={(e) => handleInputChange("phone_number", e.target.value)}
            placeholder="+57 320 123 4567"
            disabled={isLoading}
            aria-invalid={!!errors.phone_number}
          />
          {errors.phone_number && (
            <p className="text-sm text-destructive">{errors.phone_number}</p>
          )}
        </div>
      </div>

      {/* Sección: Dirección de Entrega */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground border-b pb-2">
          Dirección de Entrega
        </h2>

        {/* Grid de ciudad, departamento, país */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ciudad */}
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad *</Label>
            <Input
              id="city"
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              placeholder="Bogotá"
              disabled={isLoading}
              aria-invalid={!!errors.city}
            />
            {errors.city && (
              <p className="text-sm text-destructive">{errors.city}</p>
            )}
          </div>

          {/* Departamento */}
          <div className="space-y-2">
            <Label htmlFor="state">Departamento *</Label>
            <Input
              id="state"
              type="text"
              value={formData.state}
              onChange={(e) => handleInputChange("state", e.target.value)}
              placeholder="Cundinamarca"
              disabled={isLoading}
              aria-invalid={!!errors.state}
            />
            {errors.state && (
              <p className="text-sm text-destructive">{errors.state}</p>
            )}
          </div>

          {/* País */}
          <div className="space-y-2">
            <Label htmlFor="country">País *</Label>
            <Input
              id="country"
              type="text"
              value={formData.country}
              onChange={(e) => handleInputChange("country", e.target.value)}
              placeholder="Colombia"
              disabled={isLoading}
              aria-invalid={!!errors.country}
            />
            {errors.country && (
              <p className="text-sm text-destructive">{errors.country}</p>
            )}
          </div>
        </div>

        {/* Dirección */}
        <div className="space-y-2">
          <Label htmlFor="street">Dirección *</Label>
          <Input
            id="street"
            type="text"
            value={formData.street}
            onChange={(e) => handleInputChange("street", e.target.value)}
            placeholder="Calle 123 #45-67"
            disabled={isLoading}
            aria-invalid={!!errors.street}
          />
          {errors.street && (
            <p className="text-sm text-destructive">{errors.street}</p>
          )}
        </div>

        {/* Info adicional */}
        <div className="space-y-2">
          <Label htmlFor="additional_info">Información adicional</Label>
          <Input
            id="additional_info"
            type="text"
            value={formData.additional_info}
            onChange={(e) => handleInputChange("additional_info", e.target.value)}
            placeholder="Apartamento 301, Torre B (opcional)"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Sección: Selección de Rol */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground border-b pb-2">
          ¿Cómo usarás la plataforma?
        </h2>
        <p className="text-sm text-muted-foreground">
          Puedes seleccionar uno o más roles. Si seleccionas varios, podrás elegir con cuál ingresar.
        </p>

        <div className="space-y-3">
          {AVAILABLE_ROLES_FOR_REGISTRATION.map((role) => {
            const isSelected = formData.roles.includes(role)
            
            return (
              <label
                key={role}
                className={`
                  flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${isSelected 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                  }
                  ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleRoleToggle(role)}
                  disabled={isLoading}
                  className="sr-only"
                />
                
                {/* Checkbox visual */}
                <div className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                  ${isSelected ? "bg-primary border-primary" : "border-muted-foreground"}
                `}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {/* Info del rol */}
                <div>
                  <span className={`font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {ROLE_DISPLAY_NAMES[role]}
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {role === "buyer" && "Compra productos y servicios de la plataforma"}
                    {role === "organizer" && "Organiza eventos y gestiona proyectos"}
                  </p>
                </div>
              </label>
            )
          })}
        </div>

        {errors.roles && (
          <p className="text-sm text-destructive">{errors.roles}</p>
        )}
      </div>

      {/* Error general */}
      {submitError && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          <p className="font-medium">Error al registrar</p>
          <p className="text-sm">{submitError}</p>
          {errorCode && (
            <p className="text-xs mt-2 font-mono text-muted-foreground">
              Código de referencia: {errorCode}
            </p>
          )}
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Botón de cancelar */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="sm:flex-1"
              disabled={isLoading || isCancelling}
            >
              {isCancelling ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Cancelando...
                </>
              ) : (
                "Cancelar"
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cancelar registro?</AlertDialogTitle>
              <AlertDialogDescription>
                Si cancelas ahora, perderás los datos ingresados y tendrás que iniciar sesión nuevamente para registrarte.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continuar editando</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sí, cancelar registro
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Botón de envío */}
        <Button 
          type="submit" 
          className="sm:flex-[2]" 
          size="lg"
          disabled={isLoading || isCancelling}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creando tu cuenta...
            </>
          ) : (
            "Completar Registro"
          )}
        </Button>
      </div>
    </form>
  )
}

