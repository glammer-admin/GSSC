# Plan de Implementación: Sistema de Códigos de Error

## Objetivo
Implementar un sistema de códigos de error alfanuméricos que permita al equipo de soporte identificar problemas sin exponer información técnica al usuario final.

## Problema Actual
Cuando ocurre un error durante la autenticación:
1. Los callbacks de Google/Microsoft muestran errores inline con "Volver al login"
2. La función `getErrorPage()` redirige al login sin código de error
3. Los endpoints de token no incluyen códigos de error en sus respuestas
4. El usuario no tiene forma de reportar qué error ocurrió
5. El equipo de soporte no puede correlacionar reportes con logs

## Solución
Todos los errores deben redirigir a `/error?code=XXX` para:
- Mostrar mensaje amigable al usuario
- Permitir copiar código de referencia
- Facilitar correlación con logs del servidor

---

## Fases de Implementación

### Fase 1: Archivo de Códigos de Error
**Tiempo estimado:** 15-20 min

#### Tareas

1. **Crear estructura de carpetas**
   ```
   lib/errors/
   └── error-codes.ts
   ```

2. **Implementar `lib/errors/error-codes.ts`**
   - Definir type `ErrorSeverity`
   - Definir interface `ErrorCodeEntry` con:
     - `code`: string (formato MÓDULO-TIPO-NNN)
     - `description`: string (solo para soporte)
     - `userMessage`: string (mensaje genérico para usuario)
     - `severity`: "critical" | "warning" | "info"
     - `action`: string (acción recomendada para soporte)
   - Objeto `ERROR_CODES` con todos los códigos
   - Función helper `getErrorByCode(code: string)`
   - Función helper `isCriticalError(code: string)`
   - Type exports para TypeScript

#### Códigos a Implementar

**Autenticación (AUTH):**
- `AUTH-NET-001`: NetworkError al consultar usuario en BD durante login
- `AUTH-SRV-001`: Error 500 del backend al consultar usuario
- `AUTH-TMO-001`: Timeout al consultar usuario en BD
- `AUTH-CFG-001`: Variables de entorno del backend no configuradas
- `AUTH-CFG-002`: Credenciales OAuth no configuradas (CLIENT_ID/SECRET)
- `AUTH-VAL-001`: Token SSO inválido o expirado
- `AUTH-AUT-001`: Email no verificado en proveedor SSO
- `AUTH-SSO-001`: Error del proveedor OAuth (error en query params)
- `AUTH-SSO-002`: No se recibió código de autorización del proveedor
- `AUTH-SSO-003`: No se encontró code_verifier en sessionStorage (PKCE)
- `AUTH-TKN-001`: Error al intercambiar código por token con proveedor
- `AUTH-TKN-002`: No se recibió ID token del proveedor

**Registro (REG):**
- `REG-NET-001`: NetworkError al crear usuario en BD
- `REG-SRV-001`: Error 500 del backend al crear usuario
- `REG-VAL-001`: Datos de registro inválidos (server-side)
- `REG-DUP-001`: Usuario ya existe con ese email

**Sesión (SES):**
- `SES-EXP-001`: Sesión temporal expirada
- `SES-INV-001`: Token de sesión inválido o corrupto

**Usuario (USR):**
- `USR-NET-001`: NetworkError en operaciones de usuario
- `USR-NTF-001`: Usuario no encontrado en BD

**Navegación (NAV):**
- `NAV-NTF-001`: Página no encontrada (404)

**General (ERR):**
- `ERR-GEN-000`: Error genérico sin código específico

#### Archivos Creados
- `lib/errors/error-codes.ts`

---

### Fase 2: Página de Error Unificada
**Tiempo estimado:** 30-40 min

#### Descripción
Crear una única página de error reutilizable que recibe el código de error como parámetro y muestra la información correspondiente del catálogo.

#### Tareas

1. **Crear `app/error/page.tsx`** (Server Component)
   - Tipo: Server Component (async function)
   - Recibe `searchParams` con parámetro `code`
   - Usa `getErrorByCode()` para obtener información del error
   - Si no hay código, usa `ERR-GEN-000` como fallback
   - Muestra `userMessage` del catálogo (NO la descripción técnica)
   - Importa y usa el componente `ErrorCodeDisplay`

