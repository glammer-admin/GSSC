# 🔄 Redirección Automática de Usuarios Autenticados

## ✅ Funcionalidad Implementada

### Problema Resuelto
Si un usuario ya tiene una sesión activa (cookie válida) e intenta acceder a la página de login (`/`), ahora es **redirigido automáticamente** a su dashboard correspondiente.

---

## 🎯 Comportamiento

### Escenario 1: Usuario sin sesión
```
Usuario → http://localhost:3000/
         ↓
    Muestra login form
```

### Escenario 2: Usuario con sesión activa
```
Usuario (Organizador) → http://localhost:3000/
                       ↓
              🔄 Redirección automática
                       ↓
            http://localhost:3000/dashboard
```

```
Usuario (Proveedor) → http://localhost:3000/
                     ↓
            🔄 Redirección automática
                     ↓
          http://localhost:3000/customer-dash
```

```
Usuario (Pagador) → http://localhost:3000/
                   ↓
          🔄 Redirección automática
                   ↓
        http://localhost:3000/product/1234asdf
```

---

## 🏗️ Arquitectura de Doble Capa

### 1. Capa SSR (Middleware) - **Primera línea de defensa**

```typescript
// middleware.ts
if (pathname === "/" && session) {
  console.log("🔄 [MIDDLEWARE] Usuario autenticado accediendo a /, redirigiendo a dashboard...")
  const defaultRoute = getDefaultRouteForRole(session.role)
  return NextResponse.redirect(new URL(defaultRoute, request.url))
}
```

**¿Cuándo se ejecuta?**
- En CADA petición al servidor
- Antes de que la página se renderice
- Verifica la cookie `gssc_session`

**Ventajas:**
- ✅ Rápido (se ejecuta en el servidor)
- ✅ Seguro (no manipulable por el cliente)
- ✅ Previene carga innecesaria de la página de login

---

### 2. Capa Cliente (AuthRedirect) - **Verificación adicional**

```typescript
// components/auth-redirect.tsx
useEffect(() => {
  const userStr = localStorage.getItem("user")
  
  if (userStr) {
    const user = JSON.parse(userStr)
    const defaultRoute = getDefaultRouteByRole(user.role)
    router.replace(defaultRoute)
  }
}, [router])
```

**¿Cuándo se ejecuta?**
- Cuando el componente se monta en el cliente
- Como fallback por si el middleware no capturó la sesión
- Verifica `localStorage`

**Ventajas:**
- ✅ Captura casos edge donde el middleware no se ejecutó
- ✅ Rápida respuesta en el cliente
- ✅ Sincronización con estado local

---

## 🔐 Flujo Completo

### Login → Navegación → Intento de volver al login

```
1. Usuario hace login (Google/Microsoft/Meta)
   │
   ├─> Cookie: gssc_session=xyz123
   ├─> localStorage: { user: { role: "Organizador", ... } }
   │
   ▼
2. Redirigido a /dashboard
   │
   ▼
3. Usuario navega por la app
   │
   ▼
4. Usuario intenta ir a http://localhost:3000/
   │
   ├─> MIDDLEWARE detecta session
   │   └─> 🔄 Redirect 302 → /dashboard
   │
   ├─> Si pasa el middleware (edge case)
   │   └─> AuthRedirect detecta localStorage
   │       └─> 🔄 router.replace('/dashboard')
   │
   ▼
5. Usuario permanece en /dashboard ✅
```

---

## 📊 Comparación Antes vs Ahora

| Situación | Antes | Ahora |
|-----------|-------|-------|
| Usuario autenticado → `/` | Muestra login form | Redirige a dashboard |
| Click en logo desde dashboard | Muestra login form | Permanece en dashboard |
| URL manual `localhost:3000/` | Muestra login form | Redirige a dashboard |
| Después de refresh | Muestra login | Redirige si hay sesión |

---

## 🧪 Cómo Probar

### Test 1: Redirección desde navegador
```bash
# 1. Hacer login como Organizador
# 2. Esperar estar en /dashboard
# 3. Modificar URL a http://localhost:3000/
# 4. Presionar Enter

# ✅ Resultado esperado: Redirige inmediatamente a /dashboard
```

### Test 2: Logs en consola
```bash
# En la consola del navegador deberías ver:
🔄 [MIDDLEWARE] Usuario autenticado accediendo a /, redirigiendo a dashboard...

# O en caso de client-side fallback:
🔄 [CLIENT] Usuario autenticado detectado en login, redirigiendo...
```

### Test 3: DevTools Network
```bash
# En DevTools > Network
# Al intentar acceder a /

1. GET / → Status 307 (Temporary Redirect)
2. Location: /dashboard
3. GET /dashboard → Status 200
```

---

## 🔍 Casos de Uso Cubiertos

### ✅ Caso 1: Usuario activo navega a raíz
```typescript
// Middleware captura y redirige
User (con session) → / → 307 → /dashboard
```

