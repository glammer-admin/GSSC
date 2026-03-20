import { Badge } from "@/components/ui/badge"
import { PROJECT_STATUS_CONFIG, type ProjectStatus } from "@/lib/types/project/types"

interface ProjectHeaderProps {
  name: string
  status: ProjectStatus
}

/**
 * Header del proyecto mostrando nombre y estado
 *
 * Server Component que:
 * - Muestra el nombre del proyecto
 * - Muestra el estado con badge de color
 */
export function ProjectHeader({ name, status }: ProjectHeaderProps) {
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
    </div>
  )
}