2. **Crear `components/error-code-display.tsx`** (Client Component)
   - Tipo: Client Component (`"use client"`)
   - Props: `{ code: string }`
   - Funcionalidad de copiar al portapapeles con `navigator.clipboard`
   - Estado local para mostrar feedback "¡Copiado!"
   - Timeout de 2 segundos para ocultar el feedback

3. **Estructura del componente de página**
   ```
   ┌─────────────────────────────────────┐
   │                                     │
   │         ┌───────────────┐           │
   │         │   ⚠️ Icono    │           │
   │         └───────────────┘           │
   │                                     │
   │      Oops! Tenemos un error         │  ← userMessage del catálogo
   │                                     │
   │   Ha ocurrido un problema. Por      │  ← Subtítulo fijo
   │   favor, intenta nuevamente.        │
   │                                     │
   │      [ Código: AUTH-NET-001 ]       │  ← ErrorCodeDisplay (clickeable)
   │                                     │
   │        [ Volver al inicio ]         │  ← Button → Link href="/"
   │                                     │
   └─────────────────────────────────────┘
   ```

4. **Estilos y diseño**
   - Fondo: gradiente suave `from-slate-50 to-slate-100`
   - Icono: círculo amber-50 con icono de advertencia amber-500
   - Título: text-2xl font-semibold text-slate-800
   - Subtítulo: text-slate-600
   - Código: text-xs font-mono text-slate-400 bg-slate-100 rounded
   - Botón: usar componente `Button` de `@/components/ui/button`
   - Layout: centrado vertical y horizontal, max-w-md, p-8

5. **Accesibilidad**
   - `title` en botón de copiar
   - Contraste WCAG AA
   - Código seleccionable manualmente como fallback
   - Focus visible en elementos interactivos

#### Archivos Creados
- `app/error/page.tsx`
- `components/error-code-display.tsx`

#### Dependencias
- `@/components/ui/button` (existente)
- `@/lib/errors/error-codes` (creado en Fase 1)
- `next/link` (built-in)

---

### Fase 3: Integración en Callback Principal
**Tiempo estimado:** 15-20 min

> ✅ **NOTA:** Esta fase ya está implementada en `app/api/auth/callback/route.ts`

#### Tareas (ya completadas)

1. **Verificar `app/api/auth/callback/route.ts`**
   - ✅ Importa `ERROR_CODES` de `@/lib/errors/error-codes`
   - ✅ Importa `deleteSession` de `@/lib/auth/session-manager`
   - ✅ Maneja `NetworkError` → `AUTH-NET-001`
   - ✅ Maneja `HttpError` 5xx → `AUTH-SRV-001`
   - ✅ Retorna JSON con `redirect: /error?code=XXX`

#### Archivos Verificados
- `app/api/auth/callback/route.ts` ✅

---

### Fase 4: Integración en Callbacks de Proveedores OAuth
**Tiempo estimado:** 40-50 min

#### Descripción
Los callbacks de Google y Microsoft actualmente muestran errores inline o redirigen al login. Deben redirigir a `/error?code=XXX`.

#### Tareas

1. **Modificar `app/api/auth/google/callback/route.ts`**
   
   a. **Eliminar función `getErrorPage()`** (ya no se usa)
   
   b. **Modificar manejo de error del proveedor:**
   ```typescript
   // Si hay error del proveedor OAuth
   if (error) {
     console.error(`[AUTH-SSO-001] OAuth error: ${error} - ${errorDescription}`)
     return NextResponse.redirect(new URL(`/error?code=AUTH-SSO-001`, request.url))
   }
   ```
   
   c. **Modificar manejo de código faltante:**
   ```typescript
   // Si no hay código de autorización
   if (!code) {
     console.error(`[AUTH-SSO-002] No authorization code received`)
     return NextResponse.redirect(new URL(`/error?code=AUTH-SSO-002`, request.url))
   }
   ```
   
   d. **Modificar JavaScript en `getProcessingPage()`:**
   - Cambiar manejo de `!codeVerifier` para redirigir a `/error?code=AUTH-SSO-003`
   - Cambiar manejo de error en token exchange para usar `errorCode` del servidor
   - Cambiar el `catch` para redirigir a `/error?code=ERR-GEN-000` en lugar de mostrar error inline

