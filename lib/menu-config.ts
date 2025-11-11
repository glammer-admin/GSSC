import {
  Home,
  FileText,
  Users,
  Settings,
  Calendar,
  DollarSign,
  History,
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

// Configuración de menús por rol
export const menuConfig: MenuConfig = {
  Proveedor: [
    {
      id: "dashboard",
      icon: Home,
      label: "Dashboard",
      href: "/customer-dash",
      roles: ["Proveedor"],
    },
    {
      id: "proyectos",
      icon: FileText,
      label: "Proyectos",
      href: "/customer-dash/projects",
      roles: ["Proveedor"],
    },
    {
      id: "clientes",
      icon: Users,
      label: "Clientes",
      href: "/customer-dash/clients",
      roles: ["Proveedor"],
    },
    {
      id: "calendario",
      icon: Calendar,
      label: "Calendario",
      href: "/customer-dash/calendar",
      roles: ["Proveedor"],
    },
  ],
  Organizador: [
    {
      id: "dashboard",
      icon: Home,
      label: "Dashboard",
      href: "/dashboard",
      roles: ["Organizador"],
    },
    {
      id: "proyectos",
      icon: FileText,
      label: "Proyectos",
      href: "/dashboard/projects",
      roles: ["Organizador"],
    },
    {
      id: "pagos",
      icon: DollarSign,
      label: "Pagos",
      href: "/dashboard/payments",
      roles: ["Organizador"],
    },
    {
      id: "configuracion",
      icon: Settings,
      label: "Configuración",
      href: "/dashboard/settings",
      roles: ["Organizador"],
    },
  ],
  Pagador: [
    {
      id: "historial",
      icon: History,
      label: "Historial",
      href: "/product/1234asdf",
      roles: ["Pagador"],
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

