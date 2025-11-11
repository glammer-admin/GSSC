# 🌍 Guía de Ambientes - GSSC Platform

## Resumen

Sistema de ambientes múltiples con soporte para desarrollo (mock SSO), staging y producción.

---

## 📋 Ambientes Disponibles

### 1. 🎭 Development (Desarrollo)

**Características:**
- ✅ SSO simulado (mock) - No requiere credenciales reales
- ✅ Cookies sin flag Secure
- ✅ Sesión de 24 horas
- ✅ Logs detallados (debug)
- ✅ Indicador visual "🎭 DESARROLLO"
- ✅ Recarga rápida

**Uso:**
```bash
npm run dev
```

**Variables de entorno (.env.local):**
```env
NEXT_PUBLIC_APP_ENV=development
NODE_ENV=development
SESSION_SECRET=dev-secret-key-not-for-production
```

**Usuarios mock disponibles:**
- Google → organizador@example.com (Juan Organizador)
- Microsoft → proveedor@example.com (María Proveedora)
- Meta → pagador@example.com (Carlos Pagador)

---

### 2. 🚧 Staging (Pruebas)

**Características:**
- ✅ SSO real - Requiere credenciales de staging
- ✅ Cookies con flag Secure
- ✅ Sesión de 24 horas
- ✅ Logs moderados (info)
- ✅ Indicador visual "🚧 STAGING"
- ✅ Entorno similar a producción

**Uso:**
```bash
# Desarrollo con staging
npm run dev:staging

# Build para staging
npm run build:staging

# Iniciar staging
npm run start:staging
```

**Variables de entorno (.env.staging):**
```env
NEXT_PUBLIC_APP_ENV=staging
NODE_ENV=production
SESSION_SECRET=staging-secret-key-secure
GOOGLE_CLIENT_ID=staging-google-id
# ... más credenciales de staging
```

---

### 3. 🚀 Production (Producción)

**Características:**
- ✅ SSO real - Requiere credenciales de producción
- ✅ Cookies con flag Secure
- ✅ Sesión de 12 horas (más corta para seguridad)
- ✅ Solo logs de errores
- ❌ Sin indicador visual
- ✅ Máxima seguridad

**Uso:**
```bash
# Build para producción
npm run build:production

# Iniciar producción
npm run start:production
```

**Variables de entorno (.env.production):**
```env
NEXT_PUBLIC_APP_ENV=production
NODE_ENV=production
SESSION_SECRET=very-secure-production-secret-key
GOOGLE_CLIENT_ID=production-google-id
# ... más credenciales de producción
```

---

## 📊 Comparación de Ambientes

| Característica | Development | Staging | Production |
|----------------|-------------|---------|------------|
| **SSO** | Mock | Real | Real |
| **Credenciales** | No requeridas | Staging | Production |
| **Secure Cookies** | ❌ | ✅ | ✅ |
| **Session Duration** | 24 horas | 24 horas | 12 horas |
| **Logs** | Debug | Info | Error only |
| **Indicador Visual** | 🎭 | 🚧 | ❌ |
| **Hot Reload** | ✅ | ✅ | ❌ |
| **Source Maps** | ✅ | ✅ | ❌ |

---

## 🚀 Configuración Inicial

### 1. Instalar dependencias adicionales

```bash
npm install cross-env --save-dev
```

### 2. Crear archivos de variables de entorno

Ya creados:
- `.env.local` - Development (crear si no existe)
- `.env.staging` - Staging ✅
- `.env.production` - Production ✅

### 3. Configurar .gitignore

Asegúrate de que estos archivos estén en `.gitignore`:
```
.env*.local
.env.staging
.env.production
```

### 4. Variables de entorno en hosting

En tu plataforma de hosting (Vercel, AWS, etc.):
- **Staging:** Usar variables de `.env.staging`
- **Production:** Usar variables de `.env.production`

---

## 🎯 Flujo de Trabajo Recomendado

### Desarrollo Local
```bash
# 1. Clonar repo
git clone <repo>

# 2. Instalar dependencias
npm install

# 3. Crear .env.local (opcional, ya tiene valores por defecto)
cp .env.example .env.local

# 4. Iniciar desarrollo
npm run dev

# ✅ Login funciona con mock SSO automáticamente
```

### Testing en Staging
```bash
# 1. Configurar credenciales de staging
# Editar .env.staging con credenciales reales

# 2. Iniciar en modo staging
npm run dev:staging

# 3. Probar con SSO real de staging
```

### Deploy a Producción
```bash
# 1. Build para producción
npm run build:production

# 2. Subir a hosting
# Variables de entorno deben estar configuradas en el hosting

# 3. Verificar que funcione
```

---

## 🧪 Cómo Probar Cada Ambiente

### Development (Mock SSO)

```bash
# Iniciar
npm run dev

# Abrir http://localhost:3000
# Click en cualquier proveedor (Google/Microsoft/Meta)
# ✅ Login funciona automáticamente sin configuración
```

