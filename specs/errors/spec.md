# Especificación: Sistema de Códigos de Error

## Resumen
Implementar un sistema de códigos de error alfanuméricos que permita al equipo de soporte identificar rápidamente la causa de un problema sin exponer información técnica sensible al usuario final.

**Problema actual:** Cuando ocurre un error durante la autenticación, el sistema redirige directamente al login sin mostrar información útil. Esto genera una mala experiencia de usuario y dificulta el soporte técnico porque no hay forma de identificar qué falló.

**Solución:** Todos los errores deben redirigir a `/error?code=XXX` donde el usuario puede ver un mensaje amigable y un código de referencia para reportar a soporte.

---

## Alcance

### Incluido
- Catálogo de códigos de error alfanuméricos
- Página de error genérica (`/error`)
- Integración con el flujo de autenticación (OAuth callbacks)
- Integración con intercambio de tokens (Google/Microsoft)
- Eliminación de cookies en errores críticos
- Logging estructurado con códigos de error
- Redirección a `/error` en lugar de al login cuando hay errores

### Excluido
- Sistema de notificaciones automáticas a soporte
- Dashboard de monitoreo de errores
- Integración con servicios externos (Sentry, etc.)

---

## Formato del Código de Error

Los códigos siguen el formato: `{MÓDULO}-{TIPO}-{NÚMERO}`

### MÓDULO - Área del sistema
| Código | Descripción |
|--------|-------------|
| `AUTH` | Autenticación y login |
| `REG` | Registro/Onboarding |
| `USR` | Operaciones de usuario |
| `SES` | Sesión |
| `NAV` | Navegación y rutas |
| `ERR` | Errores generales |

### TIPO - Tipo de error
| Código | Descripción |
|--------|-------------|
| `NET` | Error de red/conexión |
| `SRV` | Error del servidor (5xx) |
| `TMO` | Timeout |
| `CFG` | Error de configuración |
| `VAL` | Error de validación |
| `AUT` | Error de autorización |
| `DUP` | Duplicado |
| `NTF` | No encontrado |
| `EXP` | Expirado |
| `INV` | Inválido |
| `GEN` | Error general |

### NÚMERO
Identificador único dentro del módulo/tipo (001-999)

---

## Catálogo de Códigos de Error

### Errores de Autenticación (AUTH)

| Código | Descripción Interna (Solo Soporte) | Mensaje Usuario | Severidad | Acción Recomendada |
|--------|-----------------------------------|-----------------|-----------|-------------------|
| `AUTH-NET-001` | NetworkError al consultar usuario en BD durante login | Oops! Tenemos un error | critical | Verificar conectividad con backend, revisar BACKEND_API_URL |
| `AUTH-SRV-001` | Error 500 del backend al consultar usuario durante login | Oops! Tenemos un error | critical | Revisar logs del backend, verificar estado del servidor |
| `AUTH-TMO-001` | Timeout al consultar usuario en BD durante login | Oops! Tenemos un error | warning | Verificar latencia de red, considerar aumentar timeout |
| `AUTH-CFG-001` | Variables de entorno del backend no configuradas | Oops! Tenemos un error | critical | Verificar BACKEND_API_URL, BACKEND_API_KEY, BACKEND_DB_SCHEMA |
| `AUTH-VAL-001` | Token SSO inválido o expirado | Oops! Tenemos un error | warning | Usuario debe reintentar login |
| `AUTH-AUT-001` | Email no verificado en proveedor SSO | Oops! Tenemos un error | warning | Usuario debe verificar email en proveedor |
| `AUTH-SSO-001` | Error del proveedor OAuth (error en query params) | Oops! Tenemos un error | warning | Revisar configuración OAuth del proveedor |
| `AUTH-SSO-002` | No se recibió código de autorización del proveedor | Oops! Tenemos un error | warning | Usuario debe reintentar login |
| `AUTH-SSO-003` | No se encontró code_verifier en sessionStorage (PKCE) | Oops! Tenemos un error | warning | Usuario debe reintentar login, verificar que cookies estén habilitadas |
| `AUTH-TKN-001` | Error al intercambiar código por token con proveedor | Oops! Tenemos un error | critical | Revisar credenciales OAuth (CLIENT_ID, CLIENT_SECRET) |
| `AUTH-TKN-002` | No se recibió ID token del proveedor | Oops! Tenemos un error | critical | Revisar scopes OAuth configurados |
| `AUTH-CFG-002` | Credenciales OAuth no configuradas (CLIENT_ID/SECRET) | Oops! Tenemos un error | critical | Verificar GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o equivalentes Microsoft |

