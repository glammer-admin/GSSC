import { Badge } from "@/components/ui/badge"
import { Copy, Check } from "lucide-react"
import { PROJECT_STATUS_CONFIG, type ProjectStatus } from "@/lib/types/project/types"

interface ProjectHeaderProps {
  name: string
  status: ProjectStatus
  publicCode: string
}

/**
 * Header del proyecto mostrando nombre, estado y código público
 * 
 * Server Component que:
 * - Muestra el nombre del proyecto
 * - Muestra el estado con badge de color
 * - Muestra el código público (solo lectura)
 */
export function ProjectHeader({ name, status, publicCode }: ProjectHeaderProps) {
  const statusConfig = PROJECT_STATUS_CONFIG[status]

  return (
    <div className="mb-8">
      {/* Título con badge de estado */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {name}
        </h1>
        <Badge
          variant={
            status === "active"
              ? "default"
              : status === "draft"
              ? "secondary"
              : status === "paused"
              ? "outline"
              : "destructive"
          }
          className="shrink-0"
        >
          {statusConfig.label}
        </Badge>
      </div>

      {/* Código público */}
      <div className="mt-2 flex items-center gap-2 text-muted-foreground">
        <span className="text-sm">Código del proyecto:</span>
        <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">
          {publicCode}
        </code>
      </div>
    </div>
  )
}
