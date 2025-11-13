# Documentación Técnica - GSSC Platform

## Arquitectura General

### Stack Tecnológico

- **Framework**: Next.js 15.1.3 (App Router)
- **Runtime**: React 19 (Server Components + Client Components)
- **Lenguaje**: TypeScript 5
- **Autenticación**: OAuth 2.0 + OpenID Connect (OIDC)
- **Styling**: Tailwind CSS
- **Validación JWT**: jose library

### Estructura del Proyecto

```
GSSC/
├── app/                          # Next.js App Router
│   ├── api/auth/                 # API Routes de autenticación
│   │   ├── callback/             # Callback unificado SSO
│   │   ├── google/
│   │   │   ├── callback/         # Callback específico Google
│   │   │   └── token/            # Token exchange Google
│   │   ├── microsoft/
│   │   │   ├── callback/         # Callback específico Microsoft
│   │   │   └── token/            # Token exchange Microsoft
│   │   ├── logout/               # Endpoint de logout
│   │   └── session/              # Verificación de sesión
│   ├── dashboard/                # Dashboard Organizador
│   ├── customer-dash/            # Dashboard Proveedor
│   ├── product/[id]/             # Dashboard Pagador
│   └── page.tsx                  # Login page
├── components/
│   ├── login-form.tsx            # Formulario de login SSO
│   ├── client-navbar.tsx         # Navbar con estado cliente
│   └── server-authenticated-layout.tsx
├── lib/
│   ├── auth/                     # Lógica de autenticación
│   │   ├── google-oauth.ts       # Helper OAuth Google
│   │   ├── microsoft-oauth.ts    # Helper OAuth Microsoft
│   │   ├── jwt-validator.ts      # Validador de ID Tokens
│   │   ├── session-manager.ts    # Gestión de sesiones
│   │   └── mock-sso.ts           # Mock para desarrollo
│   ├── config/
│   │   └── env.ts                # Configuración por ambiente
│   └── menu-config.ts            # Configuración de menús por rol
├── middleware.ts                 # Middleware global de autenticación
└── .env.local                    # Variables de entorno (no versionado)
```

---

## Flujo de Autenticación

### Authorization Code Flow + PKCE

Implementación siguiendo las mejores prácticas de OAuth 2.0 con PKCE (Proof Key for Code Exchange).

#### Diagrama de Flujo

```
┌──────────┐                                              ┌──────────────┐
│  Client  │                                              │   Provider   │
│ (Browser)│                                              │ (Google/MS)  │
└────┬─────┘                                              └──────┬───────┘
     │                                                            │
     │ 1. Click "Login con Google/Microsoft"                     │
     │────────────────────────────────────────────────────────────┐
     │                                                             │
     │ 2. Generar code_verifier + code_challenge (SHA-256)        │
     │    Guardar en sessionStorage                               │
     │<────────────────────────────────────────────────────────────┘
     │
     │ 3. Redirect a Provider con code_challenge
     ├──────────────────────────────────────────────────────────>│
     │                                                            │
     │ 4. Usuario se autentica                                   │
     │                                                            │
     │ 5. Redirect a /api/auth/{provider}/callback?code=...     │
     │<──────────────────────────────────────────────────────────┤
     │
     │ 6. Página callback lee code_verifier de sessionStorage
     │────────────────────────────────────────────────────────────┐
     │<────────────────────────────────────────────────────────────┘
     │
     │ 7. POST /api/auth/{provider}/token
     │    { code, code_verifier }
     ├──────────────────────────────────────────────────────────>│
     │                                                            │
     │                      ┌─────────────┐                      │
     │                      │  BFF Server │                      │
     │                      └──────┬──────┘                      │
     │                             │                             │
     │                             │ 8. Exchange code por tokens │
     │                             │    usando Client Secret     │
     │                             ├──────────────────────────────>
     │                             │                             │
     │                             │ 9. ID Token + Access Token  │
     │                             │<────────────────────────────┤
     │                             │
     │ 10. ID Token retornado      │
     │<────────────────────────────┤
     │
     │ 11. POST /api/auth/callback
     │     { idToken, provider }
     ├────────────────────────────>│
     │                             │
     │                             │ 12. Validar ID Token (JWT)
     │                             │     Verificar firma con JWK
     │                             │
     │                             │ 13. Crear sesión HttpOnly
     │                             │     Cookie: gssc_session
     │                             │
     │ 14. { success, redirect }   │
     │<────────────────────────────┤
     │
     │ 15. Redirect a dashboard
     └─────────────────────────────
```

#### Detalles Técnicos

**PKCE (Proof Key for Code Exchange):**
```typescript
code_verifier = base64url(random(32 bytes))
code_challenge = base64url(SHA256(code_verifier))
```

**Seguridad:**
- ✅ Client Secret nunca expuesto al cliente
- ✅ PKCE previene ataques de intercepción de código
- ✅ State parameter previene CSRF
- ✅ ID Token validado con JWK públicas
- ✅ Sesión en HttpOnly cookie (no accesible desde JS)

---

## Gestión de Sesiones

### Cookies de Sesión