### Errores de Registro (REG)

| Código | Descripción Interna (Solo Soporte) | Mensaje Usuario | Severidad | Acción Recomendada |
|--------|-----------------------------------|-----------------|-----------|-------------------|
| `REG-NET-001` | NetworkError al crear usuario en BD | Error al crear usuario | critical | Verificar conectividad con backend |
| `REG-SRV-001` | Error 500 del backend al crear usuario | Error al crear usuario | critical | Revisar logs del backend |
| `REG-VAL-001` | Datos de registro inválidos (server-side) | Datos inválidos | warning | Revisar validaciones del formulario |
| `REG-DUP-001` | Usuario ya existe con ese email | Usuario ya registrado | info | Usuario debe hacer login normal |

### Errores de Sesión (SES)

| Código | Descripción Interna (Solo Soporte) | Mensaje Usuario | Severidad | Acción Recomendada |
|--------|-----------------------------------|-----------------|-----------|-------------------|
| `SES-EXP-001` | Sesión temporal expirada | Sesión expirada | info | Usuario debe reiniciar login |
| `SES-INV-001` | Token de sesión inválido o corrupto | Sesión inválida | warning | Verificar SESSION_SECRET, usuario debe reiniciar login |

### Errores de Usuario (USR)

| Código | Descripción Interna (Solo Soporte) | Mensaje Usuario | Severidad | Acción Recomendada |
|--------|-----------------------------------|-----------------|-----------|-------------------|
| `USR-NET-001` | NetworkError en operaciones de usuario | Error de conexión | critical | Verificar conectividad con backend |
| `USR-NTF-001` | Usuario no encontrado en BD | Usuario no encontrado | warning | Verificar integridad de datos |

### Errores de Navegación (NAV)

| Código | Descripción Interna (Solo Soporte) | Mensaje Usuario | Severidad | Acción Recomendada |
|--------|-----------------------------------|-----------------|-----------|-------------------|
| `NAV-NTF-001` | Página no encontrada (404) | Página no encontrada | info | Verificar URL, posible enlace roto o página eliminada |

### Errores Generales (ERR)

| Código | Descripción Interna (Solo Soporte) | Mensaje Usuario | Severidad | Acción Recomendada |
|--------|-----------------------------------|-----------------|-----------|-------------------|
| `ERR-GEN-000` | Error genérico sin código específico | Oops! Tenemos un error | warning | Revisar logs para más detalles |

---

## Escenarios de Usuario (Gherkin)

