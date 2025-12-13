import { NextRequest, NextResponse } from "next/server"
import { 
  getSession, 
  updateSessionWithRole,
  isTemporarySession,
} from "@/lib/auth/session-manager"
import { 
  ROLE_DASHBOARD_MAP,
  type UserRole 
} from "@/lib/http/users/types"
import { getUsersClient } from "@/lib/http/users/users-client"

/**
 * POST /api/auth/set-role
 * Endpoint para seleccionar rol cuando el usuario tiene múltiples roles
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Obtener sesión actual
    const session = await getSession()
    
    if (!session) {
      console.error("❌ [SET ROLE] No session found")
      return NextResponse.json(
        { error: "No session found", message: "Please login first" },
        { status: 401 }
      )
    }

    // 2. Verificar que sea una sesión temporal con needsRoleSelection
    if (!isTemporarySession(session) || !session.needsRoleSelection) {
      console.error("❌ [SET ROLE] Session does not require role selection")
      return NextResponse.json(
        { error: "Invalid session state", message: "Role selection not required" },
        { status: 400 }
      )
    }

    // 3. Obtener rol del body
    const body = await request.json()
    const { role } = body as { role: string }

    if (!role) {
      console.error("❌ [SET ROLE] No role provided")
      return NextResponse.json(
        { error: "Missing role", message: "Role is required" },
        { status: 400 }
      )
    }

    console.log("🔄 [SET ROLE] Role selection request:", role)
    console.log("🔄 [SET ROLE] Available roles:", session.availableRoles)

    // 4. Validar que el rol esté en los roles disponibles
    if (!session.availableRoles?.includes(role)) {
      console.error("❌ [SET ROLE] Role not in available roles:", role)
      return NextResponse.json(
        { error: "Invalid role", message: "Rol no disponible para este usuario" },
        { status: 400 }
      )
    }

    // 5. Validar que el rol sea válido en el sistema
    const validRoles: UserRole[] = ["buyer", "organizer", "supplier"]
    if (!validRoles.includes(role as UserRole)) {
      console.error("❌ [SET ROLE] Invalid system role:", role)
      return NextResponse.json(
        { error: "Invalid role", message: "Rol no válido" },
        { status: 400 }
      )
    }

    // 6. Obtener userId de la BD
    let userId: string | undefined
    try {
      const usersClient = getUsersClient()
      const dbUser = await usersClient.getUserByEmail(session.email)
      userId = dbUser?.id
    } catch (error) {
      console.warn("⚠️ [SET ROLE] Could not fetch user ID:", error)
    }

    // 7. Obtener URL de redirección
    const userRole = role as UserRole
    const redirectUrl = ROLE_DASHBOARD_MAP[userRole]

    console.log("✅ [SET ROLE] Updating session with role:", userRole)

    // 8. Actualizar sesión con el rol seleccionado
    await updateSessionWithRole(session, userRole, userId)

    // 9. Retornar respuesta exitosa
    return NextResponse.json(
      {
        success: true,
        role: userRole,
        redirect: redirectUrl,
      },
      { status: 200 }
    )

  } catch (error) {
    console.error("❌ [SET ROLE] Error:", error)
    
    const errorMessage = error instanceof Error ? error.message : "Failed to set role"
    
    return NextResponse.json(
      { error: "Failed to set role", message: errorMessage },
      { status: 500 }
    )
  }
}