```typescript
Cookie: gssc_session
- HttpOnly: true           // No accesible desde JavaScript
- Secure: true (prod)      // Solo HTTPS en producción
- SameSite: Lax           // Protección CSRF
- Max-Age: 28800          // 8 horas (desarrollo)
- Path: /                 // Disponible en toda la app
```

### JWT Session Token

```typescript
{
  sub: string,              // Subject (user ID)
  email: string,            // Email del usuario
  name: string,             // Nombre completo
  picture?: string,         // URL avatar
  provider: string,         // google | microsoft | meta
  role: string,            // Organizador | Proveedor | Pagador
  iat: number,             // Issued at
  exp: number              // Expiration
}
```

**Firma JWT:**
- Algoritmo: HS256
- Secret: Variable `SESSION_SECRET` (env)
- Validación en cada request (middleware)

---

## Middleware de Autenticación

### Responsabilidades

1. **Validación de sesión** en cada request
2. **Protección de rutas** según autenticación
3. **Control de acceso** basado en roles (RBAC)
4. **Refresh de sesión** si está por expirar
5. **Redirección automática** según estado de auth

### Rutas Públicas

```typescript
const PUBLIC_ROUTES = [
  "/api/auth/login",
  "/api/auth/callback",
  "/api/auth/logout",
  "/api/auth/session",
  "/api/auth/google/callback",
  "/api/auth/google/token",
  "/api/auth/microsoft/callback",
  "/api/auth/microsoft/token",
]
```

### Rutas por Rol

```typescript
const ROLE_ROUTES = {
  Organizador: ["/dashboard"],
  Proveedor: ["/customer-dash"],
  Pagador: ["/product"],
}
```

### Lógica de Redirección

```
┌─────────────────────────────────────────────────────┐
│ Request a /ruta                                      │
└────────────┬────────────────────────────────────────┘
             │
             ├──> ¿Es ruta pública?
             │    Sí: Permitir acceso
             │
             ├──> ¿Tiene sesión válida?
             │    No: Redirect a /
             │
             ├──> ¿Tiene acceso (rol)?
             │    No: Redirect a su dashboard
             │
             └──> Permitir acceso
```

---

## Validación de ID Tokens

### Google

```typescript
// 1. Obtener JWK públicas
const jwks = await fetch('https://www.googleapis.com/oauth2/v3/certs')

// 2. Verificar firma
const { payload } = await jwtVerify(idToken, publicKey, {
  issuer: 'https://accounts.google.com',
  audience: process.env.GOOGLE_CLIENT_ID,
})

// 3. Validar email verificado
if (!payload.email_verified) throw Error('Email not verified')
```

### Microsoft

```typescript
// 1. Obtener JWK públicas
const jwks = await fetch('https://login.microsoftonline.com/common/discovery/v2.0/keys')

// 2. Verificar firma (sin validar issuer específico para /common)
const { payload } = await jwtVerify(idToken, publicKey, {
  audience: process.env.MICROSOFT_CLIENT_ID,
})

// 3. Extraer email de múltiples campos
const email = payload.email || payload.preferred_username || payload.upn
```

---

## Sistema de Roles (RBAC)

### Mapeo Provider → Rol

```typescript
const roleMap = {
  google: "Organizador",
  microsoft: "Proveedor",
  meta: "Pagador",
}
```

### Menús Dinámicos por Rol

```typescript
// lib/menu-config.ts
const MENU_ITEMS = {
  Organizador: [
    { label: "Dashboard", href: "/dashboard", icon: <Dashboard /> },
    { label: "Proyectos", href: "/dashboard/projects", icon: <Projects /> },
    { label: "Pagos", href: "/dashboard/payments", icon: <Payments /> },
    { label: "Configuración", href: "/dashboard/settings", icon: <Settings /> },
  ],
  Proveedor: [
    { label: "Dashboard", href: "/customer-dash", icon: <Dashboard /> },
    { label: "Proyectos", href: "/customer-dash/projects", icon: <Projects /> },
    { label: "Clientes", href: "/customer-dash/clients", icon: <Clients /> },
    { label: "Calendario", href: "/customer-dash/calendar", icon: <Calendar /> },
  ],
  Pagador: [
    { label: "Historial", href: "/product/1234asdf", icon: <History /> },
  ],
}
```

---

## Ambientes y Configuración

### Ambientes Soportados

```typescript
type Environment = "development" | "staging" | "production"
```

### Configuración por Ambiente

```typescript
// lib/config/env.ts
export function getConfig() {
  const env = getCurrentEnvironment()
  
  return {
    development: {
      secureCookies: false,
      sessionDuration: 8 * 60 * 60,     // 8 horas
      apiUrl: "http://localhost:3000",
    },
    staging: {
      secureCookies: true,
      sessionDuration: 24 * 60 * 60,    // 24 horas
      apiUrl: "https://staging.glamur-ssc.com",
    },
    production: {
      secureCookies: true,
      sessionDuration: 7 * 24 * 60 * 60, // 7 días
      apiUrl: "https://app.glamur-ssc.com",
    },
  }[env]
}
```