```gherkin
Feature: Sistema de Códigos de Error
  Como usuario del sistema GSSC
  Quiero ver un código de error cuando algo falla
  Para poder reportarlo a soporte y obtener ayuda

  Background:
    Given el sistema de autenticación SSO está configurado

  # ============================================================
  # Escenario 1: Errores del Proveedor OAuth (Google/Microsoft)
  # ============================================================

  Scenario: Error reportado por el proveedor OAuth redirige a página de error
    Given un usuario inicia el flujo de login con Google
    And Google retorna un error en los query params (ej: access_denied)
    When el callback de Google recibe el error
    Then el callback registra el error con código "AUTH-SSO-001" en los logs
    And el usuario es redirigido a "/error?code=AUTH-SSO-001"
    And la página de error muestra "Oops! Tenemos un error"
    And la página de error muestra el código "AUTH-SSO-001"
    And la página de error NO redirige al login automáticamente

  Scenario: No se recibe código de autorización del proveedor
    Given un usuario inicia el flujo de login con Microsoft
    And Microsoft no envía el parámetro "code" en la respuesta
    When el callback de Microsoft detecta la ausencia del código
    Then el callback registra el error con código "AUTH-SSO-002" en los logs
    And el usuario es redirigido a "/error?code=AUTH-SSO-002"

  Scenario: No se encuentra code_verifier en sessionStorage (PKCE)
    Given un usuario inicia el flujo de login con Google
    And Google retorna correctamente con un código de autorización
    And el sessionStorage no contiene el code_verifier (ej: usuario abrió en otra pestaña)
    When el JavaScript del callback intenta procesar el código
    Then el callback registra el error con código "AUTH-SSO-003" en los logs
    And el usuario es redirigido a "/error?code=AUTH-SSO-003"

  # ============================================================
  # Escenario 2: Errores en Intercambio de Token
  # ============================================================

  Scenario: Error al intercambiar código por token con el proveedor
    Given un usuario completa el flujo OAuth con Google
    And el callback intenta intercambiar el código por tokens
    And el endpoint de token de Google retorna un error
    When el BFF detecta el error de token exchange
    Then el BFF registra el error con código "AUTH-TKN-001" en los logs
    And el usuario es redirigido a "/error?code=AUTH-TKN-001"

  Scenario: Credenciales OAuth no configuradas
    Given un usuario inicia el flujo de login con Microsoft
    And las variables MICROSOFT_CLIENT_ID o MICROSOFT_CLIENT_SECRET no están configuradas
    When el endpoint de token intenta procesar la solicitud
    Then el BFF registra el error con código "AUTH-CFG-002" en los logs
    And el usuario es redirigido a "/error?code=AUTH-CFG-002"

  # ============================================================
  # Escenario 3: Errores Durante Consulta a BD
  # ============================================================
  
  Scenario: Error de conexión al backend durante login redirige a página de error
    Given un usuario completa el login SSO exitosamente
    And el BFF intenta consultar la base de datos externa
    And la base de datos externa no está disponible (NetworkError)
    When el BFF detecta el error de conexión
    Then el BFF elimina todas las cookies de sesión creadas
    And el BFF registra el error con código "AUTH-NET-001" en los logs
    And el usuario es redirigido a "/error?code=AUTH-NET-001"
    And la página de error muestra "Oops! Tenemos un error"
    And la página de error muestra el código "AUTH-NET-001"
    And la página de error NO muestra detalles técnicos del error
    And la página de error tiene un botón "Volver al inicio" que redirige a "/"

  Scenario: Error 500 del backend durante login redirige a página de error
    Given un usuario completa el login SSO exitosamente
    And el BFF intenta consultar la base de datos externa
    And la base de datos externa retorna error 500
    When el BFF detecta el error del servidor
    Then el BFF elimina todas las cookies de sesión creadas
    And el BFF registra el error con código "AUTH-SRV-001" en los logs
    And el usuario es redirigido a "/error?code=AUTH-SRV-001"

  Scenario: Timeout de conexión al backend durante login
    Given un usuario completa el login SSO exitosamente
    And el BFF intenta consultar la base de datos externa
    And la petición excede el timeout de 10 segundos
    When el BFF detecta el timeout
    Then el BFF elimina todas las cookies de sesión creadas
    And el BFF registra el error con código "AUTH-TMO-001" en los logs
    And el usuario es redirigido a "/error?code=AUTH-TMO-001"

  Scenario: Error de configuración de backend (variables de entorno faltantes)
    Given un usuario completa el login SSO exitosamente
    And las variables BACKEND_API_URL, BACKEND_API_KEY o BACKEND_DB_SCHEMA no están configuradas
    When el BFF intenta inicializar el cliente HTTP
    Then el BFF detecta la configuración faltante
    And el BFF elimina todas las cookies de sesión creadas
    And el BFF registra el error con código "AUTH-CFG-001" en los logs
    And el usuario es redirigido a "/error?code=AUTH-CFG-001"

  # ============================================================
  # Escenario 4: Errores Durante Registro de Usuario
  # ============================================================

  Scenario: Error de conexión al crear usuario redirige a página de error
    Given el usuario está en la página de onboarding
    And completa el formulario correctamente
    And el BFF intenta crear el usuario en la base de datos
    And la base de datos no está disponible (NetworkError)
    When el BFF detecta el error de conexión
    Then el BFF mantiene la sesión temporal (no elimina cookies)
    And el BFF registra el error con código "REG-NET-001" en los logs
    And el usuario es redirigido a "/error?code=REG-NET-001"
    And la página de error muestra "Error al crear usuario. Intenta nuevamente."
    And la página de error muestra el código "REG-NET-001"

  Scenario: Error 500 del backend al crear usuario redirige a página de error
    Given el usuario está en la página de onboarding
    And completa el formulario correctamente
    And el BFF intenta crear el usuario en la base de datos
    And la base de datos retorna error 500
    When el BFF detecta el error del servidor
    Then el BFF mantiene la sesión temporal (no elimina cookies)
    And el BFF registra el error con código "REG-SRV-001" en los logs
    And el usuario es redirigido a "/error?code=REG-SRV-001"

  Scenario: Usuario duplicado muestra error inline (no redirige)
    Given el usuario está en la página de onboarding
    And completa el formulario con un email que ya existe
    And el BFF intenta crear el usuario en la base de datos
    And la base de datos retorna error de duplicado
    When el BFF detecta el error de duplicado
    Then el BFF registra el error con código "REG-DUP-001" en los logs
    And se muestra un mensaje de error en el formulario: "Este email ya está registrado"
    And el usuario NO es redirigido a la página de error
    And el usuario puede corregir y reintentar

  # ============================================================
  # Escenario 3: Página de Error
  # ============================================================

  Scenario: Usuario accede a página de error con código válido
    Given el usuario fue redirigido a "/error?code=AUTH-NET-001"
    When la página de error carga
    Then se muestra el título "Oops! Tenemos un error"
    And se muestra el mensaje "Ha ocurrido un problema. Por favor, intenta nuevamente."
    And se muestra el código de referencia "AUTH-NET-001"
    And se muestra un botón "Volver al inicio"
    And el botón redirige a la página de login "/"

  Scenario: Usuario accede a página de error sin código
    Given el usuario accede directamente a "/error" sin parámetro code
    When la página de error carga
    Then se muestra el título "Oops! Tenemos un error"
    And se muestra el código de referencia "ERR-GEN-000"
    And se muestra un botón "Volver al inicio"

  Scenario: Usuario puede copiar el código de error
    Given el usuario está en la página "/error?code=AUTH-NET-001"
    When el usuario hace click en el código de error
    Then el código se copia al portapapeles
    And se muestra un mensaje de confirmación "Código copiado"

  # ============================================================
  # Escenario 6: Página No Encontrada (404)
  # ============================================================

  Scenario: Usuario accede a una ruta que no existe
    Given el usuario intenta acceder a "/ruta-que-no-existe"
    And la ruta no está definida en el router de Next.js
    When Next.js detecta que la página no existe
    Then se muestra la página 404 personalizada
    And se muestra el título "Página no encontrada"
    And se muestra el mensaje "La página que buscas no existe o fue movida."
    And se muestra el código de referencia "NAV-NTF-001"
    And se muestra un botón "Volver al inicio"
    And el botón redirige a la página principal "/"

  Scenario: Usuario accede a una ruta dinámica con ID inválido
    Given el usuario intenta acceder a "/product/id-que-no-existe"
    And el producto con ese ID no existe en el sistema
    When la página detecta que el recurso no existe
    Then se puede redirigir a la página 404
    Or se muestra un mensaje de error específico del recurso

  Scenario: Página 404 mantiene el diseño consistente
    Given el usuario accede a una ruta que no existe
    When la página 404 carga
    Then el diseño es consistente con la página de error "/error"
    And usa los mismos colores y estilos
    And el código "NAV-NTF-001" es clickeable para copiar
```

