import {
  BarChart3,
  Package,
  Settings,
  Bell,
  type LucideIcon,
} from "lucide-react"

export interface ProjectMenuItem {
  id: string
  icon: LucideIcon
  label: string
  /** Ruta relativa al proyecto (se construye como /project/{publicCode}{href}) */
  href: string
  visible: boolean
  description?: string
}

/**
 * Configuración del submenú del proyecto
 * 
 * La propiedad `visible` controla si el item se muestra en el menú.
 * Items con visible: false están planificados pero no implementados aún.
 * 
 * Las rutas coinciden con la estructura existente en app/project/[id]/
 */
export const projectMenuConfig: ProjectMenuItem[] = [
  {
    id: "statistics",
    icon: BarChart3,
    label: "Estadísticas",
    href: "",
    visible: true,
    description: "Métricas y estadísticas del proyecto",
  },
  {
    id: "products",
    icon: Package,
    label: "Productos",
    href: "/products",
    visible: true,
    description: "Gestiona los productos del proyecto",
  },
  {
    id: "notifications",
    icon: Bell,
    label: "Notificaciones",
    href: "/notifications",
    visible: true,
    description: "Centro de notificaciones",
  },
  {
    id: "settings",
    icon: Settings,
    label: "Configuración",
    href: "/edit",
    visible: true,
    description: "Ajusta la configuración del proyecto",
  },
]

/**
 * Obtiene los items visibles del menú del proyecto
 */
export function getVisibleProjectMenuItems(): ProjectMenuItem[] {
  return projectMenuConfig.filter((item) => item.visible)
}
