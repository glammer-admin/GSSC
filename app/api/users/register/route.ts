import { NextRequest, NextResponse } from "next/server"
import { 
  getSession, 
  setSessionCookie,
  setTemporarySessionCookie,
  isTemporarySession,
} from "@/lib/auth/session-manager"
import { getUsersClient } from "@/lib/http/users/users-client"
import { 
  ROLE_DASHBOARD_MAP,
  AVAILABLE_ROLES_FOR_REGISTRATION,
  type UserRole,
  type CreateUserDTO,
  type DeliveryAddress,
} from "@/lib/http/users/types"
import { HttpError, NetworkError } from "@/lib/http/client"
import { ERROR_CODES, formatErrorLog } from "@/lib/errors/error-codes"

// Esquema de validación del formulario
interface RegisterFormData {
  name: string
  phone_number: string
  delivery_address: DeliveryAddress
  roles: UserRole[]
}

/**
 * Valida los datos del formulario de registro
 */
function validateFormData(data: RegisterFormData): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validar nombre
  if (!data.name || data.name.trim().length < 3) {
    errors.push("El nombre debe tener al menos 3 caracteres")
  }

  // Validar teléfono (formato internacional)
  const phoneRegex = /^\+?[1-9]\d{6,14}$/
  if (!data.phone_number || !phoneRegex.test(data.phone_number.replace(/\s/g, ""))) {
    errors.push("Formato de teléfono inválido")
  }

  // Validar dirección
  if (!data.delivery_address) {
    errors.push("La dirección de entrega es obligatoria")
  } else {
    if (!data.delivery_address.street || data.delivery_address.street.length < 10) {
      errors.push("La dirección debe tener al menos 10 caracteres")
    }
    if (!data.delivery_address.city || data.delivery_address.city.length < 2) {
      errors.push("La ciudad es obligatoria")
    }
    if (!data.delivery_address.state || data.delivery_address.state.length < 2) {
      errors.push("El departamento/estado es obligatorio")
    }
    if (!data.delivery_address.country || data.delivery_address.country.length < 2) {
      errors.push("El país es obligatorio")
    }
  }

  // Validar roles
  if (!data.roles || data.roles.length === 0) {
    errors.push("Debe seleccionar al menos un rol")
  } else {
    // Verificar que los roles sean válidos para registro
    const invalidRoles = data.roles.filter(
      role => !AVAILABLE_ROLES_FOR_REGISTRATION.includes(role)
    )
    if (invalidRoles.length > 0) {
      errors.push(`Roles no válidos para registro: ${invalidRoles.join(", ")}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * POST /api/users/register
 * Endpoint para registrar un nuevo usuario desde el formulario de onboarding
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Obtener sesión actual
    const session = await getSession()
    
    if (!session) {
      console.error("❌ [REGISTER] No session found")
      return NextResponse.json(
        { error: "No session found", message: "Please login first" },
        { status: 401 }
      )
    }

    // 2. Verificar que sea una sesión temporal con needsOnboarding
    if (!isTemporarySession(session) || !session.needsOnboarding) {
      console.error("❌ [REGISTER] Session does not require onboarding")
      return NextResponse.json(
        { error: "Invalid session state", message: "Onboarding not required" },
        { status: 400 }
      )
    }

    // 3. Obtener datos del body
    const body = await request.json()
    const formData: RegisterFormData = {
      name: body.name,
      phone_number: body.phone_number,
      delivery_address: body.delivery_address,
      roles: body.roles,
    }

    console.log("📝 [REGISTER] Registration request for:", session.email)
    console.log("📝 [REGISTER] Form data:", { ...formData, email: session.email })

    // 4. Validar datos del formulario
    const validation = validateFormData(formData)
    if (!validation.valid) {
      console.error("❌ [REGISTER] Validation errors:", validation.errors)
      return NextResponse.json(
        { error: "Validation failed", errors: validation.errors },
        { status: 400 }
      )
    }

    // 5. Preparar datos para crear usuario
    const createUserData: CreateUserDTO = {
      name: formData.name.trim(),
      email: session.email, // Email viene del token SSO validado
      role: formData.roles,
      phone_number: formData.phone_number.replace(/\s/g, ""),
      status: "Active",
      delivery_address: {
        street: formData.delivery_address.street.trim(),
        city: formData.delivery_address.city.trim(),
        state: formData.delivery_address.state.trim(),
        country: formData.delivery_address.country.trim(),
        additional_info: formData.delivery_address.additional_info?.trim(),
      },
    }

    // 6. Crear usuario en la base de datos
    console.log("📝 [REGISTER] Creating user in database...")
    
    const usersClient = getUsersClient()
    const createdUser = await usersClient.createUser(createUserData)

    console.log("✅ [REGISTER] User created successfully:", createdUser.id)

    // 7. Determinar siguiente paso según cantidad de roles
    if (formData.roles.length === 1) {
      // Usuario con un solo rol - crear sesión completa
      const userRole = formData.roles[0]
      const redirectUrl = ROLE_DASHBOARD_MAP[userRole]

      console.log("✅ [REGISTER] Single role, creating complete session:", userRole)

      await setSessionCookie({
        sub: session.sub,
        email: session.email,
        name: formData.name,
        picture: session.picture,
        provider: session.provider,
        role: userRole,
        userId: createdUser.id,
      })

      return NextResponse.json(
        {
          success: true,
          user: {
            id: createdUser.id,
            email: createdUser.email,
            name: createdUser.name,
            role: userRole,
          },
          redirect: redirectUrl,
        },
        { status: 201 }
      )
    }

    // Usuario con múltiples roles - necesita seleccionar
    console.log("✅ [REGISTER] Multiple roles, redirecting to role selection")

    await setTemporarySessionCookie({
      sub: session.sub,
      email: session.email,
      name: formData.name,
      picture: session.picture,
      provider: session.provider,
      role: null,
      needsRoleSelection: true,
      availableRoles: formData.roles,
    })

    return NextResponse.json(
      {
        success: true,
        user: {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
        },
        needsRoleSelection: true,
        availableRoles: formData.roles,
        redirect: "/select-role",
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("❌ [REGISTER] Error:", error)
    
    // Error de red - redirigir a página de error
    if (error instanceof NetworkError) {
      const errorCode = ERROR_CODES.REG_NET_001.code
      console.error(formatErrorLog(errorCode, error.message))
      return NextResponse.json(
        { 
          error: true,
          message: ERROR_CODES.REG_NET_001.userMessage,
          redirect: `/error?code=${errorCode}`
        },
        { status: 503 }
      )
    }
    
    // Error del servidor - redirigir a página de error
    if (error instanceof HttpError && error.status >= 500) {
      const errorCode = ERROR_CODES.REG_SRV_001.code
      console.error(formatErrorLog(errorCode, `HTTP ${error.status}: ${error.statusText}`))
      return NextResponse.json(
        { 
          error: true,
          message: ERROR_CODES.REG_SRV_001.userMessage,
          redirect: `/error?code=${errorCode}`
        },
        { status: 503 }
      )
    }
    
    const errorMessage = error instanceof Error ? error.message : "Failed to register user"
    
    // Verificar si es error de duplicado - mostrar inline (usuario puede corregir)
    if (errorMessage.includes("duplicate") || errorMessage.includes("unique")) {
      const errorCode = ERROR_CODES.REG_DUP_001.code
      console.error(formatErrorLog(errorCode, errorMessage))
      return NextResponse.json(
        { 
          error: ERROR_CODES.REG_DUP_001.userMessage, 
          code: errorCode 
        },
        { status: 409 }
      )
    }
    
    // Error genérico - redirigir a página de error
    const errorCode = ERROR_CODES.ERR_GEN_000.code
    console.error(formatErrorLog(errorCode, errorMessage))
    return NextResponse.json(
      { 
        error: true,
        message: ERROR_CODES.ERR_GEN_000.userMessage,
        redirect: `/error?code=${errorCode}`
      },
      { status: 500 }
    )
  }
}