---

## Estructura de Archivos

```
lib/
└── errors/
    └── error-codes.ts    # Catálogo de códigos de error

app/
├── error/
│   └── page.tsx          # Página de error unificada (Server Component)
└── not-found.tsx         # Página 404 personalizada (Server Component)

components/
└── error-code-display.tsx # Componente para mostrar y copiar código de error
```

---

## Página de Error Unificada

### Ubicación
`app/error/page.tsx`

### Tipo de Componente
**Server Component** - La página lee los parámetros de la URL del lado del servidor.

### Props (via searchParams)

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `code` | string | No | Código de error alfanumérico (ej: AUTH-NET-001) |

### Comportamiento

1. **Lee el código de error** del query parameter `code`
2. **Si no hay código**, usa `ERR-GEN-000` como fallback
3. **Busca el código** en el catálogo `ERROR_CODES`
4. **Muestra el mensaje genérico** (`userMessage`) del catálogo
5. **NO muestra** la descripción técnica ni la acción recomendada

### Implementación

```typescript
// app/error/page.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getErrorByCode } from "@/lib/errors/error-codes"

interface ErrorPageProps {
  searchParams: Promise<{ code?: string }>
}

export default async function ErrorPage({ searchParams }: ErrorPageProps) {
  const params = await searchParams
  const errorCode = params.code || "ERR-GEN-000"
  const errorInfo = getErrorByCode(errorCode)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center p-8 max-w-md">
        {/* Icono */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-50 flex items-center justify-center">
          <svg 
            className="w-10 h-10 text-amber-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-semibold text-slate-800 mb-3">
          {errorInfo.userMessage}
        </h1>

        {/* Subtítulo */}
        <p className="text-slate-600 mb-6">
          Ha ocurrido un problema. Por favor, intenta nuevamente.
        </p>

        {/* Código de referencia */}
        <ErrorCodeDisplay code={errorCode} />

        {/* Botón de acción */}
        <Button asChild className="mt-6">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  )
}
```

