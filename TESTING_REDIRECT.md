# 🧪 Guía de Pruebas: Redirección de Usuarios Autenticados

## 🎯 Objetivo
Verificar que usuarios autenticados son redirigidos automáticamente desde `/` a su dashboard correspondiente.

---

## ✅ Test Suite Completo

### Test 1: Usuario Organizador (Google)

```bash
# PASO 1: Login
1. Abrir http://localhost:3000/
2. Click en "Continue with Google"
3. Esperar redirección a /dashboard
✅ Debe mostrar "Dashboard Organizador"

# PASO 2: Intento de volver a login
4. En URL bar escribir: http://localhost:3000/
5. Presionar Enter

# ✅ RESULTADO ESPERADO:
- Redirigido inmediatamente a /dashboard
- NO ve login form
- Console log: "🔄 [MIDDLEWARE] Usuario autenticado accediendo a /, redirigiendo a dashboard..."
```

---

### Test 2: Usuario Proveedor (Microsoft)

```bash
# PASO 1: Login
1. Abrir http://localhost:3000/
2. Click en "Continue with Microsoft"
3. Esperar redirección a /customer-dash
✅ Debe mostrar "Dashboard Proveedor"

# PASO 2: Intento de volver a login
4. En URL bar escribir: http://localhost:3000/
5. Presionar Enter

# ✅ RESULTADO ESPERADO:
- Redirigido inmediatamente a /customer-dash
- NO ve login form
- Console log: "🔄 [MIDDLEWARE] Usuario autenticado accediendo a /, redirigiendo a dashboard..."
```

---

### Test 3: Usuario Pagador (Meta)

```bash
# PASO 1: Login
1. Abrir http://localhost:3000/
2. Click en "Continue with Meta"
3. Esperar redirección a /product/1234asdf
✅ Debe mostrar "Dashboard Pagador"

# PASO 2: Intento de volver a login
4. En URL bar escribir: http://localhost:3000/
5. Presionar Enter

# ✅ RESULTADO ESPERADO:
- Redirigido inmediatamente a /product/1234asdf
- NO ve login form
- Console log: "🔄 [MIDDLEWARE] Usuario autenticado accediendo a /, redirigiendo a dashboard..."
```

---

### Test 4: Usuario Sin Sesión

```bash
# PASO 1: Asegurar no hay sesión
1. Abrir http://localhost:3000/
2. Si hay sesión, hacer logout

# PASO 2: Acceder a login
3. Abrir http://localhost:3000/

# ✅ RESULTADO ESPERADO:
- Muestra login form
- NO hay redirección
- Puede elegir SSO provider
```

---

### Test 5: Logout y Re-acceso

```bash
# PASO 1: Hacer login
1. Login con cualquier proveedor
2. Estar en dashboard

# PASO 2: Logout
3. Click en "Cerrar sesión"
4. Console debe mostrar:
   🚪 [CLIENT] Iniciando logout...
   🧹 [CLIENT] Limpiando localStorage y sessionStorage...
   📡 [CLIENT] Llamando a /api/auth/logout...
   🚪 [LOGOUT] Sesión eliminada del servidor
   ✅ [LOGOUT] Cookie eliminada y headers de limpieza establecidos
   ✅ [CLIENT] Logout exitoso
   🔄 [CLIENT] Redirigiendo a: /

# PASO 3: Verificar redirección a login
5. Debe estar en http://localhost:3000/
6. Debe ver login form

# PASO 4: Intentar volver a login (debe permitir)
7. En URL bar: http://localhost:3000/
8. Presionar Enter

# ✅ RESULTADO ESPERADO:
- Muestra login form (NO redirige)
- Cookie eliminada
- localStorage vacío
```

---

### Test 6: DevTools Network

```bash
# PASO 1: Abrir DevTools
1. Presionar F12
2. Ir a tab "Network"
3. Marcar "Preserve log"

# PASO 2: Login y verificar cookie
4. Login con cualquier proveedor
5. Ir a Application > Cookies > http://localhost:3000
6. Verificar que existe: gssc_session
✅ Cookie debe tener:
   - HttpOnly: true
   - Path: /
   - Expires: (fecha futura)

# PASO 3: Intentar acceder a login
7. En URL escribir: http://localhost:3000/
8. En Network tab ver:

# ✅ RESULTADO ESPERADO:
GET / → Status: 307 Temporary Redirect
        Location: /dashboard (o /customer-dash o /product/1234asdf)
```

---

### Test 7: localStorage Verificación

```bash
# PASO 1: Login
1. Login con cualquier proveedor
2. Abrir Console (F12)

# PASO 2: Verificar localStorage
3. En console escribir: localStorage.getItem('user')

# ✅ RESULTADO ESPERADO:
{
  "sub": "mock-sub-...",
  "email": "user@example.com",
  "name": "Usuario ...",
  "role": "Organizador" | "Proveedor" | "Pagador",
  "provider": "google" | "microsoft" | "meta"
}

# PASO 3: Intentar acceder a login
4. En URL: http://localhost:3000/
5. En console debe ver:
   🔄 [CLIENT] Usuario autenticado detectado en login, redirigiendo...
   (solo si el middleware no capturó primero)
```

---

### Test 8: Navegación por URL Manual

```bash
# Mientras estás autenticado, probar estas URLs:

# Test 8.1: Acceso directo a /
http://localhost:3000/
✅ Redirige a tu dashboard

# Test 8.2: Acceso a dashboard permitido
http://localhost:3000/dashboard (si eres Organizador)
✅ Acceso permitido

# Test 8.3: Acceso a dashboard NO permitido
http://localhost:3000/customer-dash (si eres Organizador)
✅ Redirige a /dashboard (tu dashboard default)

# Test 8.4: Refresh en dashboard
F5 en /dashboard
✅ Permanece en /dashboard
```

