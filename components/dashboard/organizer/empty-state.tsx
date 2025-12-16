import { FolderPlus } from 'lucide-react'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'
import { CreateProjectButton } from './create-project-button'

/**
 * Estado vacío cuando el organizador no tiene proyectos
 * 
 * Muestra un mensaje indicativo y la opción de crear un nuevo proyecto.
 * Este estado se muestra cuando el organizador accede al dashboard
 * sin tener proyectos asociados (caso límite SIN_PROYECTOS).
 */
export function EmptyState() {
  return (
    <Empty className="border rounded-lg py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderPlus />
        </EmptyMedia>
        <EmptyTitle>No tienes proyectos aún</EmptyTitle>
        <EmptyDescription>
          Crea tu primer proyecto para comenzar a gestionar pedidos,
          productos y generar comisiones.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <CreateProjectButton />
      </EmptyContent>
    </Empty>
  )
}

