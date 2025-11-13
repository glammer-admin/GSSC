# Manual Funcional - GSSC Platform

## Índice

1. [Introducción](#introducción)
2. [Conceptos Básicos](#conceptos-básicos)
3. [Inicio de Sesión](#inicio-de-sesión)
4. [Roles y Permisos](#roles-y-permisos)
5. [Navegación](#navegación)
6. [Cerrar Sesión](#cerrar-sesión)
7. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Introducción

GSSC (Glamur Supply Chain Control) es una plataforma de gestión colaborativa que conecta tres tipos de usuarios diferentes:

- **Organizadores**: Gestionan proyectos y coordinan el trabajo
- **Proveedores**: Ejecutan servicios y gestionan clientes
- **Pagadores**: Realizan seguimiento de transacciones y pagos

Cada rol accede a la plataforma con un proveedor de autenticación diferente para mantener la seguridad y separación de responsabilidades.

---

## Conceptos Básicos

### ¿Qué es Single Sign-On (SSO)?

SSO permite iniciar sesión usando tu cuenta existente de Google, Microsoft o Meta, sin necesidad de crear una nueva contraseña. Es más seguro y conveniente.

### Roles y Proveedores

| Rol | Proveedor de Autenticación | Dashboard |
|-----|---------------------------|-----------|
| **Organizador** | Google | `/dashboard` |
| **Proveedor** | Microsoft | `/customer-dash` |
| **Pagador** | Meta/Facebook | `/product/{id}` |

Esta asignación automática garantiza que cada tipo de usuario use el sistema de autenticación de su organización.

---

## Inicio de Sesión

### Paso 1: Acceder a la Plataforma

1. Abre tu navegador web
2. Navega a la URL de la plataforma
3. Verás la pantalla de login con tres opciones de inicio de sesión

### Paso 2: Seleccionar tu Método de Autenticación

Dependiendo de tu rol en la organización:

#### **Si eres Organizador:**
1. Click en **"Continuar con Google"**
2. Selecciona tu cuenta de Google
3. Autoriza el acceso a la plataforma
4. Serás redirigido automáticamente al Dashboard

#### **Si eres Proveedor:**
1. Click en **"Continuar con Microsoft"**
2. Ingresa con tu cuenta corporativa de Microsoft
3. Autoriza el acceso a la plataforma
4. Serás redirigido automáticamente al Panel de Proveedores

#### **Si eres Pagador:**
1. Click en **"Continuar con Meta"**
2. Ingresa con tu cuenta de Facebook/Meta
3. Autoriza el acceso a la plataforma
4. Serás redirigido automáticamente al Historial de Productos

### Proceso de Autenticación

**Lo que sucede detrás de escena:**

```
1. Click en botón de SSO
   ↓
2. Redirigido a la página de login del proveedor
   (Google/Microsoft/Meta)
   ↓
3. Ingresas tus credenciales
   ↓
4. Autorizas el acceso a la aplicación
   ↓
5. Procesamiento seguro de tu información
   ↓
6. Creación de sesión protegida
   ↓
7. Redirigido a tu dashboard personalizado
```

**Tiempo estimado:** 5-10 segundos

### Pantalla de Procesamiento

Después de autenticarte con tu proveedor, verás una pantalla de procesamiento con:
- Spinner animado con los colores del proveedor
- Mensaje: "Completando autenticación"
- Mensaje: "Procesando tu información..."
- Mensaje: "¡Autenticación exitosa! Redirigiendo..."

Esta pantalla aparece por 1-2 segundos mientras se crea tu sesión segura.

---

## Roles y Permisos

### Organizador (Google)

**Dashboard Principal:** `/dashboard`

**Menú de Navegación:**
- 🏠 **Dashboard**: Vista general de proyectos y métricas
- 📁 **Proyectos**: Gestión de proyectos activos
- 💳 **Pagos**: Control de transacciones y facturación
- ⚙️ **Configuración**: Ajustes de cuenta y preferencias

**Permisos:**
- ✅ Ver todos los proyectos
- ✅ Gestionar pagos
- ✅ Configurar la plataforma
- ❌ No tiene acceso a secciones de Proveedor o Pagador

### Proveedor (Microsoft)

**Dashboard Principal:** `/customer-dash`

**Menú de Navegación:**
- 🏠 **Dashboard**: Vista general de clientes y servicios
- 📁 **Proyectos**: Proyectos asignados
- 👥 **Clientes**: Gestión de cartera de clientes
- 📅 **Calendario**: Agenda y planificación

**Permisos:**
- ✅ Ver proyectos asignados
- ✅ Gestionar clientes
- ✅ Actualizar calendario
- ❌ No tiene acceso a secciones de Organizador o Pagador

### Pagador (Meta)

**Dashboard Principal:** `/product/{id}`

**Menú de Navegación:**
- 📜 **Historial**: Registro de transacciones y pagos

**Permisos:**
- ✅ Ver historial de productos
- ✅ Consultar transacciones
- ❌ No tiene acceso a secciones de Organizador o Proveedor

---

## Navegación

### Barra Lateral (Sidebar)

La barra de navegación lateral está disponible en todas las pantallas después del login.

**Características:**
- **Collapsible**: Click en el icono `<` para contraer/expandir
- **Icónos visuales**: Cada sección tiene un icono distintivo
- **Menú dinámico**: Solo muestra las opciones relevantes para tu rol
- **Avatar de usuario**: Muestra tu foto de perfil y nombre

### Expandir/Contraer Sidebar

**Expandida (por defecto):**
- Ancho: 256px
- Muestra: Icono + Texto + Avatar completo
- Ideal para: Pantallas de escritorio

**Contraída:**
- Ancho: 80px
- Muestra: Solo iconos + Avatar reducido
- Ideal para: Pantallas pequeñas o más espacio de trabajo

**Cómo contraer/expandir:**
1. Click en el botón de flecha en la parte superior de la sidebar
2. El estado se mantiene durante tu sesión

### Información de Usuario

En la parte inferior de la sidebar:

**Cuando está expandida:**
- Avatar circular (foto de perfil)
- Nombre completo
- Rol asignado

**Cuando está contraída:**
- Avatar circular pequeño con iniciales

**Click en el avatar:**
- Abre un menú desplegable
- Opción: "Cerrar sesión"

---

## Cerrar Sesión

### Método 1: Desde el Avatar

1. Click en tu avatar en la parte inferior de la sidebar
2. Se abre un menú desplegable
3. Click en **"Cerrar sesión"**
4. Serás redirigido automáticamente a la página de login

### Método 2: URL Directa

También puedes acceder directamente a:
```
/api/auth/logout
```

### Proceso de Cierre de Sesión

**Lo que sucede automáticamente:**

1. ✅ Se elimina tu sesión del servidor
2. ✅ Se borran las cookies de autenticación
3. ✅ Se limpian datos locales del navegador
4. ✅ Se invalida tu token de sesión
5. ✅ Redirigido a la página de login

**Seguridad:**
- Tu sesión es completamente eliminada
- No quedan rastros en el navegador
- Debes autenticarte nuevamente para acceder

### Cierre Automático de Sesión

Tu sesión expirará automáticamente después de:

| Ambiente | Duración |
|----------|----------|
| Desarrollo | 8 horas |
| Staging | 24 horas |
| Producción | 7 días |

Cuando tu sesión expire, serás redirigido automáticamente al login.

---

## Preguntas Frecuentes

### ¿Por qué tengo que usar Google/Microsoft/Meta?

La plataforma usa autenticación federada (SSO) para:
- **Seguridad**: No necesitas crear otra contraseña
- **Conveniencia**: Usa tu cuenta existente
- **Auditoría**: Mejor trazabilidad de accesos
- **Separación de roles**: Cada tipo de usuario usa su sistema corporativo

### ¿Qué pasa si no tengo cuenta de Google/Microsoft/Meta?

Contacta con tu administrador para:
1. Obtener una cuenta del proveedor correspondiente a tu rol
2. O solicitar un método alternativo de acceso

### ¿Puedo cambiar mi rol?

No. Los roles están asignados según tu proveedor de autenticación:
- Google → Organizador
- Microsoft → Proveedor
- Meta → Pagador

Si necesitas acceso a un rol diferente, deberás usar una cuenta del proveedor correspondiente.

### ¿La plataforma guarda mi contraseña?

No. La plataforma **nunca** ve ni guarda tu contraseña. La autenticación la maneja directamente Google, Microsoft o Meta, y solo recibimos confirmación de que te autenticaste correctamente.

### ¿Puedo usar la plataforma en móvil?

Sí. La plataforma es responsive y funciona en:
- 📱 Teléfonos móviles
- 📱 Tablets
- 💻 Laptops
- 🖥️ Desktops

El sidebar se adapta automáticamente al tamaño de pantalla.

### ¿Qué información puede ver la plataforma de mi cuenta?

La plataforma solo accede a:
- ✅ Tu nombre completo
- ✅ Tu dirección de email
- ✅ Tu foto de perfil
- ❌ NO accede a tus emails
- ❌ NO accede a tus archivos
- ❌ NO accede a tus contactos

### ¿Qué hago si no puedo iniciar sesión?

**Problemas comunes y soluciones:**

**1. Error: "Popup bloqueado"**
- Solución: La plataforma usa redirect completo, no popups. Este error no debería aparecer.

**2. Error: "redirect_uri_mismatch"**
- Solución: Contacta con tu administrador. La configuración del SSO necesita actualizarse.

**3. Error: "invalid_client"**
- Solución: Contacta con tu administrador. Hay un problema con las credenciales de la plataforma.

**4. Error: "access_denied"**
- Solución: No autorizaste el acceso. Intenta nuevamente y acepta los permisos solicitados.

**5. La pantalla de procesamiento no avanza**
- Solución: 
  1. Verifica tu conexión a internet
  2. Recarga la página
  3. Intenta en modo incógnito
  4. Contacta con soporte técnico

### ¿Puedo tener múltiples sesiones abiertas?

Sí. Puedes iniciar sesión en múltiples dispositivos/navegadores simultáneamente. Cada sesión es independiente.

### ¿Cómo reporto un problema?

1. Toma una captura de pantalla del error
2. Anota qué estabas haciendo cuando ocurrió
3. Contacta con soporte técnico incluyendo:
   - Tu rol (Organizador/Proveedor/Pagador)
   - Navegador y versión
   - Descripción del problema
   - Capturas de pantalla

### ¿La plataforma es segura?

Sí. La plataforma implementa múltiples capas de seguridad:

- 🔒 **HTTPS**: Todas las comunicaciones encriptadas
- 🔒 **OAuth 2.0 + PKCE**: Estándar de industria para autenticación
- 🔒 **HttpOnly Cookies**: Sesión no accesible desde JavaScript
- 🔒 **Tokens firmados**: Verificación criptográfica en cada request
- 🔒 **Sesiones temporales**: Expiración automática
- 🔒 **Logout seguro**: Eliminación completa de sesión

### ¿Qué navegadores son compatibles?

**Totalmente compatibles:**
- ✅ Google Chrome (recomendado)
- ✅ Microsoft Edge
- ✅ Firefox
- ✅ Safari

**Versiones mínimas:**
- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

---

## Glosario

**SSO (Single Sign-On)**: Sistema que permite usar una sola identidad para acceder a múltiples aplicaciones.

**OAuth 2.0**: Protocolo estándar de autorización para aplicaciones web.

**PKCE**: Extensión de seguridad de OAuth 2.0 que protege el flujo de autenticación.

**ID Token**: Token que contiene información verificada del usuario autenticado.

**Sesión**: Período de tiempo en el que estás autenticado en la plataforma.

**Dashboard**: Página principal personalizada según tu rol.

**Rol**: Tipo de usuario que determina tus permisos y accesos.

**Provider**: Servicio de autenticación (Google, Microsoft, Meta).

---

## Soporte

Para asistencia adicional:
- 📧 Email: soporte@glamur-ssc.com
- 📞 Teléfono: [número de soporte]
- 💬 Chat: Disponible en la plataforma (próximamente)

**Horario de atención:**
- Lunes a Viernes: 9:00 AM - 6:00 PM
- Sábados: 9:00 AM - 2:00 PM
- Domingos: Cerrado

---

_Última actualización: Noviembre 2024_
_Versión: 1.0_