### Componente ErrorCodeDisplay (Client Component)

Para permitir copiar el código al portapapeles, se necesita un Client Component:

```typescript
// components/error-code-display.tsx
"use client"

import { useState } from "react"

interface ErrorCodeDisplayProps {
  code: string
}

export function ErrorCodeDisplay({ code }: ErrorCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="text-xs text-slate-400 font-mono bg-slate-100 px-3 py-1.5 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
        title="Click para copiar"
      >
        Código: {code}
      </button>
      {copied && (
        <span className="text-xs text-green-600">¡Copiado!</span>
      )}
    </div>
  )
}
```

### Diseño Visual

#### Paleta de Colores
- **Fondo**: Gradiente suave de slate-50 a slate-100 (no agresivo)
- **Icono**: Amber/amarillo (advertencia, no error crítico)
- **Texto título**: slate-800
- **Texto secundario**: slate-600
- **Código**: slate-400 sobre fondo slate-100
- **Botón**: Color primario de la aplicación

#### Layout
- Centrado vertical y horizontal
- Ancho máximo de 400px
- Padding generoso (32px)
- Espaciado consistente entre elementos

#### Responsive
- Funciona en móvil y desktop
- El texto se ajusta al ancho disponible
- El botón ocupa ancho completo en móvil (opcional)

### Accesibilidad

- El botón de copiar tiene `title` descriptivo
- Contraste de colores cumple WCAG AA
- El código es seleccionable manualmente si falla el clipboard
- Focus visible en elementos interactivos

---

## Archivo de Códigos de Error

**Ubicación:** `lib/errors/error-codes.ts`

