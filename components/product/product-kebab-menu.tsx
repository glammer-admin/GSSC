"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreVertical, Pencil, ImageIcon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { ProductStatus } from "@/lib/types/product/types"

interface ProductKebabMenuProps {
  projectId: string
  productId: string
  glamProductId: string
  status: ProductStatus
}

function getGlamForgeUrl(projectId: string, glamProductId: string, projectProductId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_GLAMFORGE_URL || "https://glamforge.glam-urban.com"
  return `${baseUrl}?projectId=${projectId}&productId=${glamProductId}&project_product_id=${projectProductId}`
}

export function ProductKebabMenu({ projectId, productId, glamProductId, status }: ProductKebabMenuProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/product/${productId}`, { method: "DELETE" })
      if (!response.ok) {
        const data = await response.json()
        console.error("Error al eliminar producto:", data.error)
        return
      }
      router.refresh()
    } catch (error) {
      console.error("Error al eliminar producto:", error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
            aria-label="Acciones del producto"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/project/${projectId}/products/${productId}/edit`}>
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={getGlamForgeUrl(projectId, glamProductId, productId)}>
              <ImageIcon className="h-4 w-4" />
              Imágenes
            </a>
          </DropdownMenuItem>
          {status === "draft" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán el producto y todas sus imágenes permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