2. **Modificar `app/api/auth/microsoft/callback/route.ts`**
   - Aplicar los mismos cambios que para Google

#### Archivos Modificados
- `app/api/auth/google/callback/route.ts`
- `app/api/auth/microsoft/callback/route.ts`

---

### Fase 5: Integración en Endpoints de Token
**Tiempo estimado:** 20-30 min

#### Descripción
Los endpoints de token deben incluir códigos de error en sus respuestas para que el JavaScript del cliente pueda redirigir a la página correcta.

#### Tareas

1. **Modificar `app/api/auth/google/token/route.ts`**
   
   a. **Agregar código para credenciales faltantes:**
   ```typescript
   if (!clientId || !clientSecret) {
     console.error(`[AUTH-CFG-002] Missing OAuth credentials`)
     return NextResponse.json({
       error: "Server configuration error",
       errorCode: "AUTH-CFG-002"
     }, { status: 500 })
   }
   ```
   
   b. **Agregar código para error de token exchange:**
   ```typescript
   if (!response.ok) {
     const error = await response.json()
     console.error(`[AUTH-TKN-001] Token exchange failed: ${error.error_description}`)
     return NextResponse.json({
       error: "Token exchange failed",
       errorCode: "AUTH-TKN-001",
       details: error.error_description
     }, { status: response.status })
   }
   ```
   
   c. **Agregar código para ID token faltante:**
   ```typescript
   if (!data.id_token) {
     console.error(`[AUTH-TKN-002] No ID token received`)
     return NextResponse.json({
       error: "No ID token received",
       errorCode: "AUTH-TKN-002"
     }, { status: 500 })
   }
   ```

2. **Modificar `app/api/auth/microsoft/token/route.ts`**
   - Aplicar los mismos cambios que para Google

#### Archivos Modificados
- `app/api/auth/google/token/route.ts`
- `app/api/auth/microsoft/token/route.ts`

---

### Fase 6: Integración en Registro de Usuario
**Tiempo estimado:** 30-40 min

#### Descripción
Los errores críticos (red, servidor) deben redirigir a `/error`. Los errores recuperables (duplicado) muestran error inline.

#### Tareas

1. **Modificar `app/api/users/register/route.ts`**
   
   a. **Agregar imports:**
   ```typescript
   import { HttpError, NetworkError } from "@/lib/http/client"
   import { ERROR_CODES, formatErrorLog } from "@/lib/errors/error-codes"
   ```
   
   b. **Manejar NetworkError (redirigir a /error):**
   ```typescript
   if (error instanceof NetworkError) {
     const errorCode = ERROR_CODES.REG_NET_001.code
     console.error(formatErrorLog(errorCode, error.message))
     return NextResponse.json({
       error: true,
       message: ERROR_CODES.REG_NET_001.userMessage,
       redirect: `/error?code=${errorCode}`
     }, { status: 503 })
   }
   ```
   
   c. **Manejar HttpError 5xx (redirigir a /error):**
   ```typescript
   if (error instanceof HttpError && error.status >= 500) {
     const errorCode = ERROR_CODES.REG_SRV_001.code
     console.error(formatErrorLog(errorCode, `HTTP ${error.status}`))
     return NextResponse.json({
       error: true,
       message: ERROR_CODES.REG_SRV_001.userMessage,
       redirect: `/error?code=${errorCode}`
     }, { status: 503 })
   }
   ```
   
   d. **Manejar duplicado (error inline, NO redirigir):**
   ```typescript
   if (errorMessage.includes("duplicate")) {
     const errorCode = ERROR_CODES.REG_DUP_001.code
     return NextResponse.json({
       error: ERROR_CODES.REG_DUP_001.userMessage,
       code: errorCode
     }, { status: 409 })
   }
   ```
   
   e. **Error genérico (redirigir a /error):**
   ```typescript
   const errorCode = ERROR_CODES.ERR_GEN_000.code
   return NextResponse.json({
     error: true,
     message: ERROR_CODES.ERR_GEN_000.userMessage,
     redirect: `/error?code=${errorCode}`
   }, { status: 500 })
   ```

