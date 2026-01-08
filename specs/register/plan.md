# Plan de Implementación: Sistema de Registro y Validación de Usuarios

## Objetivo
Implementar el flujo completo de registro y validación de usuarios después del login SSO, incluyendo cliente HTTP genérico, abstracción de usuarios, selección de rol y onboarding.

---

## Fases de Implementación

### ✅ Fase 1: Cliente HTTP Genérico (COMPLETADA)
**Estado:** Implementado

#### Archivos Implementados
- `lib/http/client.ts` - Cliente HTTP genérico con `HttpError` y `NetworkError`
- `lib/http/users/types.ts` - Types para `GlamUser`, `CreateUserDTO`, `UserRole`, etc.
- `lib/http/users/users-client.ts` - Cliente de usuarios con `getUserByEmail()` y `createUser()`

---

### ✅ Fase 2: Modificación del Flujo de Autenticación (COMPLETADA)
**Estado:** Implementado

#### Archivos Modificados
- `app/api/auth/callback/route.ts` - Consulta BD, crea sesión temporal/completa, maneja errores con códigos
- `lib/auth/session-manager.ts` - Métodos para sesiones temporales y completas
- `middleware.ts` - Valida estados de sesión, permite acceso a rutas temporales

---

### ✅ Fase 3: API Route para Selección de Rol (COMPLETADA)
**Estado:** Implementado

#### Archivos Implementados
- `app/api/auth/set-role/route.ts` - Valida rol, actualiza sesión, retorna redirect

---

### ✅ Fase 4: API Route para Registro de Usuario (COMPLETADA)
**Estado:** Implementado

#### Archivos Implementados
- `app/api/users/register/route.ts` - Valida datos, crea usuario, maneja errores con redirección a `/error`

---

### ✅ Fase 5: Página de Selección de Rol (COMPLETADA)
**Estado:** Implementado

#### Archivos Implementados
- `app/select-role/page.tsx` - Server Component con validación de sesión
- `components/select-role-form.tsx` - Client Component con cards seleccionables, iconos, loading states

---

### ✅ Fase 6: Página de Onboarding (COMPLETADA)
**Estado:** Implementado

#### Archivos Implementados
- `app/onboarding/page.tsx` - Server Component con validación de sesión
- `components/onboarding-form.tsx` - Formulario completo con:
  - Pre-llenado de datos SSO
  - Validaciones client-side
  - Checklist de roles
  - Botón cancelar con diálogo de confirmación
  - Manejo de errores con redirección a `/error`

---

### ✅ Fase 7: Manejo de Errores (COMPLETADA)
**Estado:** Implementado (integrado con `specs/errors/`)

#### Archivos Implementados
- `lib/errors/error-codes.ts` - Catálogo de códigos de error
- `app/error/page.tsx` - Página de error unificada
- `components/error-code-display.tsx` - Componente para copiar código
- Callbacks OAuth (`google/callback`, `microsoft/callback`) - Redirigen a `/error` en fallos

---

### ✅ Fase 8: Testing y Validación (COMPLETADA)
**Estado:** Verificado

#### Flujos Probados
- ✅ Login con usuario nuevo → onboarding → dashboard
- ✅ Login con usuario existente 1 rol → dashboard directo
- ✅ Login con usuario existente 2+ roles → select-role → dashboard
- ✅ Manejo de errores de red → redirección a `/error?code=XXX`
- ✅ Cancelación de registro → logout y redirección a login

---

## Orden de Implementación (Completado)

```
✅ 1. lib/http/client.ts
✅ 2. lib/http/users/types.ts
✅ 3. lib/http/users/users-client.ts
✅ 4. lib/auth/session-manager.ts (modificar)
✅ 5. app/api/auth/callback/route.ts (modificar)
✅ 6. app/api/auth/set-role/route.ts (crear)
✅ 7. app/api/users/register/route.ts (crear)
✅ 8. middleware.ts (modificar)
✅ 9. app/select-role/page.tsx (crear)
✅ 10. components/select-role-form.tsx (crear)
✅ 11. app/onboarding/page.tsx (crear)
✅ 12. components/onboarding-form.tsx (crear)
✅ 13. lib/errors/error-codes.ts (crear - integración con specs/errors/)
✅ 14. app/error/page.tsx (crear)
✅ 15. components/error-code-display.tsx (crear)
```

---

## Checklist de Implementación

### Cliente HTTP
- [x] `HttpClient` con métodos básicos (GET, POST, PUT, DELETE, PATCH)
- [x] Manejo de query params
- [x] Manejo de errores HTTP (`HttpError`, `NetworkError`)
- [x] Types TypeScript para config y requests
- [x] `UsersClient` con métodos de usuarios
- [x] Types para `GlamUser`, `CreateUserDTO`, etc.

### Autenticación
- [x] Modificar callback para consultar BD
- [x] Crear sesión temporal vs completa
- [x] Actualizar session manager con nuevos métodos
- [x] Middleware permite `/select-role` y `/onboarding`
- [x] Middleware valida estados de sesión temporal

### API Routes
- [x] `POST /api/auth/set-role` funcional
- [x] `POST /api/users/register` funcional
- [x] Validaciones server-side
- [x] Manejo de errores con redirección a `/error?code=XXX`