### Mock SSO (Desarrollo)

En desarrollo, si no hay credenciales configuradas:

```typescript
// Genera tokens mock automáticamente
export function generateMockToken(provider: 'google' | 'microsoft' | 'meta'): string {
  const mockPayload = {
    sub: `mock-${provider}-${Date.now()}`,
    email: `user@${provider}.com`,
    name: `Mock ${provider} User`,
    picture: `https://ui-avatars.com/api/?name=${provider}`,
    email_verified: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }
  
  return createJWT(mockPayload)
}
```

---

## Server-Side Rendering (SSR)

### Páginas Protegidas

Todas las páginas protegidas son **Server Components**:

```typescript
// app/dashboard/page.tsx
export default async function Dashboard() {
  // 1. Validar sesión en el servidor
  const session = await getSession()
  
  if (!session) {
    redirect("/")
  }
  
  // 2. Validar rol
  if (session.role !== "Organizador") {
    redirect(getDefaultRouteForRole(session.role))
  }
  
  // 3. Renderizar con datos del servidor
  return <ServerAuthenticatedLayout session={session}>
    <DashboardContent user={session} />
  </ServerAuthenticatedLayout>
}
```

### Beneficios SSR

- ✅ **Seguridad**: Validación en servidor antes de renderizar
- ✅ **Performance**: No hay flash de contenido no autenticado
- ✅ **SEO**: Contenido renderizado en servidor
- ✅ **Simplicidad**: No necesita useEffect para auth

---

## Seguridad

### Medidas Implementadas

1. **HttpOnly Cookies**: Sesión no accesible desde JavaScript
2. **Secure Cookies**: Solo HTTPS en producción
3. **SameSite Cookies**: Protección CSRF
4. **PKCE**: Previene intercepción de authorization code
5. **State Parameter**: Previene CSRF en OAuth flow
6. **JWT Validation**: Verifica firma con claves públicas
7. **Role-Based Access Control**: Autorización por rol
8. **Client Secret en servidor**: Nunca expuesto al cliente
9. **Session Expiration**: Tokens con tiempo de vida limitado
10. **Middleware Protection**: Todas las rutas validadas

### Logout Seguro

```typescript
// 1. Limpieza cliente
localStorage.clear()
sessionStorage.clear()

// 2. Llamada servidor
await fetch("/api/auth/logout", {
  method: "POST",
  credentials: "include",
})

// 3. Server elimina cookies
response.cookies.delete(SESSION_COOKIE_NAME)

// 4. Headers adicionales
Clear-Site-Data: "cache", "cookies", "storage"
Cache-Control: no-store, no-cache, must-revalidate

// 5. Redirect
window.location.replace("/")
```

---

## Performance

### Optimizaciones

1. **JWK Caching**: Claves públicas cacheadas por 1 hora
2. **Session Refresh**: Solo cuando está por expirar
3. **SSR**: Renderizado en servidor (no doble request)
4. **Static Assets**: Optimizados con Next.js
5. **Code Splitting**: Componentes cargados bajo demanda

---

## Testing

### Modos de Prueba

**Desarrollo (Mock SSO):**
```bash
npm run dev
# Usa tokens mock, no requiere credenciales reales
```

**Desarrollo (SSO Real):**
```bash
# Configurar .env.local con credenciales reales
npm run dev
```

**Staging:**
```bash
npm run dev:staging
# Usa credenciales de staging
```

**Production:**
```bash
npm run build:production
npm run start:production
```

---

## Consideraciones de Deployment

### Variables de Entorno Requeridas

**Producción Mínima:**
```bash
SESSION_SECRET=<secret-aleatorio-64-chars>
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-secret>
MICROSOFT_CLIENT_ID=<microsoft-client-id>
MICROSOFT_CLIENT_SECRET=<microsoft-secret>
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

### Configuración de Providers

**Google Cloud Console:**
- Authorized redirect URIs: `https://tu-dominio.com/api/auth/google/callback`
- Application type: Web application

**Azure Portal:**
- Platform: Web
- Redirect URI: `https://tu-dominio.com/api/auth/microsoft/callback`
- Client secret: Configurar y guardar

### Headers de Seguridad Recomendados

```nginx
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

---

## Troubleshooting

### Problemas Comunes

**Error: "No valid session"**
- Verificar que la cookie `gssc_session` esté presente
- Verificar que `SESSION_SECRET` esté configurado
- Verificar que el token no haya expirado

**Error: "redirect_uri_mismatch"**
- Verificar URIs en Google Cloud Console / Azure Portal
- Debe coincidir exactamente con `NEXT_PUBLIC_APP_URL`

**Error: "Invalid token"**
- Verificar que Client ID sea correcto
- Verificar conectividad con JWK endpoints
- Revisar logs de validación JWT

---

## Dependencias Principales

```json
{
  "next": "15.1.3",
  "react": "19.2.0",
  "jose": "^5.9.6",              // JWT validation
  "tailwindcss": "^4.0.0",
  "typescript": "^5"
}
```

---

## Licencia

Propietario - Glamur SSC Platform

