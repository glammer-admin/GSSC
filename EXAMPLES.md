# Ejemplos de Uso - Sistema de Menús por Roles

## 📖 Ejemplos Prácticos

### 1. Cómo agregar un nuevo menú a un rol existente

**Escenario**: Agregar "Reportes" al rol de Proveedor

```typescript
// lib/menu-config.ts

import { BarChart3 } from "lucide-react" // Importar el icono

export const menuConfig: MenuConfig = {
  Proveedor: [
    // ... menús existentes
    {
      id: "reportes",
      icon: BarChart3,
      label: "Reportes",
      href: "/customer-dash/reports",
      roles: ["Proveedor"],
    },
  ],
  // ... otros roles
}
```

Luego crea la página:
```bash
# Crear la página
touch app/customer-dash/reports/page.tsx
```

```typescript
// app/customer-dash/reports/page.tsx
"use client"

import { AuthenticatedLayout } from "@/components/authenticated-layout"

export default function ReportsPage() {
  return (
    <AuthenticatedLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold">Reportes</h1>
        <p className="text-muted-foreground">Contenido de reportes...</p>
      </div>
    </AuthenticatedLayout>
  )
}
```

---

### 2. Cómo crear un nuevo rol completo

**Escenario**: Crear rol "Supervisor" con sus propios menús

```typescript
// lib/menu-config.ts

export const menuConfig: MenuConfig = {
  // ... roles existentes
  Supervisor: [
    {
      id: "dashboard",
      icon: Home,
      label: "Dashboard",
      href: "/supervisor-dash",
      roles: ["Supervisor"],
    },
    {
      id: "equipos",
      icon: Users,
      label: "Equipos",
      href: "/supervisor-dash/teams",
      roles: ["Supervisor"],
    },
    {
      id: "metricas",
      icon: BarChart3,
      label: "Métricas",
      href: "/supervisor-dash/metrics",
      roles: ["Supervisor"],
    },
  ],
}
```

Actualizar el login:
```typescript
// components/login-form.tsx

const providerRoles: Record<string, string> = {
  google: "Organizador",
  microsoft: "Proveedor",
  meta: "Pagador",
  github: "Supervisor", // Nuevo proveedor
}
```

Crear las páginas:
```bash
mkdir -p app/supervisor-dash
touch app/supervisor-dash/page.tsx
```

---

### 3. Cómo agregar un submenu (menú anidado)

**Escenario**: Agregar submenús a "Proyectos"

```typescript
// lib/menu-config.ts

export interface MenuItem {
  id: string
  icon: LucideIcon
  label: string
  href: string
  roles: string[]
  children?: MenuItem[] // Agregar children
}

export const menuConfig: MenuConfig = {
  Organizador: [
    {
      id: "proyectos",
      icon: FileText,
      label: "Proyectos",
      href: "/dashboard/projects",
      roles: ["Organizador"],
      children: [
        {
          id: "proyectos-activos",
          icon: CheckCircle,
          label: "Activos",
          href: "/dashboard/projects/active",
          roles: ["Organizador"],
        },
        {
          id: "proyectos-archivados",
          icon: Archive,
          label: "Archivados",
          href: "/dashboard/projects/archived",
          roles: ["Organizador"],
        },
      ],
    },
  ],
}
```

Actualizar el Navbar para mostrar submenús:
```typescript
// components/navbar.tsx

{navigationItems.map((item) => (
  <li key={item.label}>
    <button onClick={() => router.push(item.href)} /* ... */>
      <item.icon />
      {isExpanded && <span>{item.label}</span>}
    </button>
    
    {/* Submenús */}
    {isExpanded && item.children && (
      <ul className="ml-6 mt-2 space-y-1">
        {item.children.map((child) => (
          <li key={child.id}>
            <button onClick={() => router.push(child.href)} /* ... */>
              <child.icon />
              <span>{child.label}</span>
            </button>
          </li>
        ))}
      </ul>
    )}
  </li>
))}
```

---

### 4. Cómo agregar permisos granulares

**Escenario**: No todos los Proveedores pueden ver Clientes

```typescript
// lib/menu-config.ts

export interface MenuItem {
  id: string
  icon: LucideIcon
  label: string
  href: string
  roles: string[]
  permissions?: string[] // Agregar permisos específicos
}

export const menuConfig: MenuConfig = {
  Proveedor: [
    {
      id: "clientes",
      icon: Users,
      label: "Clientes",
      href: "/customer-dash/clients",
      roles: ["Proveedor"],
      permissions: ["view_clients"], // Requiere permiso específico
    },
  ],
}
```

Actualizar funciones:
```typescript
// lib/menu-config.ts

interface User {
  role: string
  permissions: string[]
}

export function getMenuByRole(user: User): MenuItem[] {
  if (!user.role || !menuConfig[user.role]) return []
  
  const roleMenu = menuConfig[user.role]
  
  // Filtrar por permisos
  return roleMenu.filter(item => {
    if (!item.permissions) return true
    return item.permissions.every(perm => user.permissions.includes(perm))
  })
}
```

