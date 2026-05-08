import { NextRequest, NextResponse } from "next/server"
import {
  getSession,
  updateSessionWithRole,
  isTemporarySession,
} from "@/lib/auth/session-manager"
import {
  getRoleRedirectUrl,
  getManagementUrl,
  isAdminDomain,
  isRegistrationRole,
  isUserRole,
  type UserRole,
} from "@/lib/http/users/types"
import { getUsersClient } from "@/lib/http/users/users-client"

/**
 * POST /api/auth/set-role
 * Endpoint para seleccionar rol cuando el usuario tiene múltiples roles.
 * Acepta buyer/organizer en cualquier dominio. Acepta `supplier` (Administrador)
 * únicamente cuando el email de la sesión pertenece a @glam-urban.com; en ese
 * caso, redirige al portal de management.
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

    // 4. Validar que el rol esté en el conjunto de roles de registro válidos.
    if (!isRegistrationRole(role)) {
      console.error("❌ [SET ROLE] Unknown role:", role)
      return NextResponse.json(
        { error: "Invalid role", message: "Rol no disponible en esta plataforma." },
        { status: 403 }
      )
    }

    // 5. Validar que el rol esté en los roles disponibles de la sesión.
    if (!session.availableRoles?.includes(role)) {
      console.error("❌ [SET ROLE] Role not in available roles:", role)
      return NextResponse.json(
        { error: "Invalid role", message: "Rol no disponible para este usuario" },
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

    // 7. Caso especial: supplier (Administrador) → portal de management.
    //    Solo permitido para emails @glam-urban.com (defensa server-side; el dominio
    //    se deriva del email firmado en la sesión, nunca del payload del cliente).
    if (role === "supplier") {
      if (!isAdminDomain(session.email)) {
        console.error("❌ [SET ROLE] supplier role attempted from non-admin domain")
        return NextResponse.json(
          { error: "Invalid role", message: "Rol no permitido para este dominio." },
          { status: 403 }
        )
      }

      const mgmtUrl = getManagementUrl()
      if (!mgmtUrl) {
        console.error("❌ [SET ROLE] MANAGEMENT_URL no configurada")
        return NextResponse.json(
          { error: "Portal no disponible", message: "Portal de administración no disponible." },
          { status: 500 }
        )
      }

      console.log("✅ [SET ROLE] Updating session with role: supplier (mgmt portal)")
      await updateSessionWithRole(session, "supplier", userId)

      return NextResponse.json(
        {
          success: true,
          role: "supplier",
          redirect: mgmtUrl,
        },
        { status: 200 }
      )
    }

    // 8. Roles GSSC (buyer/organizer): redirección al dashboard correspondiente.
    if (!isUserRole(role)) {
      // Defensa redundante: el branch supplier ya retornó arriba.
      return NextResponse.json(
        { error: "Invalid role", message: "Rol no disponible en esta plataforma." },
        { status: 403 }
      )
    }

    const userRole: UserRole = role
    const redirectUrl = getRoleRedirectUrl(userRole)

    console.log("✅ [SET ROLE] Updating session with role:", userRole)
    await updateSessionWithRole(session, userRole, userId)

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
