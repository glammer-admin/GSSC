# GSSC - Glamur Supply Chain Control

Plataforma de gestión colaborativa con autenticación SSO basada en roles.

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 18+ 
- npm o yarn
- Cuentas en Google Cloud Console y/o Azure Portal (para SSO real)

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd GSSC

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .example.env.environment .env.local

# 4. Editar .env.local con tus credenciales (ver sección Variables de Entorno)

# 5. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

---

## 📁 Estructura del Proyecto

```
GSSC/
├── app/                    # Next.js App Router
│   ├── api/auth/          # Endpoints de autenticación
│   ├── dashboard/         # Dashboard Organizador
│   ├── customer-dash/     # Dashboard Proveedor  
│   ├── product/[id]/      # Dashboard Pagador
│   └── page.tsx           # Página de login
├── components/            # Componentes React
├── lib/                   # Lógica de negocio
│   ├── auth/             # Sistema de autenticación
│   └── config/           # Configuración por ambiente
├── middleware.ts          # Middleware de autenticación
└── .env.local            # Variables de entorno (no versionado)
```

---

## 🔐 Variables de Entorno

### Archivo `.env.local`

Crea este archivo en la raíz del proyecto con las siguientes variables:

```bash
# ==============================================
# Sesión y Seguridad
# ==============================================
SESSION_SECRET=<generar-secret-aleatorio-64-chars>

# ==============================================
# Google OAuth (Organizador)
# ==============================================
GOOGLE_CLIENT_ID=<tu-google-client-id>
GOOGLE_CLIENT_SECRET=<tu-google-client-secret>

# ==============================================
# Microsoft Azure AD (Proveedor)
# ==============================================
MICROSOFT_CLIENT_ID=<tu-microsoft-client-id>
MICROSOFT_CLIENT_SECRET=<tu-microsoft-client-secret>
MICROSOFT_TENANT_ID=common

# ==============================================
# Meta/Facebook (Pagador) - Opcional
# ==============================================
META_APP_ID=<tu-meta-app-id>
META_APP_SECRET=<tu-meta-app-secret>

# ==============================================
# Ambiente
# ==============================================
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ==============================================
# Variables Públicas (Expuestas al cliente)
# ==============================================
NEXT_PUBLIC_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=${MICROSOFT_CLIENT_ID}
```

### Generar SESSION_SECRET

```bash
# Opción 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Opción 2: OpenSSL
openssl rand -base64 32

# Opción 3: Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Obtener Credenciales de Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita "Google+ API"
4. Ve a "Credentials" → "Create Credentials" → "OAuth client ID"
5. Application type: **Web application**
6. Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
7. Copia el **Client ID** y **Client Secret**

### Obtener Credenciales de Microsoft

1. Ve a [Azure Portal](https://portal.azure.com)
2. Azure Active Directory → App registrations → New registration
3. Name: `GSSC Platform`
4. Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
5. Redirect URI: **Web** → `http://localhost:3000/api/auth/microsoft/callback`
6. Register
7. Copia el **Application (client) ID**
8. Ve a "Certificates & secrets" → "New client secret"
9. Copia el **Value** (secret)

---

## 🌍 Ambientes

El proyecto soporta tres ambientes con configuraciones diferentes:

### Development (Desarrollo)

```bash
npm run dev
```

**Características:**
- Mock SSO si no hay credenciales
- Cookies inseguras (HTTP permitido)
- Sesión de 8 horas
- Logs detallados

### Staging (Pruebas)

```bash
npm run dev:staging
```

**Características:**
- SSO real requerido
- Cookies seguras (HTTPS)
- Sesión de 24 horas
- URL: Configurar en `NEXT_PUBLIC_APP_URL`

### Production (Producción)

```bash
# Build
npm run build:production

# Start
npm run start:production
```

**Características:**
- SSO real requerido
- Cookies seguras (HTTPS)
- Sesión de 7 días
- Optimizaciones de performance

---

## 🎭 Modo Desarrollo sin Credenciales

Si no configuras credenciales reales, la plataforma automáticamente:

1. ✅ Usa **Mock SSO** para todos los proveedores
2. ✅ Genera tokens de prueba automáticamente
3. ✅ Te permite probar toda la funcionalidad
4. ✅ Muestra indicador "DEVELOPMENT" en pantalla

**Usuarios Mock generados:**
- Google → `user@google.com` (Organizador)
- Microsoft → `user@microsoft.com` (Proveedor)
- Meta → `user@meta.com` (Pagador)

**No requiere configuración adicional para desarrollo local básico.**

---

## 👥 Roles y Accesos

| Rol | Provider | Dashboard | Menú |
|-----|----------|-----------|------|
| **Organizador** | Google | `/dashboard` | Dashboard, Proyectos, Pagos, Configuración |
| **Proveedor** | Microsoft | `/customer-dash` | Dashboard, Proyectos, Clientes, Calendario |
| **Pagador** | Meta | `/product/{id}` | Historial |