---

### 5. Cómo cargar menús desde una API

**Escenario**: Obtener configuración de menús desde un backend

```typescript
// lib/menu-config-api.ts

export async function fetchMenuConfig(userId: string): Promise<MenuConfig> {
  const response = await fetch(`/api/menu-config/${userId}`)
  const data = await response.json()
  return data
}

// Uso en el componente
export function Navbar({ user }: NavbarProps) {
  const [navigationItems, setNavigationItems] = useState<MenuItem[]>([])

  useEffect(() => {
    async function loadMenu() {
      const config = await fetchMenuConfig(user.id)
      const menu = config[user.role] || []
      setNavigationItems(menu)
    }
    loadMenu()
  }, [user])

  // ... resto del componente
}
```

---

### 6. Cómo agregar badges a los menús

**Escenario**: Mostrar notificaciones en los menús

```typescript
// lib/menu-config.ts

export interface MenuItem {
  id: string
  icon: LucideIcon
  label: string
  href: string
  roles: string[]
  badge?: number | string // Agregar badge
}

// components/navbar.tsx

{isExpanded && (
  <div className="flex items-center gap-2">
    <span>{item.label}</span>
    {item.badge && (
      <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
        {item.badge}
      </span>
    )}
  </div>
)}
```

---

### 7. Cómo destacar la ruta activa

```typescript
// components/navbar.tsx

import { usePathname } from "next/navigation"

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()
  
  return (
    <nav>
      {navigationItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        
        return (
          <button
            className={`${
              isActive 
                ? "bg-primary text-primary-foreground" 
                : "text-foreground hover:bg-accent"
            }`}
          >
            {/* ... */}
          </button>
        )
      })}
    </nav>
  )
}
```

---

### 8. Cómo agregar tooltips personalizados

```typescript
// components/navbar.tsx

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

<TooltipProvider>
  {navigationItems.map((item) => (
    <Tooltip key={item.id}>
      <TooltipTrigger asChild>
        <button onClick={() => router.push(item.href)}>
          <item.icon />
          {isExpanded && <span>{item.label}</span>}
        </button>
      </TooltipTrigger>
      {!isExpanded && (
        <TooltipContent side="right">
          <p>{item.label}</p>
        </TooltipContent>
      )}
    </Tooltip>
  ))}
</TooltipProvider>
```

---

### 9. Cómo persistir el estado de la navbar

```typescript
// components/navbar.tsx

export function Navbar({ user }: NavbarProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    // Cargar desde localStorage
    const saved = localStorage.getItem("navbar-expanded")
    return saved ? JSON.parse(saved) : true
  })

  const toggleExpanded = () => {
    setIsExpanded(prev => {
      const newValue = !prev
      // Guardar en localStorage
      localStorage.setItem("navbar-expanded", JSON.stringify(newValue))
      return newValue
    })
  }

  // ... resto del componente
}
```

---

### 10. Cómo hacer la navbar responsive (móvil)

```typescript
// components/navbar.tsx

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Navbar({ user }: NavbarProps) {
  // Versión desktop (existente)
  const DesktopNavbar = () => (
    <aside className="hidden md:flex {/* ... */}">
      {/* Contenido existente */}
    </aside>
  )

  // Versión móvil
  const MobileNavbar = () => (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b">
      <div className="flex items-center justify-between p-4">
        <span className="font-bold">GSSC</span>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <nav className="space-y-2 mt-8">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => router.push(item.href)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )

  return (
    <>
      <DesktopNavbar />
      <MobileNavbar />
    </>
  )
}
```

---

## 🎓 Consejos y Mejores Prácticas

1. **Siempre valida en el backend**: La seguridad del cliente es fácil de bypasear
2. **Usa TypeScript**: Aprovecha el tipado fuerte para evitar errores
3. **Separa concerns**: Mantén la lógica de menús separada de la UI
4. **Testing**: Prueba cada rol y sus permisos
5. **Documentación**: Mantén actualizada la documentación de roles
6. **Consistencia**: Usa los mismos patrones en toda la app
7. **Accesibilidad**: Agrega aria-labels y keyboard navigation
8. **Performance**: Memoriza menús si vienen de API
9. **Error handling**: Maneja casos donde el rol no existe
10. **Logging**: Registra intentos de acceso no autorizado

---

## 🐛 Troubleshooting Común

**Problema**: El menú no aparece
- ✅ Verifica que el rol esté en `menuConfig`
- ✅ Revisa que el usuario tenga el rol correcto
- ✅ Chequea la consola por errores

**Problema**: Redirige en loop
- ✅ Verifica que la ruta por defecto exista
- ✅ Asegúrate de que `hasAccessToRoute` retorne true

**Problema**: Los iconos no se muestran
- ✅ Importa los iconos de `lucide-react`
- ✅ Verifica que el nombre del icono sea correcto

---

**Última actualización**: 2025-11-10

