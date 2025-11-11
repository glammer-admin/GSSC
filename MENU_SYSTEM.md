# Sistema de Menús Basado en Roles

## Descripción General

El sistema de navegación de la plataforma GSSC está controlado por roles de usuario. Cada rol tiene acceso a diferentes secciones y menús específicos.

## Roles Disponibles

### 1. **Proveedor** (Login con Microsoft)
- **Dashboard**: `/customer-dash`
- **Proyectos**: `/customer-dash/projects`
- **Clientes**: `/customer-dash/clients`
- **Calendario**: `/customer-dash/calendar`

### 2. **Organizador** (Login con Google)
- **Dashboard**: `/dashboard`
- **Proyectos**: `/dashboard/projects`
- **Pagos**: `/dashboard/payments`
- **Configuración**: `/dashboard/settings`

### 3. **Pagador** (Login con Meta)
- **Historial**: `/product/1234asdf`

## Archivos de Configuración

### 1. `lib/menu-config.ts`
Este archivo TypeScript contiene la configuración programática de los menús:

```typescript
import { getMenuByRole, hasAccessToRoute, getDefaultRouteByRole } from '@/lib/menu-config'

// Obtener menú por rol
const menu = getMenuByRole('Organizador')

// Verificar acceso a ruta
const hasAccess = hasAccessToRoute('Proveedor', '/customer-dash/projects')

// Obtener ruta por defecto
const defaultRoute = getDefaultRouteByRole('Pagador')
```

### 2. `config/menu-roles.json`
Archivo JSON de ejemplo que muestra cómo se podría cargar la configuración desde un archivo externo o API.

## Componentes

### 1. **Navbar** (`components/navbar.tsx`)
- Barra de navegación lateral colapsable
- Se adapta automáticamente según el rol del usuario
- Muestra solo los menús permitidos para cada rol
- Incluye avatar del usuario y botón de logout

### 2. **AuthenticatedLayout** (`components/authenticated-layout.tsx`)
- Layout wrapper para páginas autenticadas
- Verifica que el usuario esté logueado
- Incluye la Navbar y protección de rutas

### 3. **RouteGuard** (`components/route-guard.tsx`)
- Protege las rutas basándose en el rol del usuario
- Redirige automáticamente si el usuario intenta acceder a una ruta no autorizada
- Redirige a la ruta por defecto del rol si no tiene acceso

## Flujo de Autenticación y Navegación

1. **Login**: Usuario selecciona proveedor (Google/Microsoft/Meta)
2. **Asignación de Rol**: Se asigna rol según el proveedor:
   - Google → Organizador
   - Microsoft → Proveedor
   - Meta → Pagador
3. **Redirección**: Se redirige a la ruta por defecto del rol
4. **Navegación**: El menú muestra solo las opciones permitidas para ese rol
5. **Protección**: Si intenta acceder a una ruta no permitida, se redirige automáticamente

## Cómo Agregar un Nuevo Menú

1. Edita `lib/menu-config.ts`
2. Agrega el nuevo item al array del rol correspondiente:

```typescript
{
  id: "nuevo-menu",
  icon: NuevoIcon,
  label: "Nuevo Menú",
  href: "/ruta/nuevo-menu",
  roles: ["NombreDelRol"],
}
```

3. Crea la página correspondiente en la carpeta `app/`

## Cómo Agregar un Nuevo Rol

1. Agrega la configuración en `lib/menu-config.ts`:

```typescript
NuevoRol: [
  {
    id: "menu1",
    icon: Home,
    label: "Menú 1",
    href: "/nuevo-rol/menu1",
    roles: ["NuevoRol"],
  },
  // ... más menús
],
```

2. Actualiza el login en `components/login-form.tsx` para asignar el nuevo rol
3. Crea las páginas correspondientes

## Características de la Navbar

- ✅ **Colapsable**: Botón para expandir/contraer
- ✅ **Iconos**: Muestra iconos en modo reducido
- ✅ **Avatar**: Muestra avatar y nombre del usuario
- ✅ **Logout**: Botón de cerrar sesión
- ✅ **Desktop Only**: Solo visible en versión desktop (hidden en móvil)
- ✅ **Sticky**: Permanece fija en el lateral

## Estado del Menú

El estado de expansión/contracción se mantiene en el estado local del componente. Puedes modificarlo para:
- Guardar en localStorage
- Usar un state manager global (Zustand, Redux, etc.)
- Sincronizar entre pestañas

## Seguridad

- ✅ Las rutas están protegidas del lado del cliente
- ⚠️ **IMPORTANTE**: Implementar validación del lado del servidor para seguridad real
- ⚠️ No confiar solo en la protección del cliente para datos sensibles