2. **Actualizar `components/onboarding-form.tsx`**
   
   a. **Detectar redirect en respuesta:**
   ```typescript
   if (data.error && data.redirect) {
     router.push(data.redirect)
     return
   }
   ```
   
   b. **Mostrar código de error para errores inline:**
   ```typescript
   if (!response.ok) {
     setSubmitError(data.message || data.error)
     setErrorCode(data.code || null)
     return
   }
   ```
   
   c. **Agregar estado para código de error:**
   ```typescript
   const [errorCode, setErrorCode] = useState<string | null>(null)
   ```
   
   d. **Mostrar código en UI de error:**
   ```tsx
   {submitError && (
     <div className="...">
       <p>{submitError}</p>
       {errorCode && (
         <p className="text-xs font-mono">Código: {errorCode}</p>
       )}
     </div>
   )}
   ```

#### Archivos Modificados
- `app/api/users/register/route.ts`
- `components/onboarding-form.tsx`

---

### Fase 7: Página 404 Personalizada
**Tiempo estimado:** 20-25 min

#### Descripción
Crear una página 404 personalizada que mantenga consistencia visual con la página de error y muestre el código `NAV-NTF-001`.

#### Tareas

1. **Crear `app/not-found.tsx`** (Server Component)
   - Tipo: Server Component (función async)
   - Reutiliza el componente `ErrorCodeDisplay` de la página de error
   - Muestra mensaje amigable "Página no encontrada"
   - Diseño consistente con `/error`

2. **Estructura del componente**
   ```
   ┌─────────────────────────────────────┐
   │                                     │
   │         ┌───────────────┐           │
   │         │   🔍 Icono    │           │
   │         └───────────────┘           │
   │                                     │
   │      Página no encontrada           │  ← Título
   │                                     │
   │   La página que buscas no existe    │  ← Subtítulo
   │   o fue movida.                     │
   │                                     │
   │      [ Código: NAV-NTF-001 ]        │  ← ErrorCodeDisplay
   │                                     │
   │        [ Volver al inicio ]         │  ← Button → Link href="/"
   │                                     │
   └─────────────────────────────────────┘
   ```

3. **Estilos y diseño**
   - Fondo: mismo gradiente que `/error` (`from-slate-50 to-slate-100`)
   - Icono: círculo con icono de búsqueda o signo de interrogación
   - Mismo esquema de colores que página de error
   - Layout centrado, max-w-md, p-8

4. **Implementación**
   ```typescript
   // app/not-found.tsx
   import Link from "next/link"
   import { Button } from "@/components/ui/button"
   import { ErrorCodeDisplay } from "@/components/error-code-display"

   export default function NotFound() {
     return (
       <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
         <div className="text-center p-8 max-w-md">
           {/* Icono de búsqueda */}
           <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
             <svg 
               className="w-10 h-10 text-slate-400" 
               fill="none" 
               stroke="currentColor" 
               viewBox="0 0 24 24"
             >
               <path 
                 strokeLinecap="round" 
                 strokeLinejoin="round" 
                 strokeWidth={2} 
                 d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
               />
             </svg>
           </div>

           <h1 className="text-2xl font-semibold text-slate-800 mb-3">
             Página no encontrada
           </h1>

           <p className="text-slate-600 mb-6">
             La página que buscas no existe o fue movida.
           </p>

           <ErrorCodeDisplay code="NAV-NTF-001" />

           <Button asChild className="mt-6">
             <Link href="/">Volver al inicio</Link>
           </Button>
         </div>
       </div>
     )
   }
   ```

#### Archivos Creados
- `app/not-found.tsx`

#### Dependencias
- `@/components/ui/button` (existente)
- `@/components/error-code-display` (creado en Fase 2)
- `next/link` (built-in)

---

### Fase 8: Testing
**Tiempo estimado:** 30-40 min

#### Tareas

1. **Probar errores de proveedor OAuth**
   - Simular error del proveedor (access_denied) → verificar redirección a /error?code=AUTH-SSO-001
   - Simular respuesta sin código → verificar redirección a /error?code=AUTH-SSO-002
   - Simular sessionStorage vacío → verificar redirección a /error?code=AUTH-SSO-003

