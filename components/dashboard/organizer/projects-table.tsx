'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type Project,
  type ProjectStatus,
  PROJECT_STATUS_LABELS,
} from '@/lib/types/dashboard/organizer'

interface ProjectsTableProps {
  projects: Project[]
  onProjectClick?: (projectId: string) => void
}

const statusVariants: Record<ProjectStatus, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  paused: 'secondary',
  finished: 'outline',
}

/**
 * Tabla de proyectos del organizador
 * 
 * Muestra el resumen de todos los proyectos con métricas:
 * - Nombre
 * - Estado (activo, pausado, finalizado)
 * - Pedidos
 * - Unidades vendidas
 * - Comisión generada
 * 
 * Permite navegación a detalle de proyecto (RN-09).
 */
export function ProjectsTable({ projects }: ProjectsTableProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis proyectos</CardTitle>
        <CardDescription>
          Resumen de todos tus proyectos activos y finalizados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proyecto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Pedidos</TableHead>
              <TableHead className="text-right">Unidades</TableHead>
              <TableHead className="text-right">Comisión</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id} className="group">
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>
                  <Badge variant={statusVariants[project.status]}>
                    {PROJECT_STATUS_LABELS[project.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {project.metrics.orders.toLocaleString('es-MX')}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {project.metrics.unitsSold.toLocaleString('es-MX')}
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {formatCurrency(project.metrics.commission)}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/project/${project.id}`}
                    className="flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={`Ver detalles de ${project.name}`}
                  >
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

