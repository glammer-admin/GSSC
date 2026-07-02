import {
  Home,
  DollarSign,
  Settings,
  type LucideIcon,
} from "lucide-react"

export interface MenuItem {
  id: string
  icon: LucideIcon
  label: string
  href: string
  roles: string[]
}

export interface MenuConfig {
  [key: string]: MenuItem[]
}

// Configuración de menús por rol. GSSC es exclusiva de organizadores.
export const menuConfig: MenuConfig = {
  organizer: [
    {
      id: "dashboard",
      icon: Home,
      label: "Dashboard",
      href: "/dashboard",
      roles: ["organizer"],
    },
    {
      id: "pagos",
      icon: DollarSign,
      label: "Pagos",
      href: "/dashboard/payments",
      roles: ["organizer"],
    },
    {
      id: "configuracion",
      icon: Settings,
      label: "Configuración",
      href: "/settings/billing",
      roles: ["organizer"],
    },
  ],
}

// Función para obtener el menú según el rol del usuario
export function getMenuByRole(role?: string): MenuItem[] {
  if (!role || !menuConfig[role]) {
    return []
  }
  return menuConfig[role]
}

// Función para verificar si un usuario tiene acceso a una ruta
export function hasAccessToRoute(userRole?: string, route?: string): boolean {
  if (!userRole || !route) return false

  const userMenu = getMenuByRole(userRole)
  return userMenu.some((item) => route.startsWith(item.href))
}

// Función para obtener la ruta por defecto según el rol
export function getDefaultRouteByRole(role?: string): string {
  const menu = getMenuByRole(role)
  if (menu.length > 0) {
    return menu[0].href
  }
  return "/"
}