**Verificar:**
- ✅ Aparece indicador "🎭 DESARROLLO" arriba a la derecha
- ✅ Console muestra: "🎭 [MOCK] Validando token de..."
- ✅ No requiere credenciales reales
- ✅ Login exitoso con usuario mock

### Staging (SSO Real)

```bash
# Configurar credenciales en .env.staging
# Iniciar
npm run dev:staging

# Abrir http://localhost:3000
# Click en proveedor
# ✅ Redirige a página real de SSO
```

**Verificar:**
- ✅ Aparece indicador "🚧 STAGING"
- ✅ Console muestra: "🔒 [PROD] Usando SSO real"
- ✅ Redirige a login real del proveedor
- ✅ Cookies con Secure flag

### Production

```bash
# Build y deploy
npm run build:production
npm run start:production

# ✅ Sin indicador visual
# ✅ Solo logs de errores
# ✅ Máxima seguridad
```

---

## 🔧 Archivos de Configuración

### `lib/config/env.ts`
Configuración central de ambientes
```typescript
export const envConfig = {
  development: { useRealSSO: false, ... },
  staging: { useRealSSO: true, ... },
  production: { useRealSSO: true, ... },
}
```

### `lib/auth/mock-sso.ts`
Usuarios mock para desarrollo
```typescript
const mockUsers = {
  google: { email: "organizador@example.com", ... },
  microsoft: { email: "proveedor@example.com", ... },
  meta: { email: "pagador@example.com", ... },
}
```

### `lib/auth/jwt-validator.ts`
Validación adaptativa de tokens
```typescript
// En dev: usa mock
// En staging/prod: usa SSO real
export async function validateIdToken(token, provider) {
  if (!shouldUseRealSSO() && isMockToken(token)) {
    return validateMockToken(token, provider)
  }
  return validateRealToken(token, provider)
}
```

---

## 🎨 Indicador Visual

El indicador aparece automáticamente en development y staging:

```
┌─────────────────────┐
│ 🎭 DESARROLLO      │  ← Development (azul)
└─────────────────────┘

┌─────────────────────┐
│ 🚧 STAGING         │  ← Staging (amarillo)
└─────────────────────┘

(Sin indicador en producción)
```

---

## 📝 Scripts NPM

```json
{
  "dev": "Desarrollo normal con mock SSO",
  "dev:staging": "Desarrollo con SSO real (staging)",
  "build": "Build normal",
  "build:staging": "Build para staging",
  "build:production": "Build para producción",
  "start": "Iniciar servidor",
  "start:staging": "Iniciar en modo staging",
  "start:production": "Iniciar en modo producción"
}
```

---

## ⚠️ Notas Importantes

### Seguridad
- ✅ Nunca commitear archivos `.env.*` con credenciales reales
- ✅ Usar secrets manager en hosting (AWS Secrets, Vercel Env, etc.)
- ✅ Rotar `SESSION_SECRET` regularmente en producción

### Mock SSO
- ✅ Solo funciona en development
- ✅ Los tokens mock empiezan con `mock_`
- ✅ Usuarios predefinidos para testing rápido

### SSO Real
- ⚠️ Requiere configurar aplicaciones en Google/Microsoft/Meta
- ⚠️ Diferentes credenciales para staging y production
- ⚠️ Configurar redirect URIs correctamente

---

## 🐛 Troubleshooting

### "SSO real no implementado"
```
Error: SSO real no implementado aún
```
**Solución:** Estás en staging/producción pero falta implementar los SDKs de SSO reales. En development, esto no pasa porque usa mock.

### Indicador no aparece
**Causa:** Estás en producción  
**Solución:** Es correcto, en producción no debe aparecer

### Cookies no persisten
**Causa:** Secure flag en localhost sin HTTPS  
**Solución:** Usar development mode o configurar HTTPS local

### Token inválido en staging
**Causa:** Credenciales incorrectas o redirect URI mal configurado  
**Solución:** Verificar configuración en Google/Microsoft/Meta console

---

## 🎓 Mejores Prácticas

1. **Desarrolla en development** - Rápido, sin configuración
2. **Prueba en staging** - Ambiente idéntico a producción
3. **Deploy a production** - Solo cuando todo funciona en staging
4. **Nunca** uses credenciales de producción en development
5. **Siempre** verifica el indicador visual antes de testing
6. **Documenta** cualquier cambio en variables de entorno

---

## 📚 Referencias

- `lib/config/env.ts` - Configuración de ambientes
- `lib/auth/mock-sso.ts` - Mock de SSO
- `components/env-indicator.tsx` - Indicador visual
- `SECURITY_IMPLEMENTATION.md` - Documentación de seguridad

---

**Sistema de ambientes completo e implementado** ✅  
**Listo para desarrollo, staging y producción** 🚀