---

### Test 9: Múltiples Tabs

```bash
# PASO 1: Login en Tab 1
1. Tab 1: Login con cualquier proveedor
2. Tab 1: Estar en dashboard

# PASO 2: Abrir Tab 2
3. Tab 2: Abrir http://localhost:3000/

# ✅ RESULTADO ESPERADO:
- Tab 2 redirige a dashboard (comparte cookie)

# PASO 3: Logout en Tab 1
4. Tab 1: Hacer logout

# PASO 4: Verificar Tab 2
5. Tab 2: Refresh (F5)

# ✅ RESULTADO ESPERADO:
- Tab 2 redirige a login (cookie eliminada)
```

---

### Test 10: Sesión Expirada

```bash
# NOTA: Este test requiere esperar o modificar sessionDuration

# PASO 1: Login
1. Login con cualquier proveedor

# PASO 2: Esperar expiración
2. Esperar (sessionDuration configurado en lib/config/env.ts)
   - Development: 24 horas
   - Production: 8 horas

# PASO 3: Intentar acceder a ruta protegida
3. Navegar a cualquier ruta protegida

# ✅ RESULTADO ESPERADO:
- Redirigido a login
- Cookie eliminada
- Console: "Middleware error: ..."
```

---

## 🔍 Verificaciones en Cada Test

### ✅ Checklist General

Después de cada test, verificar:

```
□ Console no muestra errores
□ Network tab muestra status correctos (200, 307)
□ Cookie presente o ausente según corresponda
□ localStorage presente o ausente según corresponda
□ Redirección al dashboard correcto por rol
□ No hay loops de redirección
□ No hay flash de login form
□ Performance aceptable (< 200ms)
```

---

## 🐛 Troubleshooting

### Problema: Aún veo login form por un momento

**Causa posible:**
- AuthRedirect (cliente) ejecutándose en vez de middleware

**Verificar:**
```bash
# En console, si ves este log:
🔄 [CLIENT] Usuario autenticado detectado en login, redirigiendo...

# Significa que el middleware no se ejecutó primero.
# Verificar que la cookie existe:
document.cookie // Debe incluir gssc_session
```

**Solución:**
- Es normal un flash mínimo
- Si el flash es > 500ms, verificar middleware config

---

### Problema: Loop de redirección

**Causa posible:**
- `getDefaultRouteForRole` devolviendo "/"

**Verificar:**
```bash
# En console:
console.log(getDefaultRouteByRole('Organizador'))
// NO debe devolver "/"
```

**Solución:**
- Revisar `lib/menu-config.ts`
- Asegurar que cada rol tiene ruta válida

---

### Problema: 401 en dashboard

**Causa posible:**
- Cookie no se está enviando

**Verificar:**
```bash
# DevTools > Network > Request Headers
Cookie: gssc_session=...

# Si no está presente:
1. Verificar que el login fue exitoso
2. Verificar que la cookie se creó (Application > Cookies)
3. Verificar que credentials: 'include' en fetch
```

---

### Problema: No redirige en Tab 2

**Causa posible:**
- Cookie no se comparte entre tabs

**Verificar:**
```bash
# En ambas tabs:
# DevTools > Application > Cookies
# Debe mostrar la misma cookie gssc_session
```

**Solución:**
- Verificar que las tabs son del mismo dominio
- Verificar que la cookie tiene Path: /

---

## 📊 Resultados Esperados (Resumen)

| Escenario | Usuario | URL | Resultado |
|-----------|---------|-----|-----------|
| Login nuevo | Sin sesión | `/` | Login form ✅ |
| Después login Google | Con sesión | `/dashboard` | Dashboard Organizador ✅ |
| Intento volver login | Con sesión | `/` | Redirect a `/dashboard` ✅ |
| Después login Microsoft | Con sesión | `/customer-dash` | Dashboard Proveedor ✅ |
| Intento volver login | Con sesión | `/` | Redirect a `/customer-dash` ✅ |
| Después login Meta | Con sesión | `/product/1234asdf` | Dashboard Pagador ✅ |
| Intento volver login | Con sesión | `/` | Redirect a `/product/1234asdf` ✅ |
| Después logout | Sin sesión | `/` | Login form ✅ |
| Acceso ruta sin permisos | Con sesión | Cualquiera | Redirect a default ✅ |
| Sesión expirada | Sin sesión | Cualquiera | Redirect a `/` ✅ |

---

## 🎯 Tests de Integración

### Test Completo de Flujo

```bash
# Flujo completo Organizador:
1. Abrir http://localhost:3000/
   ✅ Ve login form
   
2. Click "Continue with Google"
   ✅ Redirige a /dashboard
   ✅ Ve "Dashboard Organizador"
   
3. En URL escribir http://localhost:3000/
   ✅ Redirige inmediatamente a /dashboard
   ✅ NO ve login form
   
4. Click en "Cerrar sesión"
   ✅ Redirige a /
   ✅ Ve login form
   
5. En URL escribir http://localhost:3000/
   ✅ Permanece en /
   ✅ Ve login form (puede hacer login)
```

---

## ✅ Criterios de Éxito

### Todos los tests deben pasar:
- ✅ 10/10 Tests básicos
- ✅ 0 errores en console
- ✅ 0 loops de redirección
- ✅ Performance < 200ms
- ✅ UX fluida sin flashes

---

**Suite de pruebas completa** ✅  
**10 tests de funcionalidad** 🧪  
**Troubleshooting incluido** 🔧  
**Criterios de éxito claros** 🎯

