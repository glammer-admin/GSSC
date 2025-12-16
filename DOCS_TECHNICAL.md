# Documentación Técnica - GSSC Platform

> Documento de referencia para el desarrollo de funcionalidades. Define arquitectura, decisiones técnicas y reglas que debe seguir el agente AI.

---

## Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 15.1.3 | Framework (App Router) |
| React | 19 | Server Components + Client Components |
| TypeScript | 5 | Lenguaje tipado |
| Tailwind CSS | 4.0 | Estilos |
| jose | 5.9.6 | Validación JWT |

---

## Estructura del Proyecto

| Directorio | Propósito |
|------------|-----------|
| `app/` | Next.js App Router - páginas y API routes |
| `app/api/auth/` | Endpoints de autenticación SSO |
| `app/api/users/` | Endpoints de gestión de usuarios |
| `app/dashboard/` | Dashboard rol `organizer` |
| `app/customer-dash/` | Dashboard rol `supplier` |
| `app/product/[id]/` | Dashboard rol `buyer` |
| `app/onboarding/` | Registro de nuevos usuarios |
| `app/select-role/` | Selección de rol (usuarios multi-rol) |
| `components/` | Componentes React reutilizables |
| `lib/auth/` | Lógica de autenticación y sesiones |
| `lib/config/` | Configuración por ambiente |
| `lib/http/` | Cliente HTTP para backend externo (SOLO SERVIDOR) |
| `middleware.ts` | Middleware global de autenticación |

---

## Decisiones de Arquitectura

### 1. Server-Side Rendering Obligatorio

**Regla fundamental**: Todas las operaciones sensibles DEBEN ejecutarse en el servidor.

| Operación | Dónde ejecutar |
|-----------|----------------|
| Validación de sesión | Server Component o API Route |
| Consultas a BD externa | Server Component o API Route |
| Verificación de roles | Server Component o Middleware |
| Acceso a variables sensibles | Server Component o API Route |

**Patrón de páginas protegidas**:
1. Validar sesión con `getSession()` en Server Component
2. Verificar tipo de sesión (completa vs temporal)
3. Validar rol del usuario
4. Consultar datos necesarios del backend
5. Pasar datos a Client Components como props

### 2. Cliente HTTP Solo Servidor

El directorio `lib/http/` contiene el cliente para comunicación con Supabase.

**Restricciones**:
- NUNCA importar `HttpClient` o `UsersClient` en archivos con `"use client"`
- Usar siempre `getUsersClient()` (patrón singleton con lazy initialization)
- Las variables de entorno del backend NO están disponibles en el cliente

**Headers requeridos**:
| Operación | Header |
|-----------|--------|
| GET (lectura) | `Accept-Profile: <schema>` |
| POST/PUT/PATCH (escritura) | `Content-Profile: <schema>` |

**Manejo de errores**:
- `HttpError`: Respuestas 4xx, 5xx del servidor
- `NetworkError`: Timeout, conexión fallida

### 3. Sistema de Sesiones Dual

Existen dos tipos de sesión para soportar el flujo de onboarding:

| Tipo | Cuándo se usa | Propiedades clave |
|------|---------------|-------------------|
| `SessionData` (completa) | Usuario validado con rol | `role: SessionRole` |
| `TemporarySessionData` | Usuario pendiente de registro/selección | `role: null`, `needsOnboarding`, `needsRoleSelection` |

**Funciones de validación**:
- `isTemporarySession()`: Verifica si requiere onboarding o selección de rol
- `isCompleteSession()`: Verifica si tiene rol asignado

**Flujo de sesiones**:
1. Usuario se autentica con SSO
2. Sistema consulta BD por email
3. Si NO existe → Sesión temporal + `/onboarding`
4. Si existe con 1 rol → Sesión completa + dashboard
5. Si existe con N roles → Sesión temporal + `/select-role`

### 4. Sistema de Roles (RBAC)

| Rol (BD/Sesión) | Nombre UI | Dashboard | Descripción |
|-----------------|-----------|-----------|-------------|
| `organizer` | Organizador | `/dashboard` | Gestiona proyectos y pagos |
| `supplier` | Proveedor | `/customer-dash` | Ofrece servicios |
| `buyer` | Comprador | `/product/[id]` | Realiza compras |

**Reglas**:
- Los roles se almacenan en inglés en BD y sesión
- Un usuario puede tener múltiples roles (array)
- Los roles NO se asignan automáticamente por provider SSO
- El menú de navegación es dinámico según el rol activo

### 5. Autenticación OAuth 2.0 + PKCE

**Providers soportados**: Google, Microsoft

**Flujo implementado**: Authorization Code Flow con PKCE

**Decisiones de seguridad**:
- Client Secret NUNCA expuesto al cliente (solo en servidor)
- PKCE previene intercepción de authorization code
- State parameter previene CSRF
- ID Token validado con JWK públicas del provider
- Sesión almacenada en cookie HttpOnly

**Validación de ID Tokens**:
- Google: Issuer `https://accounts.google.com`, requiere `email_verified`
- Microsoft: Endpoint `/common`, email puede estar en `email`, `preferred_username` o `upn`

---

## Configuración por Ambiente

| Ambiente | SSO Real | Duración Sesión | Log Level | Secure Cookies |
|----------|----------|-----------------|-----------|----------------|
| development | `false` (mock) | 24 horas | `debug` | `false` |
| staging | `true` | 24 horas | `info` | `true` |
| production | `true` | 12 horas | `error` | `true` |

