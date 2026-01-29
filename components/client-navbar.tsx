"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  ChevronLeft, 
  ChevronRight,
  LogOut
} from "lucide-react"
import { getMenuByRole } from "@/lib/menu-config"

interface User {
  name: string
  email: string
  avatar?: string
  role?: string
  provider?: string
}

interface ClientNavbarProps {
  user: User
}

export function ClientNavbar({ user }: ClientNavbarProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const pathname = usePathname()

  const handleLogout = async () => {
    try {
      // 1. Limpiar cliente
      localStorage.clear()
      sessionStorage.clear()
      
      // 2. Llamar al servidor
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      
      // 3. Redirigir inmediatamente
      window.location.replace("/")
    } catch (error) {
      console.error("Logout error:", error)
      localStorage.clear()
      sessionStorage.clear()
      window.location.replace("/")
    }
  }

  // Obtener menú según el rol del usuario
  const navigationItems = getMenuByRole(user?.role)

  const getUserInitials = (name?: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
    {/* Spacer para reservar espacio del sidebar fijo */}
    <div className={`${isExpanded ? "w-64" : "w-20"} shrink-0 transition-all duration-300 ease-in-out`} />
    
    {/* Sidebar fijo */}
    <nav
      className={`${
        isExpanded ? "w-64" : "w-20"
      } fixed top-0 left-0 bottom-0 bg-card border-r border-border transition-all duration-300 ease-in-out flex flex-col z-50`}
    >
      {/* Header con toggle */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {isExpanded && (
          <h2 className="text-lg font-semibold text-foreground">GSSC</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-auto"
        >
          {isExpanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Items - crece para empujar footer al bottom */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                size={isExpanded ? "default" : "icon"}
                className={`w-full justify-start ${
                  isActive ? "bg-secondary" : ""
                }`}
                title={!isExpanded ? item.label : undefined}
              >
                <Icon className="h-4 w-4" />
                {isExpanded && <span className="ml-2">{item.label}</span>}
              </Button>
            </Link>
          )
        })}
      </div>

      {/* User Info - pegado al bottom */}
      <div className="p-4 border-t border-border space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback>{getUserInitials(user?.name)}</AvatarFallback>
          </Avatar>
          {isExpanded && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.role}
              </p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <Button
          variant="destructive"
          size={isExpanded ? "default" : "icon"}
          onClick={handleLogout}
          className="w-full"
          title={!isExpanded ? "Cerrar sesión" : undefined}
        >
          <LogOut className="h-4 w-4" />
          {isExpanded && <span className="ml-2">Cerrar sesión</span>}
        </Button>
      </div>
    </nav>
    </>
  )
}

