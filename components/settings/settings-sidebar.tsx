"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getVisibleSettingsMenuItems } from "@/lib/settings-menu-config"

/**
 * Sidebar de navegación para Settings
 * 
 * Client Component que:
 * - Renderiza solo los items con visible: true
 * - Marca el item activo según la ruta actual
 */
export function SettingsSidebar() {
  const pathname = usePathname()
  const menuItems = getVisibleSettingsMenuItems()

  return (
    <nav className="space-y-1">
      {menuItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon

        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <div className="flex flex-col">
              <span>{item.label}</span>
              {item.description && (
                <span
                  className={cn(
                    "text-xs mt-0.5",
                    isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {item.description}
                </span>
              )}
            </div>
          </Link>
        )
      })}
    </nav>
  )
}