### ✅ Caso 2: Usuario refresca la página de login
```typescript
// Middleware captura antes de renderizar
F5 en / → Middleware → 307 → /dashboard
```

### ✅ Caso 3: Usuario sin sesión accede
```typescript
// Middleware permite acceso normal
User (sin session) → / → 200 → LoginForm
```

### ✅ Caso 4: Sesión expirada
```typescript
// Middleware detecta sesión inválida
User (session expired) → / → 200 → LoginForm
// Cookie eliminada automáticamente
```

---

## 🛡️ Seguridad

### Verificaciones de Seguridad

1. **Doble verificación**: Middleware + Cliente
2. **Basado en roles**: Cada rol va a su dashboard correcto
3. **No expone rutas**: Usuario no ve login form si está autenticado
4. **Previene loops**: Solo redirige si pathname === "/"

### Qué NO puede hacer un atacante

❌ Manipular cookie → Middleware valida JWT  
❌ Modificar localStorage → Middleware usa cookie como fuente de verdad  
❌ Forzar acceso al login → Redirigido automáticamente  
❌ Bypass del middleware → AuthRedirect como fallback  

---

## 📝 Archivos Modificados

### 1. `middleware.ts`
```typescript
// CAMBIO 1: Removida "/" de PUBLIC_ROUTES
- const PUBLIC_ROUTES = ["/", "/api/auth/login", ...]
+ const PUBLIC_ROUTES = ["/api/auth/login", ...]

// CAMBIO 2: Lógica de redirección para usuarios autenticados
+ if (pathname === "/" && session) {
+   const defaultRoute = getDefaultRouteForRole(session.role)
+   return NextResponse.redirect(new URL(defaultRoute, request.url))
+ }
```

### 2. `components/auth-redirect.tsx` (NUEVO)
```typescript
// Componente cliente para verificación adicional
export function AuthRedirect() {
  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      const user = JSON.parse(userStr)
      const defaultRoute = getDefaultRouteByRole(user.role)
      router.replace(defaultRoute)
    }
  }, [router])
  
  return null
}
```

### 3. `app/page.tsx`
```typescript
// Integración del componente de redirección
+ import { AuthRedirect } from "@/components/auth-redirect"

export default function Home() {
  return (
    <div>
+     <AuthRedirect />
      <LoginForm />
    </div>
  )
}
```

---

## 🎯 Flujo de Decisión del Middleware

```
┌─────────────────────────────────────┐
│   Request a pathname: "/"           │
└──────────────┬──────────────────────┘
               │
               ▼
    ┌─────────────────────┐
    │  ¿Hay sesión válida? │
    └──────┬──────┬────────┘
           │      │
        NO │      │ SÍ
           │      │
           ▼      ▼
    ┌──────────┐  ┌─────────────────────┐
    │  Permite │  │  Redirige a dashboard│
    │  acceso  │  │  según rol           │
    │  normal  │  │  getDefaultRouteFor  │
    └──────────┘  │  Role(session.role)  │
                  └─────────────────────┘
```

---

## 🚀 Beneficios

1. **UX Mejorado**: Usuario no ve login si ya está autenticado
2. **Consistencia**: Comportamiento predecible
3. **Seguridad**: No se expone la página de login innecesariamente
4. **Performance**: Redirección 307 es más rápida que renderizar
5. **SEO friendly**: Redirecciones apropiadas
6. **Fallback robusto**: Doble capa de verificación

---

## 🔧 Troubleshooting

### Problema: Aún veo el login por un momento

**Solución**: Es el AuthRedirect actuando. Es normal ver un flash mínimo.

```typescript
// Para eliminarlo completamente:
// 1. El middleware debe ejecutarse correctamente
// 2. Verificar que la cookie esté presente
// 3. Ver Network tab si hay redirección 307
```

### Problema: Loop de redirección

**Solución**: Verificar que `getDefaultRouteForRole` devuelva una ruta válida y diferente de `/`.

```typescript
// En menu-config.ts
export function getDefaultRouteByRole(role?: string): string {
  const roleKey = role as keyof MenuConfig
  
  // Asegurar que NUNCA devuelva "/"
  if (!menuConfig[roleKey] || menuConfig[roleKey].length === 0) {
    return "/dashboard" // Fallback seguro
  }
  
  return menuConfig[roleKey][0].href
}
```

---

## ✅ Checklist de Verificación

```
✅ Usuario sin sesión puede ver login
✅ Usuario con sesión es redirigido automáticamente
✅ Redirección basada en rol (Organizador → /dashboard)
✅ Redirección basada en rol (Proveedor → /customer-dash)
✅ Redirección basada en rol (Pagador → /product/1234asdf)
✅ Logs en consola muestran redirección
✅ DevTools Network muestra 307 redirect
✅ No hay loop de redirección
✅ Sesión expirada permite ver login
✅ Logout permite volver al login
```

---

**Redirección automática implementada** ✅  
**Doble capa de verificación (SSR + Client)** 🔒  
**UX mejorada y segura** 🚀

