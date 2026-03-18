"use client"

import Link from "next/link"
import { MoreVertical, Pencil, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProductKebabMenuProps {
  projectId: string
  productId: string
}

function getGlamForgeUrl(projectId: string, productId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_GLAMFORGE_URL || "https://glamforge.glam-urban.com"
  return `${baseUrl}?projectId=${projectId}&productId=${productId}`
}

export function ProductKebabMenu({ projectId, productId }: ProductKebabMenuProps) {
  return (
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
          <a
            href={getGlamForgeUrl(projectId, productId)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ImageIcon className="h-4 w-4" />
            Imágenes
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
