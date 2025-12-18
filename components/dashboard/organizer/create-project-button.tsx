import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CreateProjectButtonProps {
  className?: string
}

/**
 * Botón para crear nuevo proyecto
 * 
 * La única acción primaria disponible en el dashboard (RN-08).
 * Navega al flujo de creación de proyecto.
 */
export function CreateProjectButton({ className }: CreateProjectButtonProps) {
  return (
    <Button asChild className={className}>
      <Link href="/project/new">
        <Plus className="mr-2 h-4 w-4" />
        Crear nuevo proyecto
      </Link>
    </Button>
  )
}