```typescript
/**
 * Catálogo de códigos de error para soporte técnico
 * IMPORTANTE: Este archivo es SOLO para uso interno del equipo de soporte
 * Los mensajes de usuario NO deben revelar detalles técnicos
 */

export type ErrorSeverity = "critical" | "warning" | "info"

export interface ErrorCodeEntry {
  code: string
  description: string      // Solo para soporte, NO mostrar al usuario
  userMessage: string      // Mensaje genérico para el usuario
  severity: ErrorSeverity
  action: string           // Acción recomendada para soporte
}

export const ERROR_CODES = {
  // Errores de Autenticación
  AUTH_NET_001: {
    code: "AUTH-NET-001",
    description: "NetworkError al consultar usuario en BD durante login",
    userMessage: "Oops! Tenemos un error",
    severity: "critical",
    action: "Verificar conectividad con backend, revisar BACKEND_API_URL"
  },
  AUTH_SRV_001: {
    code: "AUTH-SRV-001",
    description: "Error 500 del backend al consultar usuario durante login",
    userMessage: "Oops! Tenemos un error",
    severity: "critical",
    action: "Revisar logs del backend, verificar estado del servidor"
  },
  AUTH_TMO_001: {
    code: "AUTH-TMO-001",
    description: "Timeout al consultar usuario en BD durante login",
    userMessage: "Oops! Tenemos un error",
    severity: "warning",
    action: "Verificar latencia de red, considerar aumentar timeout"
  },
  AUTH_CFG_001: {
    code: "AUTH-CFG-001",
    description: "Variables de entorno del backend no configuradas",
    userMessage: "Oops! Tenemos un error",
    severity: "critical",
    action: "Verificar BACKEND_API_URL, BACKEND_API_KEY, BACKEND_DB_SCHEMA"
  },
  AUTH_VAL_001: {
    code: "AUTH-VAL-001",
    description: "Token SSO inválido o expirado",
    userMessage: "Oops! Tenemos un error",
    severity: "warning",
    action: "Usuario debe reintentar login"
  },
  AUTH_AUT_001: {
    code: "AUTH-AUT-001",
    description: "Email no verificado en proveedor SSO",
    userMessage: "Oops! Tenemos un error",
    severity: "warning",
    action: "Usuario debe verificar email en proveedor"
  },
  AUTH_SSO_001: {
    code: "AUTH-SSO-001",
    description: "Error del proveedor OAuth (error en query params)",
    userMessage: "Oops! Tenemos un error",
    severity: "warning",
    action: "Revisar configuración OAuth del proveedor"
  },
  AUTH_SSO_002: {
    code: "AUTH-SSO-002",
    description: "No se recibió código de autorización del proveedor",
    userMessage: "Oops! Tenemos un error",
    severity: "warning",
    action: "Usuario debe reintentar login"
  },
  AUTH_SSO_003: {
    code: "AUTH-SSO-003",
    description: "No se encontró code_verifier en sessionStorage (PKCE)",
    userMessage: "Oops! Tenemos un error",
    severity: "warning",
    action: "Usuario debe reintentar login, verificar que cookies estén habilitadas"
  },
  AUTH_TKN_001: {
    code: "AUTH-TKN-001",
    description: "Error al intercambiar código por token con proveedor",
    userMessage: "Oops! Tenemos un error",
    severity: "critical",
    action: "Revisar credenciales OAuth (CLIENT_ID, CLIENT_SECRET)"
  },
  AUTH_TKN_002: {
    code: "AUTH-TKN-002",
    description: "No se recibió ID token del proveedor",
    userMessage: "Oops! Tenemos un error",
    severity: "critical",
    action: "Revisar scopes OAuth configurados"
  },
  AUTH_CFG_002: {
    code: "AUTH-CFG-002",
    description: "Credenciales OAuth no configuradas (CLIENT_ID/SECRET)",
    userMessage: "Oops! Tenemos un error",
    severity: "critical",
    action: "Verificar GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o equivalentes Microsoft"
  },
  
  // Errores de Registro
  REG_NET_001: {
    code: "REG-NET-001",
    description: "NetworkError al crear usuario en BD",
    userMessage: "Error al crear usuario. Intenta nuevamente.",
    severity: "critical",
    action: "Verificar conectividad con backend"
  },
  REG_SRV_001: {
    code: "REG-SRV-001",
    description: "Error 500 del backend al crear usuario",
    userMessage: "Error al crear usuario. Intenta nuevamente.",
    severity: "critical",
    action: "Revisar logs del backend"
  },
  REG_VAL_001: {
    code: "REG-VAL-001",
    description: "Datos de registro inválidos (server-side)",
    userMessage: "Los datos ingresados no son válidos.",
    severity: "warning",
    action: "Revisar validaciones del formulario"
  },
  REG_DUP_001: {
    code: "REG-DUP-001",
    description: "Usuario ya existe con ese email",
    userMessage: "Este email ya está registrado.",
    severity: "info",
    action: "Usuario debe hacer login normal"
  },
  
  // Errores de Sesión
  SES_EXP_001: {
    code: "SES-EXP-001",
    description: "Sesión temporal expirada",
    userMessage: "Tu sesión ha expirado.",
    severity: "info",
    action: "Usuario debe reiniciar login"
  },
  SES_INV_001: {
    code: "SES-INV-001",
    description: "Token de sesión inválido o corrupto",
    userMessage: "Sesión inválida.",
    severity: "warning",
    action: "Verificar SESSION_SECRET, usuario debe reiniciar login"
  },
  
  // Errores de Usuario
  USR_NET_001: {
    code: "USR-NET-001",
    description: "NetworkError en operaciones de usuario",
    userMessage: "Error de conexión.",
    severity: "critical",
    action: "Verificar conectividad con backend"
  },
  USR_NTF_001: {
    code: "USR-NTF-001",
    description: "Usuario no encontrado en BD",
    userMessage: "Usuario no encontrado.",
    severity: "warning",
    action: "Verificar integridad de datos"
  },
  
  // Errores Generales
  ERR_GEN_000: {
    code: "ERR-GEN-000",
    description: "Error genérico sin código específico",
    userMessage: "Oops! Tenemos un error",
    severity: "warning",
    action: "Revisar logs para más detalles"
  },
} as const

export type ErrorCode = keyof typeof ERROR_CODES

/**
 * Obtiene la entrada de error por código
 * @param code - Código de error (ej: "AUTH-NET-001")
 * @returns ErrorCodeEntry o el error genérico si no se encuentra
 */
export function getErrorByCode(code: string): ErrorCodeEntry {
  const key = code.replace(/-/g, "_") as ErrorCode
  return ERROR_CODES[key] || ERROR_CODES.ERR_GEN_000
}

/**
 * Verifica si un código de error es crítico
 */
export function isCriticalError(code: string): boolean {
  const error = getErrorByCode(code)
  return error.severity === "critical"
}
```