**Detección de ambiente**: Variable `NEXT_PUBLIC_APP_ENV` o `NODE_ENV`

**Mock SSO**: En desarrollo sin credenciales, se generan tokens mock automáticamente.

---

## Variables de Entorno

### Variables del Servidor (Sensibles)

| Variable | Propósito | Obligatoria |
|----------|-----------|-------------|
| `SESSION_SECRET` | Firma de JWT de sesión | Sí (staging/prod) |
| `GOOGLE_CLIENT_ID` | OAuth Google | Sí |
| `GOOGLE_CLIENT_SECRET` | OAuth Google | Sí |
| `MICROSOFT_CLIENT_ID` | OAuth Microsoft | Sí |
| `MICROSOFT_CLIENT_SECRET` | OAuth Microsoft | Sí |
| `BACKEND_API_URL` | URL API Supabase | Sí |
| `BACKEND_API_KEY` | API Key Supabase | Sí |
| `BACKEND_DB_SCHEMA` | Schema de BD | Sí |

### Variables Públicas (Cliente)

| Variable | Propósito |
|----------|-----------|
| `NEXT_PUBLIC_APP_URL` | URL base de la aplicación |
| `NEXT_PUBLIC_APP_ENV` | Ambiente actual |

**Regla crítica**: Variables con prefijo `NEXT_PUBLIC_` son expuestas al navegador. NUNCA usar para secrets.

---

## Middleware de Autenticación

**Responsabilidades**:
1. Validar sesión en cada request
2. Proteger rutas según autenticación
3. Control de acceso basado en roles
4. Refresh de sesión si está por expirar
5. Redirección automática según estado

**Rutas públicas** (no requieren sesión):
- `/api/auth/*` (endpoints de autenticación)

**Rutas por rol**:
| Rol | Rutas permitidas |
|-----|------------------|
| `organizer` | `/dashboard/*` |
| `supplier` | `/customer-dash/*` |
| `buyer` | `/product/*` |

**Headers propagados**: El middleware agrega `X-User-Sub`, `X-User-Email`, `X-User-Role`, `X-User-Provider`, `X-User-Id` para uso en API Routes.

---

## Seguridad

### Medidas Implementadas

1. **HttpOnly Cookies**: Sesión no accesible desde JavaScript
2. **Secure Cookies**: Solo HTTPS en producción/staging
3. **SameSite Cookies**: Protección CSRF
4. **PKCE**: Previene intercepción de authorization code
5. **State Parameter**: Previene CSRF en OAuth flow
6. **JWT Validation**: Verifica firma con claves públicas
7. **RBAC**: Autorización por rol
8. **Client Secret en servidor**: Nunca expuesto al cliente
9. **Session Expiration**: Tokens con tiempo de vida limitado
10. **Middleware Protection**: Todas las rutas validadas

### Logout Seguro

El proceso de logout debe:
1. Limpiar `localStorage` y `sessionStorage` en cliente
2. Llamar a `/api/auth/logout` con `credentials: include`
3. Servidor elimina cookie con `maxAge: 0`
4. Servidor envía headers `Clear-Site-Data` y `Cache-Control: no-store`
5. Redirect a `/` con `window.location.replace()`

---

## Performance

1. **JWK Caching**: Claves públicas de providers cacheadas por 1 hora
2. **Session Refresh**: Solo cuando está próxima a expirar (menos de 1 hora)
3. **SSR**: Renderizado en servidor, sin doble request
4. **Singleton Pattern**: `UsersClient` con lazy initialization
5. **Code Splitting**: Componentes cargados bajo demanda

---

## Guía para Desarrollo de Funcionalidades

### Al crear una nueva página protegida:

1. Crear como Server Component (sin `"use client"`)
2. Validar sesión con `getSession()`
3. Verificar `isCompleteSession()` antes de continuar
4. Validar rol del usuario
5. Obtener datos del backend con `getUsersClient()`
6. Pasar datos a Client Components como props

### Al crear un nuevo endpoint API:

1. Verificar sesión o headers `X-User-*` del middleware
2. Validar rol si es necesario
3. Usar `getUsersClient()` para operaciones de BD
4. Retornar errores apropiados (401, 403, etc.)

### Al crear un Client Component con datos:

1. Obtener datos en el Server Component padre
2. Pasar datos como props al Client Component
3. NUNCA importar `lib/http/*` en Client Components
4. Para mutaciones, usar API Routes internas

### Al agregar una nueva variable de entorno:

1. Si es sensible → Sin prefijo, documentar en servidor
2. Si es pública → Prefijo `NEXT_PUBLIC_`
3. Agregar validación en el código que la usa
4. Documentar en esta sección

---

## Troubleshooting

| Error | Causa probable | Solución |
|-------|----------------|----------|
| "No valid session" | Cookie ausente o expirada | Verificar `SESSION_SECRET` y expiración |
| "redirect_uri_mismatch" | URI no coincide en provider | Verificar configuración en Google/Azure |
| "Invalid token" | Client ID incorrecto o JWK inaccesible | Verificar credenciales y conectividad |
| "Missing backend configuration" | Variables de backend no configuradas | Verificar `BACKEND_API_*` en `.env.local` |

---

## Licencia

Propietario - Glamur SSC Platform
