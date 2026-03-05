/**
 * Supabase Admin API client (server-only)
 * Used by the BFF to obtain Supabase JWTs for SSO-validated users.
 * No OTP or magic-link email is sent — everything is server-side.
 *
 * Flow per login:
 *   1. POST /auth/v1/admin/users          → upsert auth user (email_confirm:true)
 *   2. POST /auth/v1/admin/generate_link  → get hashed_token + user id (server-only)
 *   3. POST /auth/v1/verify               → exchange token_hash for JWT session
 */

export interface SupabaseSession {
  authId: string
  accessToken: string
  refreshToken: string
}

function getAdminConfig() {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Required for Supabase Admin API."
    )
  }

  return { url, serviceRoleKey }
}

function adminHeaders(serviceRoleKey: string): Record<string, string> {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  }
}

/**
 * Creates or finds a Supabase Auth user for the given SSO-validated email,
 * then obtains a Supabase JWT session (access + refresh tokens).
 * No email is sent — the token exchange happens entirely server-side.
 */
export async function upsertSupabaseAuthUser(
  email: string,
  name: string,
  provider: "google" | "microsoft" | "meta"
): Promise<SupabaseSession> {
  const { url, serviceRoleKey } = getAdminConfig()
  const headers = adminHeaders(serviceRoleKey)

  // Step 1: Upsert auth user (ignore 422 = already exists)
  const createRes = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      email_confirm: true,
      user_metadata: { full_name: name, provider },
    }),
  })

  if (createRes.ok) {
    const created = await createRes.json()
    console.log(`✅ [SUPABASE ADMIN] Auth user created: ${created.id}`)
  } else if (createRes.status === 422) {
    console.log(`ℹ️ [SUPABASE ADMIN] User already exists: ${email}`)
  } else {
    const body = await createRes.text()
    throw new Error(`Failed to create auth user: ${createRes.status} ${body}`)
  }

  // Step 2: Generate link — gives us hashed_token + user id (no email sent)
  const linkRes = await fetch(`${url}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers,
    body: JSON.stringify({ type: "magiclink", email }),
  })

  if (!linkRes.ok) {
    const body = await linkRes.text()
    throw new Error(`Failed to generate link: ${linkRes.status} ${body}`)
  }

  const linkData = await linkRes.json()
  const authId: string = linkData.id ?? linkData.user_id
  const hashedToken: string = linkData.hashed_token

  if (!authId) {
    throw new Error("No user id returned from generate_link")
  }

  if (!hashedToken) {
    throw new Error("No hashed_token returned from generate_link")
  }

  console.log(`🔗 [SUPABASE ADMIN] Token generated for ${authId}, exchanging for session...`)

  // Step 3: Exchange token_hash for JWT session (GoTrue v2 format)
  const verifyRes = await fetch(`${url}/auth/v1/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: serviceRoleKey },
    body: JSON.stringify({ type: "magiclink", token_hash: hashedToken }),
  })

  if (!verifyRes.ok) {
    const body = await verifyRes.text()
    throw new Error(`Failed to verify token: ${verifyRes.status} ${body}`)
  }

  const session = await verifyRes.json()

  if (!session.access_token || !session.refresh_token) {
    throw new Error("No access_token or refresh_token in verify response")
  }

  console.log(`✅ [SUPABASE ADMIN] Supabase session obtained for: ${email}`)

  return {
    authId,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  }
}

/**
 * Refreshes a Supabase session using the stored refresh token.
 * Called by refreshSession() in session-manager when the session is expiring.
 */
export async function refreshSupabaseToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const { url, serviceRoleKey } = getAdminConfig()

  const res = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to refresh Supabase token: ${res.status} ${body}`)
  }

  const data = await res.json()

  if (!data.access_token || !data.refresh_token) {
    throw new Error("No tokens in refresh response")
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  }
}
