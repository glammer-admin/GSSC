import { SearchX } from 'lucide-react'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { CreateProjectButton } from './create-project-button'

interface SearchEmptyStateProps {
  onClear: () => void
}

/**
 * Estado vacío cuando la búsqueda no encuentra resultados
 * 
 * Muestra un mensaje indicativo y sugiere:
 * - Modificar la búsqueda
 * - Crear un nuevo proyecto
 * 
 * Caso de uso: BUSQUEDA_SIN_RESULTADOS
 */
export function SearchEmptyState({ onClear }: SearchEmptyStateProps) {
  return (
    <Empty className="border rounded-lg py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>Sin resultados</EmptyTitle>
        <EmptyDescription>
          No encontramos proyectos que coincidan con tu búsqueda.
          Intenta con otros términos o crea un nuevo proyecto.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClear}>
            Limpiar búsqueda
          </Button>
          <CreateProjectButton />
        </div>
      </EmptyContent>
    </Empty>
  )
}