---

## 🧪 Testing

### Login con Mock SSO

```bash
npm run dev
# Visita http://localhost:3000
# Click cualquier botón de SSO
# Automáticamente crea usuario mock
```

### Login con SSO Real

```bash
# 1. Configurar .env.local con credenciales reales
# 2. Iniciar servidor
npm run dev

# 3. Visita http://localhost:3000
# 4. Click en botón de SSO
# 5. Auténticate con Google/Microsoft
```

---

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Modo desarrollo con mock SSO
npm run dev:staging      # Modo staging
npm run dev:production   # Modo production (dev server)

# Build
npm run build            # Build para producción
npm run build:staging    # Build para staging
npm run build:production # Build para production

# Start (después de build)
npm run start            # Iniciar servidor de producción
npm run start:staging    # Iniciar en modo staging
npm run start:production # Iniciar en modo production

# Utilidades
npm run lint             # Ejecutar linter
npm run type-check       # Verificar tipos TypeScript
```

---

## 🔒 Seguridad

### Características de Seguridad Implementadas

- ✅ **OAuth 2.0 + PKCE**: Estándar de autenticación segura
- ✅ **Client Secret en servidor**: Nunca expuesto al cliente
- ✅ **HttpOnly Cookies**: Sesión no accesible desde JavaScript
- ✅ **Secure Cookies**: Solo HTTPS en producción
- ✅ **SameSite Cookies**: Protección CSRF
- ✅ **JWT Validation**: Verificación con claves públicas
- ✅ **Role-Based Access Control**: Autorización por rol
- ✅ **Session Expiration**: Tokens con tiempo de vida limitado
- ✅ **Middleware Protection**: Todas las rutas validadas
- ✅ **Server-Side Rendering**: Auth en servidor

### Archivos Sensibles Protegidos

El `.gitignore` protege automáticamente:
- `.env*` - Todas las variables de entorno
- `node_modules/` - Dependencias
- `.next/` - Build artifacts

**⚠️ NUNCA hagas commit de archivos `.env*` al repositorio**

---

## 🚀 Deployment

### Vercel (Recomendado)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Configurar variables de entorno en Vercel Dashboard
# Project Settings → Environment Variables
```

### Docker

```bash
# Build image
docker build -t gssc-platform .

# Run container
docker run -p 3000:3000 \
  -e SESSION_SECRET=<secret> \
  -e GOOGLE_CLIENT_ID=<id> \
  -e GOOGLE_CLIENT_SECRET=<secret> \
  -e MICROSOFT_CLIENT_ID=<id> \
  -e MICROSOFT_CLIENT_SECRET=<secret> \
  gssc-platform
```

### Variables de Entorno en Producción

En tu plataforma de hosting, configura:

**Requeridas:**
- `SESSION_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL=https://tu-dominio.com`

**Opcionales:**
- `META_APP_ID`
- `META_APP_SECRET`

**No olvides actualizar las redirect URIs en Google Cloud Console y Azure Portal con tu dominio de producción.**

---

## 📚 Documentación

- **[DOCS_TECHNICAL.md](./DOCS_TECHNICAL.md)** - Arquitectura técnica y consideraciones de implementación
- **[DOCS_FUNCTIONAL.md](./DOCS_FUNCTIONAL.md)** - Manual de usuario y guía funcional

---

## 🐛 Troubleshooting

### Error: "Module not found: Can't resolve 'jose'"

```bash
npm install jose --legacy-peer-deps
```

### Error: "redirect_uri_mismatch"

Verifica que las URIs en Google Cloud Console / Azure Portal coincidan exactamente con:
```
http://localhost:3000/api/auth/google/callback
http://localhost:3000/api/auth/microsoft/callback
```

### Error: "No valid session"

1. Verifica que `SESSION_SECRET` esté configurado
2. Limpia cookies del navegador
3. Reinicia el servidor

### La página queda en "Procesando autenticación"

1. Abre la consola del navegador (F12)
2. Revisa errores en la pestaña Console
3. Verifica la pestaña Network para ver qué request falla
4. Revisa logs del servidor

---

## 🤝 Contribución

### Workflow de Desarrollo

```bash
# 1. Crear rama feature
git checkout -b feature/nueva-funcionalidad

# 2. Hacer cambios y commit
git add .
git commit -m "feat: descripción de cambio"

# 3. Push y crear Pull Request
git push origin feature/nueva-funcionalidad
```

### Convenciones de Commit

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Formato, punto y coma faltantes, etc
- `refactor:` Refactorización de código
- `test:` Agregar tests
- `chore:` Actualizar build, dependencias, etc

---

## 📄 Licencia

Propietario - Glamur SSC Platform

---

## 📞 Soporte

- Email: soporte@glamur-ssc.com
- Documentación: Ver carpeta `/docs`
- Issues: [GitHub Issues](link-to-issues)

---

_Desarrollado con ❤️ por el equipo de Glamur_