2. **Probar errores de token exchange**
   - Simular credenciales faltantes → verificar redirección a /error?code=AUTH-CFG-002
   - Simular error de Google/Microsoft → verificar redirección a /error?code=AUTH-TKN-001
   - Simular respuesta sin id_token → verificar redirección a /error?code=AUTH-TKN-002

3. **Probar errores de BD**
   - Simular backend no disponible → verificar redirección a /error?code=AUTH-NET-001
   - Simular error 500 del backend → verificar redirección a /error?code=AUTH-SRV-001
   - Verificar que cookies se eliminan en error de autenticación

4. **Probar página de error**
   - Acceder con código válido → muestra mensaje y código
   - Acceder sin código → muestra ERR-GEN-000
   - Verificar funcionalidad de copiar código
   - Verificar que botón "Volver al inicio" redirige a "/"
   - Verificar diseño responsive

5. **Probar página 404**
   - Acceder a ruta inexistente → muestra página 404 personalizada
   - Verificar que muestra código NAV-NTF-001
   - Verificar funcionalidad de copiar código
   - Verificar que botón "Volver al inicio" redirige a "/"
   - Verificar diseño consistente con página de error

6. **Verificar logging**
   - Logs incluyen código de error
   - Formato consistente: `[CÓDIGO] mensaje`

---

## Orden de Implementación

```
1. lib/errors/error-codes.ts (crear/actualizar con nuevos códigos incluyendo NAV-NTF-001)
2. components/error-code-display.tsx (crear)
3. app/error/page.tsx (crear)
4. app/not-found.tsx (crear - página 404 personalizada)
5. app/api/auth/callback/route.ts (verificar - ya implementado)
6. app/api/auth/google/token/route.ts (modificar - agregar errorCode)
7. app/api/auth/microsoft/token/route.ts (modificar - agregar errorCode)
8. app/api/auth/google/callback/route.ts (modificar - redirigir a /error)
9. app/api/auth/microsoft/callback/route.ts (modificar - redirigir a /error)
10. app/api/users/register/route.ts (modificar)
11. components/onboarding-form.tsx (modificar)
```

---

## Checklist de Implementación

### Archivo de Códigos de Error
- [x] Archivo `lib/errors/error-codes.ts` creado
- [x] Type `ErrorSeverity` definido
- [x] Interface `ErrorCodeEntry` definida
- [x] Nuevos códigos AUTH-SSO-* definidos
- [x] Nuevos códigos AUTH-TKN-* definidos
- [x] Nuevo código AUTH-CFG-002 definido
- [x] Todos los códigos REG-* definidos
- [x] Todos los códigos SES-* definidos
- [x] Todos los códigos USR-* definidos
- [x] Código NAV-NTF-001 para página 404 definido
- [x] Código genérico ERR-GEN-000 definido
- [x] Función `getErrorByCode()` implementada
- [x] Función `isCriticalError()` implementada

### Página de Error
- [x] Archivo `app/error/page.tsx` creado (Server Component)
- [x] Archivo `components/error-code-display.tsx` creado (Client Component)
- [x] Página `/error` renderiza correctamente
- [x] Lee parámetro `code` de searchParams
- [x] Usa `getErrorByCode()` para obtener userMessage
- [x] Muestra mensaje genérico (NO descripción técnica)
- [x] Muestra ERR-GEN-000 si no hay código
- [x] Botón "Volver al inicio" redirige a "/"
- [x] Diseño amigable con colores suaves (amber, slate)
- [x] Código clickeable para copiar al portapapeles
- [x] Feedback visual "¡Copiado!" al copiar
- [x] Responsive en móvil y desktop

### Integración en Callback Principal
- [x] Callback elimina cookies en error de BD
- [x] Callback redirige a `/error?code=XXX`
- [x] Logs incluyen código de error

### Integración en Endpoints de Token
- [x] `google/token` incluye `errorCode` en respuestas de error
- [x] `microsoft/token` incluye `errorCode` en respuestas de error
- [x] Logs incluyen código de error

