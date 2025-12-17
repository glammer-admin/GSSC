import {
  Receipt,
  User,
  Shield,
  Bell,
  type LucideIcon,
} from "lucide-react"

export interface SettingsMenuItem {
  id: string
  icon: LucideIcon
  label: string
  href: string
  visible: boolean
  description?: string
}

/**
 * Configuración del submenú de Settings
 * 
 * La propiedad `visible` controla si el item se muestra en el menú.
 * Items con visible: false están planificados pero no implementados aún.
 */
export const settingsMenuConfig: SettingsMenuItem[] = [
  {
    id: "profile",
    icon: User,
    label: "Perfil",
    href: "/settings/profile",
    visible: false,
    description: "Información personal y preferencias",
  },
  {
    id: "billing",
    icon: Receipt,
    label: "Facturación y Pagos",
    href: "/settings/billing",
    visible: true,
    description: "Configuración fiscal y bancaria",
  },
  {
    id: "security",
    icon: Shield,
    label: "Seguridad",
    href: "/settings/security",
    visible: false,
    description: "Contraseña y autenticación",
  },
  {
    id: "notifications",
    icon: Bell,
    label: "Notificaciones",
    href: "/settings/notifications",
    visible: false,
    description: "Preferencias de notificaciones",
  },
]

/**
 * Obtiene los items visibles del menú de settings
 */
export function getVisibleSettingsMenuItems(): SettingsMenuItem[] {
  return settingsMenuConfig.filter((item) => item.visible)
}

/**
 * Obtiene todos los items del menú de settings (incluidos los no visibles)
 */
export function getAllSettingsMenuItems(): SettingsMenuItem[] {
  return settingsMenuConfig
}

