# 🚀 Quick Start - Ambientes

## ✅ Sistema Implementado

Tu proyecto ahora tiene **3 ambientes completos**:

| Ambiente | SSO | Comando | Indicador |
|----------|-----|---------|-----------|
| **Development** | Mock (sin credenciales) | `npm run dev` | 🎭 DESARROLLO |
| **Staging** | Real | `npm run dev:staging` | 🚧 STAGING |
| **Production** | Real | `npm run build:production` | (sin indicador) |

---

## 🎯 Usar Ahora (Development)

```bash
# 1. Iniciar servidor
npm run dev

# 2. Abrir http://localhost:3000

# 3. Click en cualquier proveedor (Google/Microsoft/Meta)
#    ✅ Login funciona automáticamente!

# 4. Verificar indicador "🎭 DESARROLLO" arriba a la derecha
```

**No necesitas configurar nada más!** El SSO está simulado.

---

## 👥 Usuarios Mock Disponibles

| Proveedor | Email | Nombre | Rol |
|-----------|-------|--------|-----|
| Google | organizador@example.com | Juan Organizador | Organizador |
| Microsoft | proveedor@example.com | María Proveedora | Proveedor |
| Meta | pagador@example.com | Carlos Pagador | Pagador |

---

## 📁 Archivos Creados

```
GSSC/
├── lib/
│   ├── config/
│   │   └── env.ts                 ✨ Configuración de ambientes
│   └── auth/
│       └── mock-sso.ts            ✨ Mock de SSO para desarrollo
│
├── components/
│   └── env-indicator.tsx          ✨ Indicador visual de ambiente
│
├── .env.staging                   ✨ Variables de staging
├── .env.production                ✨ Variables de producción
└── ENVIRONMENTS.md                ✨ Documentación completa
```

---

## 🔧 Archivos Modificados

- ✏️ `lib/auth/jwt-validator.ts` - Soporte para mock/real SSO
- ✏️ `lib/auth/session-manager.ts` - Cookies adaptativas por ambiente
- ✏️ `components/login-form.tsx` - Login con mock en dev
- ✏️ `app/layout.tsx` - Indicador de ambiente
- ✏️ `package.json` - Scripts para cada ambiente

---

## 🎨 Características por Ambiente

### 🎭 Development
- ✅ SSO simulado (tokens mock)
- ✅ Sin configuración requerida
- ✅ Cookies sin Secure flag
- ✅ Sesión: 24 horas
- ✅ Logs detallados

### 🚧 Staging  
- ✅ SSO real (requiere credenciales)
- ✅ Cookies con Secure flag
- ✅ Sesión: 24 horas
- ✅ Logs moderados

### 🚀 Production
- ✅ SSO real (requiere credenciales)
- ✅ Cookies con Secure flag
- ✅ Sesión: 12 horas (más segura)
- ✅ Solo logs de errores

---

## 📊 Cómo Funciona

### Development (Mock SSO)
```
Usuario → Click Login
    ↓
generateMockToken()  ← Token falso generado
    ↓
POST /api/auth/callback
    ↓
validateMockToken()  ← Validación simulada
    ↓
✅ Login exitoso (sin SSO real)
```

### Staging/Production (Real SSO)
```
Usuario → Click Login
    ↓
SDK de Google/MS/Meta  ← Redirige a login real
    ↓
ID Token real del proveedor
    ↓
POST /api/auth/callback
    ↓
validateRealToken()  ← Validación con claves públicas
    ↓
✅ Login exitoso (SSO real)
```

---

## 🧪 Probar Ambientes

### Development (Ahora mismo)
```bash
npm run dev
# ✅ Ya funciona con mock SSO
```

### Staging (Cuando tengas credenciales)
```bash
# 1. Editar .env.staging con credenciales reales
# 2. Ejecutar:
npm run dev:staging
```

### Production (Para deploy)
```bash
# 1. Configurar variables en tu hosting
# 2. Build:
npm run build:production
# 3. Deploy
```

---

## ⚙️ Variables de Entorno

### .env.local (Development - opcional)
```env
# Ya tiene valores por defecto
NEXT_PUBLIC_APP_ENV=development
```

### .env.staging (Staging - editar cuando uses)
```env
NEXT_PUBLIC_APP_ENV=staging
SESSION_SECRET=tu-secret-staging
GOOGLE_CLIENT_ID=staging-google-id
# ... más credenciales
```

### .env.production (Production - editar cuando uses)
```env
NEXT_PUBLIC_APP_ENV=production
SESSION_SECRET=tu-secret-production
GOOGLE_CLIENT_ID=production-google-id
# ... más credenciales
```

---

## 🎯 Próximos Pasos

1. **Ahora:** Usa development con mock SSO ✅
2. **Luego:** Configura staging cuando necesites probar con SSO real
3. **Finalmente:** Configura production para deploy

---

## 📚 Documentación Completa

- `ENVIRONMENTS.md` - Guía detallada de ambientes
- `SECURITY_IMPLEMENTATION.md` - Documentación de seguridad
- `LOGOUT_SECURITY.md` - Sistema de logout

---

## ✨ Resumen

✅ **3 ambientes configurados** (dev, staging, prod)  
✅ **Mock SSO funcionando** (desarrollo sin configuración)  
✅ **Indicador visual** (sabes en qué ambiente estás)  
✅ **Scripts NPM** (fácil cambiar entre ambientes)  
✅ **Configuración adaptativa** (cookies, sesión, logs)  
✅ **Listo para usar** (ya puedes desarrollar)  

---

**¡Sistema de ambientes completo e implementado!** 🎉

Ejecuta `npm run dev` y empieza a desarrollar con mock SSO.