### Integración en Callbacks de Proveedores
- [x] `google/callback` redirige a `/error` en lugar de mostrar página inline
- [x] `microsoft/callback` redirige a `/error` en lugar de mostrar página inline
- [x] JavaScript del callback redirige a `/error` en caso de error
- [x] Eliminada función `getErrorPage()` (ya no se usa)

### Integración en Registro
- [x] `register/route.ts` importa ERROR_CODES y formatErrorLog
- [x] NetworkError redirige a `/error?code=REG-NET-001`
- [x] HttpError 5xx redirige a `/error?code=REG-SRV-001`
- [x] Error duplicado muestra error inline con código REG-DUP-001
- [x] Error genérico redirige a `/error?code=ERR-GEN-000`
- [x] Errores de registro NO eliminan sesión
- [x] `onboarding-form.tsx` detecta `redirect` y redirige
- [x] `onboarding-form.tsx` muestra código de error inline

### Página 404
- [x] Archivo `app/not-found.tsx` creado (Server Component)
- [x] Muestra código NAV-NTF-001
- [x] Reutiliza componente `ErrorCodeDisplay`
- [x] Diseño consistente con página de error
- [x] Botón "Volver al inicio" redirige a "/"
- [x] Responsive en móvil y desktop

### Testing
- [ ] Error de proveedor OAuth → /error?code=AUTH-SSO-001
- [ ] Sin código de autorización → /error?code=AUTH-SSO-002
- [ ] Sin code_verifier → /error?code=AUTH-SSO-003
- [ ] Error de token exchange → /error?code=AUTH-TKN-001
- [ ] Backend no disponible → /error?code=AUTH-NET-001
- [ ] Cookies eliminadas en error de auth
- [ ] Código correcto en página de error
- [ ] Ruta inexistente → página 404 con código NAV-NTF-001
- [ ] Logs con formato correcto

---

## Tiempo Total Estimado

- **Fase 1:** 20 min (Actualizar archivo de códigos de error con nuevos códigos)
- **Fase 2:** 40 min (Página de error unificada + componente)
- **Fase 3:** 10 min (Verificar callback principal - ya implementado)
- **Fase 4:** 50 min (Integración callbacks de proveedores OAuth)
- **Fase 5:** 30 min (Integración endpoints de token)
- **Fase 6:** 30 min (Integración registro)
- **Fase 7:** 25 min (Página 404 personalizada)
- **Fase 8:** 40 min (Testing)

**Total: ~4-4.5 horas** de implementación activa

---

## Consideraciones Técnicas

### Formato de Logging

```typescript
// Formato estándar para logs de error
console.error(`[${ERROR_CODES.AUTH_NET_001.code}]`, error.message)
// Output: [AUTH-NET-001] Failed to fetch user from database
```

### Manejo de Errores en Cliente

Los callbacks de Google/Microsoft ejecutan JavaScript en el cliente. Hay dos tipos de errores:

**1. Errores del callback principal (`/api/auth/callback`):**
```javascript
const authData = await authResponse.json();

// Si hay error con redirect, seguirlo
if (authData.error && authData.redirect) {
  window.location.href = authData.redirect;
  return;
}
```

**2. Errores locales (PKCE, token exchange):**
```javascript
// Sin code_verifier
if (!codeVerifier) {
  console.error('[AUTH-SSO-003] No code_verifier found');
  window.location.href = '/error?code=AUTH-SSO-003';
  return;
}

// Error de token exchange
if (!tokenResponse.ok) {
  const error = await tokenResponse.json();
  const errorCode = error.errorCode || 'AUTH-TKN-001';
  window.location.href = '/error?code=' + errorCode;
  return;
}
```

**3. Errores genéricos en catch:**
```javascript
catch (error) {
  console.error('[ERR-GEN-000]', error);
  // Limpiar sessionStorage
  sessionStorage.removeItem('pkce_code_verifier');
  sessionStorage.removeItem('pkce_state');
  sessionStorage.removeItem('pkce_provider');
  // Redirigir a página de error
  window.location.href = '/error?code=ERR-GEN-000';
}
```

### Eliminación de Cookies

Solo se eliminan cookies en errores de autenticación (AUTH-*), NO en errores de registro (REG-*):