### UI - Selección de Rol
- [x] Página `/select-role` renderiza correctamente
- [x] Componente cliente con lista de roles
- [x] Llamada a API y redirección funcionan
- [x] Loading states y errores

### UI - Onboarding
- [x] Página `/onboarding` renderiza correctamente
- [x] Formulario con todos los campos
- [x] Validaciones client-side
- [x] Pre-llenado de datos del SSO
- [x] Checklist de roles funcional
- [x] Llamada a API y redirección funcionan
- [x] Botón cancelar con diálogo de confirmación

### Manejo de Errores (integrado con specs/errors/)
- [x] Catálogo de códigos de error (`lib/errors/error-codes.ts`)
- [x] Página de error unificada (`app/error/page.tsx`)
- [x] Componente para copiar código (`components/error-code-display.tsx`)
- [x] Redirección a `/error?code=XXX` en errores de red/servidor
- [x] Callbacks OAuth redirigen a `/error` en caso de fallo

### Testing
- [x] Flujo usuario nuevo completo
- [x] Flujo usuario con 1 rol
- [x] Flujo usuario con 2+ roles
- [x] Manejo de errores de red
- [x] Validaciones de formulario

---

## Consideraciones Técnicas

### Variables de Entorno

**Requeridas en `.env.local`:**
```bash
BACKEND_API_URL=http://localhost:54321/rest/v1
BACKEND_API_KEY=<your-api-key>
BACKEND_DB_SCHEMA=gssc_db
```

### Headers HTTP
Los headers deben configurarse correctamente según la operación usando las variables de entorno:

```typescript
// GET requests
{
  "apikey": process.env.BACKEND_API_KEY,
  "Authorization": `Bearer ${process.env.BACKEND_API_KEY}`,
  "Accept-Profile": process.env.BACKEND_DB_SCHEMA
}

// POST requests
{
  "apikey": process.env.BACKEND_API_KEY,
  "Authorization": `Bearer ${process.env.BACKEND_API_KEY}`,
  "Content-Profile": process.env.BACKEND_DB_SCHEMA,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
}
```

### Mapeo de Roles

**Roles en BD (inglés):**
- `buyer` - Comprador
- `organizer` - Organizador
- `supplier` - Proveedor (solo interno)

**Mapeo a Dashboards:**
- `buyer` → `/product/[id]`
- `organizer` → `/dashboard`
- `supplier` → `/customer-dash`

### Validación de Email

El email usado para consultar la BD DEBE venir del token SSO validado, nunca de input del usuario.

---

## Riesgos y Mitigaciones

### Riesgo 1: BD Externa no Disponible
**Mitigación:**
- Timeout de 10 segundos
- Ver `specs/errors/` para manejo de errores con códigos

### Riesgo 2: Usuario Modificado Durante el Flujo
**Mitigación:**
- Usar timestamps en sesión temporal
- Expiración corta (5 minutos) para sesiones temporales
- Re-validar datos antes de crear usuario

### Riesgo 3: Múltiples Tabs/Ventanas
**Mitigación:**
- Sesión se sincroniza vía cookie
- Validar estado en cada página load
- Redirigir si sesión ya está completa

---

## Tiempo Total Estimado

- **Fase 1:** 45 min (Cliente HTTP) ✅
- **Fase 2:** 60 min (Flujo de autenticación) ✅
- **Fase 3:** 30 min (API set-role) ✅
- **Fase 4:** 40 min (API register) ✅
- **Fase 5:** 40 min (Página select-role) ✅
- **Fase 6:** 60 min (Página onboarding) ✅
- **Fase 7:** 45 min (Manejo de errores) ✅
- **Fase 8:** 30 min (Testing) ✅

**Total: ~5-6 horas** de implementación activa

**Estado: ✅ COMPLETADO**

---

## Especificaciones Relacionadas

- **Manejo de Errores:** Ver `specs/errors/plan.md` para la implementación del sistema de códigos de error.
- **Configuración de Facturación (Organizer):** Ver `specs/settings/provider/billing/plan.md` para la implementación del módulo de facturación y pagos. Este módulo se implementa **después del registro** y permite a los organizadores configurar sus datos fiscales y bancarios para recibir pagos.

---

## Siguientes Pasos (Mejoras Futuras)

1. **Configuración de Facturación para Organizadores**
   - Implementar módulo de billing en `/settings/billing`
   - Ver `specs/settings/provider/billing/plan.md` para detalles
   - Integración con backend de Supabase (billing_profiles, bank_accounts, billing_documents)
   - Carga de documentos a Supabase Storage

2. **Mejoras de UX**
   - Animaciones entre transiciones
   - Onboarding multi-step con progress bar
   - Validación de teléfono con servicio externo

3. **Cambio de Rol Sin Re-Login**
   - Endpoint `POST /api/auth/switch-role`
   - Componente dropdown en navbar
   - Actualización de sesión sin logout

4. **Analytics**
   - Tracking de conversión en onboarding
   - Análisis de selección de roles

5. **Integración con Backend de Producción**
   - Actualizar variables de entorno para staging/producción
   - Verificar conectividad y performance