---

## Integración con el Flujo de Autenticación

### Principio Fundamental

**TODOS los errores deben redirigir a `/error?code=XXX`**, nunca al login directamente. Esto permite:
1. El usuario ve un mensaje amigable
2. El usuario puede copiar el código para reportar a soporte
3. El equipo de soporte puede correlacionar el código con los logs

### En los callbacks de proveedores OAuth (Google/Microsoft)

Los callbacks de OAuth (`/api/auth/google/callback` y `/api/auth/microsoft/callback`) deben redirigir a `/error` en lugar de mostrar errores inline o redirigir al login:

```typescript
// En app/api/auth/google/callback/route.ts (y microsoft)

// 1. Error del proveedor OAuth (error en query params)
if (error) {
  console.error(`[AUTH-SSO-001] OAuth error: ${error} - ${errorDescription}`)
  // ❌ ANTES: return new NextResponse(getErrorPage(errorDescription))
  // ✅ AHORA: Redirigir a página de error
  return NextResponse.redirect(new URL(`/error?code=AUTH-SSO-001`, request.url))
}

// 2. No se recibió código de autorización
if (!code) {
  console.error(`[AUTH-SSO-002] No authorization code received`)
  return NextResponse.redirect(new URL(`/error?code=AUTH-SSO-002`, request.url))
}
```

### En el JavaScript del callback (procesamiento cliente)

El JavaScript que procesa el código de autorización también debe redirigir a `/error`:

```javascript
// En getProcessingPage() de google/callback y microsoft/callback

try {
  const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
  
  // 3. No se encontró code_verifier
  if (!codeVerifier) {
    console.error('[AUTH-SSO-003] No code_verifier found');
    window.location.href = '/error?code=AUTH-SSO-003';
    return;
  }

  // Intercambiar código por token
  const tokenResponse = await fetch('/api/auth/google/token', { ... });
  
  if (!tokenResponse.ok) {
    const error = await tokenResponse.json();
    // Si el servidor envía código de error, usarlo
    if (error.errorCode) {
      window.location.href = '/error?code=' + error.errorCode;
      return;
    }
    // Fallback a código genérico de token
    window.location.href = '/error?code=AUTH-TKN-001';
    return;
  }

  // ... resto del flujo

} catch (error) {
  // ❌ ANTES: Mostrar error inline con "Volver al login"
  // ✅ AHORA: Redirigir a página de error
  console.error('[ERR-GEN-000]', error);
  sessionStorage.removeItem('pkce_code_verifier');
  sessionStorage.removeItem('pkce_state');
  sessionStorage.removeItem('pkce_provider');
  window.location.href = '/error?code=ERR-GEN-000';
}
```

### En los endpoints de token (/api/auth/google/token, /api/auth/microsoft/token)

Los endpoints de token deben incluir códigos de error en sus respuestas:

```typescript
// En app/api/auth/google/token/route.ts (y microsoft)

// 1. Credenciales no configuradas
if (!clientId || !clientSecret) {
  console.error(`[AUTH-CFG-002] Missing OAuth credentials`)
  return NextResponse.json({
    error: "Server configuration error",
    errorCode: "AUTH-CFG-002"
  }, { status: 500 })
}

// 2. Error al intercambiar código
if (!response.ok) {
  const error = await response.json()
  console.error(`[AUTH-TKN-001] Token exchange failed: ${error.error_description}`)
  return NextResponse.json({
    error: "Token exchange failed",
    errorCode: "AUTH-TKN-001",
    details: error.error_description
  }, { status: response.status })
}

// 3. No se recibió ID token
if (!data.id_token) {
  console.error(`[AUTH-TKN-002] No ID token received`)
  return NextResponse.json({
    error: "No ID token received",
    errorCode: "AUTH-TKN-002"
  }, { status: 500 })
}
```

### En el callback principal de autenticación