| Módulo | Eliminar Cookies |
|--------|------------------|
| AUTH-* | ✅ Sí |
| REG-* | ❌ No |
| SES-* | ✅ Sí |
| USR-* | Depende del contexto |
| ERR-* | ✅ Sí |

### Redirección vs Página Inline

| Escenario | Antes | Después |
|-----------|-------|---------|
| Error del proveedor OAuth | `getErrorPage()` con "Volver al login" | `redirect(/error?code=AUTH-SSO-001)` |
| Sin código de autorización | `getErrorPage()` con "Volver al login" | `redirect(/error?code=AUTH-SSO-002)` |
| Sin code_verifier | Error inline en HTML | `redirect(/error?code=AUTH-SSO-003)` |
| Error de token exchange | Error inline en HTML | `redirect(/error?code=AUTH-TKN-001)` |
| Error genérico en catch | Error inline con "Volver al login" | `redirect(/error?code=ERR-GEN-000)` |

---

## Riesgos y Mitigaciones

### Riesgo 1: Usuario no reporta el código
**Mitigación:**
- Hacer el código fácil de copiar (click to copy)
- Mostrar instrucciones claras
- Código visible pero no prominente

### Riesgo 2: Códigos no correlacionan con logs
**Mitigación:**
- Usar formato consistente en logs: `[CÓDIGO] mensaje`
- Incluir timestamp en logs
- Documentar códigos internamente

### Riesgo 3: Página de error genera más ansiedad
**Mitigación:**
- Diseño amigable con colores suaves
- Mensaje tranquilizador
- Acción clara (botón para volver)

### Riesgo 4: Cambios rompen flujo existente
**Mitigación:**
- El callback principal ya está implementado correctamente
- Los cambios en callbacks de proveedores son aditivos
- Probar cada fase antes de continuar

---

## Diagrama de Flujo de Errores

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE AUTENTICACIÓN                       │
└─────────────────────────────────────────────────────────────────────┘

Usuario hace login
       │
       ▼
┌──────────────────┐
│  Proveedor OAuth │
│ (Google/Microsoft)│
└────────┬─────────┘
         │
    ┌────┴────┐
    │ ¿Error? │
    └────┬────┘
         │
    ┌────┴────┐
    │   Sí    │──────────────────────────────────────┐
    └────┬────┘                                      │
         │                                           ▼
         │ No                              ┌─────────────────────┐
         ▼                                 │ /error?code=        │
┌──────────────────┐                       │   AUTH-SSO-001      │
│ /api/auth/{prov} │                       └─────────────────────┘
│    /callback     │
└────────┬─────────┘
         │
    ┌────┴────────────┐
    │ ¿code_verifier? │
    └────┬────────────┘
         │
    ┌────┴────┐
    │   No    │──────────────────────────────────────┐
    └────┬────┘                                      │
         │                                           ▼
         │ Sí                              ┌─────────────────────┐
         ▼                                 │ /error?code=        │
┌──────────────────┐                       │   AUTH-SSO-003      │
│ /api/auth/{prov} │                       └─────────────────────┘
│     /token       │
└────────┬─────────┘
         │
    ┌────┴─────────────┐
    │ ¿Token exchange? │
    └────┬─────────────┘
         │
    ┌────┴────┐
    │  Error  │──────────────────────────────────────┐
    └────┬────┘                                      │
         │                                           ▼
         │ OK                              ┌─────────────────────┐
         ▼                                 │ /error?code=        │
┌──────────────────┐                       │   AUTH-TKN-001      │
│ /api/auth/       │                       └─────────────────────┘
│   callback       │
└────────┬─────────┘
         │
    ┌────┴────────────┐
    │ ¿Consulta BD?   │
    └────┬────────────┘
         │
    ┌────┴────┐
    │  Error  │──────────────────────────────────────┐
    └────┬────┘                                      │
         │                                           ▼
         │ OK                              ┌─────────────────────┐
         ▼                                 │ /error?code=        │
┌──────────────────┐                       │   AUTH-NET-001      │
│   Dashboard o    │                       │   AUTH-SRV-001      │
│   Onboarding     │                       └─────────────────────┘
└──────────────────┘
```

