"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getVisibleProjectMenuItems } from "@/lib/project-menu-config"

interface ProjectSidebarProps {
  projectId: string
}

/**
 * Sidebar de navegación para el Home del Proyecto
 * 
 * Client Component que:
 * - Renderiza solo los items con visible: true
 * - Marca el item activo según la ruta actual
 * - Construye las URLs con el projectId
 */
export function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  const pathname = usePathname()
  const menuItems = getVisibleProjectMenuItems()

  return (
    <nav className="space-y-1">
      {menuItems.map((item) => {
        const href = `/project/${projectId}${item.href}`
        // Para estadísticas (href=""), la ruta exacta es /project/{projectId} (con o sin barra final)
        const basePath = `/project/${projectId}`
        const isActive = item.href === "" 
          ? pathname === basePath || pathname === `${basePath}/`
          : pathname.startsWith(href)
        const Icon = item.icon

        return (
          <Link
            key={item.id}
            href={href}
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