```typescript
import { ERROR_CODES } from "@/lib/errors/error-codes"
import { deleteSession } from "@/lib/auth/session-manager"
import { NetworkError, HttpError } from "@/lib/http/client"

// En app/api/auth/callback/route.ts
try {
  const user = await usersClient.getUserByEmail(email)
} catch (error) {
  if (error instanceof NetworkError) {
    await deleteSession()
    console.error(`[${ERROR_CODES.AUTH_NET_001.code}]`, error.message)
    return NextResponse.json({
      error: true,
      redirect: `/error?code=${ERROR_CODES.AUTH_NET_001.code}`
    })
  }
  
  if (error instanceof HttpError && error.status >= 500) {
    await deleteSession()
    console.error(`[${ERROR_CODES.AUTH_SRV_001.code}]`, error.message)
    return NextResponse.json({
      error: true,
      redirect: `/error?code=${ERROR_CODES.AUTH_SRV_001.code}`
    })
  }
  
  // Error genérico
  await deleteSession()
  console.error(`[${ERROR_CODES.ERR_GEN_000.code}]`, error)
  return NextResponse.json({
    error: true,
    redirect: `/error?code=${ERROR_CODES.ERR_GEN_000.code}`
  })
}
```

### En el registro de usuario

Los errores de registro NO eliminan la sesión temporal. Para errores críticos (red, servidor), se redirige a `/error`. Para errores recuperables (duplicado, validación), se muestra error inline.

```typescript
// En app/api/users/register/route.ts
import { HttpError, NetworkError } from "@/lib/http/client"
import { ERROR_CODES, formatErrorLog } from "@/lib/errors/error-codes"

try {
  const user = await usersClient.createUser(userData)
} catch (error) {
  // Error de red - redirigir a página de error
  if (error instanceof NetworkError) {
    const errorCode = ERROR_CODES.REG_NET_001.code
    console.error(formatErrorLog(errorCode, error.message))
    return NextResponse.json({
      error: true,
      message: ERROR_CODES.REG_NET_001.userMessage,
      redirect: `/error?code=${errorCode}`
    }, { status: 503 })
  }
  
  // Error del servidor - redirigir a página de error
  if (error instanceof HttpError && error.status >= 500) {
    const errorCode = ERROR_CODES.REG_SRV_001.code
    console.error(formatErrorLog(errorCode, `HTTP ${error.status}`))
    return NextResponse.json({
      error: true,
      message: ERROR_CODES.REG_SRV_001.userMessage,
      redirect: `/error?code=${errorCode}`
    }, { status: 503 })
  }
  
  // Error de duplicado - mostrar inline (usuario puede corregir)
  if (errorMessage.includes("duplicate")) {
    const errorCode = ERROR_CODES.REG_DUP_001.code
    console.error(formatErrorLog(errorCode, errorMessage))
    return NextResponse.json({
      error: ERROR_CODES.REG_DUP_001.userMessage,
      code: errorCode
    }, { status: 409 })
  }
  
  // Error genérico - redirigir a página de error
  const errorCode = ERROR_CODES.ERR_GEN_000.code
  console.error(formatErrorLog(errorCode, error.message))
  return NextResponse.json({
    error: true,
    message: ERROR_CODES.ERR_GEN_000.userMessage,
    redirect: `/error?code=${errorCode}`
  }, { status: 500 })
}
```

### En el formulario de onboarding

El formulario debe detectar cuando la respuesta incluye `redirect` y redirigir a la página de error:

```typescript
// En components/onboarding-form.tsx
const handleSubmit = async (e: React.FormEvent) => {
  // ...
  const response = await fetch("/api/users/register", { ... })
  const data = await response.json()

  // Si hay error con redirect, ir a página de error
  if (data.error && data.redirect) {
    router.push(data.redirect)
    return
  }

  // Si hay error sin redirect (ej: duplicado), mostrar inline
  if (!response.ok) {
    setSubmitError(data.message || data.error)
    setErrorCode(data.code || null)
    return
  }
  
  // Éxito - redirigir al dashboard
  router.push(data.redirect)
}
```

---

## Logging

Todos los errores deben loggearse con el siguiente formato:

```
[CÓDIGO] Mensaje descriptivo
```

Ejemplo:
```
[AUTH-NET-001] NetworkError: Failed to fetch user from database
[REG-SRV-001] HttpError 500: Internal Server Error
```

Esto permite:
1. Buscar rápidamente en logs por código
2. Correlacionar reportes de usuario con logs del servidor
3. Identificar patrones de errores

---

## Seguridad

### Información NO expuesta al usuario
- Mensajes de error técnicos
- Stack traces
- Nombres de variables de entorno
- URLs internas
- Detalles de la base de datos

### Información expuesta al usuario
- Código alfanumérico (ej: AUTH-NET-001)
- Mensaje genérico amigable
- Botón para volver al inicio

---

## Dependencias

- No se requieren nuevas dependencias npm
- Usar tipos TypeScript existentes

