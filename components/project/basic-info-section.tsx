"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { LogoUpload } from "./logo-upload"
import { Lock, Hash } from "lucide-react"
import {
  PROJECT_TYPES,
  MAX_PROJECT_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
} from "@/lib/types/project/types"
import type { ProjectType } from "@/lib/types/project/types"

interface BasicInfoSectionProps {
  name: string
  projectType: ProjectType | undefined
  description: string
  logoUrl: string | undefined
  logoFile: File | undefined
  publicCode?: string // Solo en modo edición
  isEditMode: boolean
  disabled?: boolean
  errors?: {
    name?: string
    projectType?: string
    description?: string
    logo?: string
  }
  onNameChange: (value: string) => void
  onProjectTypeChange: (value: ProjectType) => void
  onDescriptionChange: (value: string) => void
  onLogoChange: (file: File | undefined, previewUrl: string | undefined) => void
}

/**
 * Sección de información básica del proyecto
 * 
 * Incluye:
 * - Logo del proyecto
 * - Código público (solo lectura en edición)
 * - Nombre del proyecto (no editable después de creación)
 * - Tipo de proyecto
 * - Descripción corta
 */
export function BasicInfoSection({
  name,
  projectType,
  description,
  logoUrl,
  logoFile,
  publicCode,
  isEditMode,
  disabled,
  errors,
  onNameChange,
  onProjectTypeChange,
  onDescriptionChange,
  onLogoChange,
}: BasicInfoSectionProps) {
  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="space-y-2">
        <Label>Logo del proyecto</Label>
        <LogoUpload
          currentUrl={logoUrl}
          selectedFile={logoFile}
          onChange={onLogoChange}
          disabled={disabled}
          error={errors?.logo}
        />
        <p className="text-xs text-muted-foreground">
          Si no se carga logo, se asignará un avatar por defecto
        </p>
      </div>
      
      {/* Código público (solo en edición) */}
      {isEditMode && publicCode && (
        <div className="space-y-2">
          <Label htmlFor="publicCode">Código público</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Input
                    id="publicCode"
                    value={publicCode}
                    disabled
                    className="pr-10 bg-muted font-mono"
                  />
                  <Hash className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Código público generado automáticamente</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <p className="text-xs text-muted-foreground">
            Este código identifica tu proyecto públicamente
          </p>
        </div>
      )}
      
      {/* Nombre */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Nombre del proyecto <span className="text-destructive">*</span>
        </Label>
        {isEditMode ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Input
                    id="name"
                    value={name}
                    disabled
                    className="pr-10 bg-muted"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>El nombre no puede modificarse después de la creación</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <>
            <Input
              id="name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Ej: Uniformes Colegio San José"
              maxLength={MAX_PROJECT_NAME_LENGTH}
              disabled={disabled}
              className={errors?.name ? "border-destructive" : ""}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Solo letras, números y espacios</span>
              <span>{name.length}/{MAX_PROJECT_NAME_LENGTH}</span>
            </div>
          </>
        )}
        {errors?.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>
      
      {/* Tipo de proyecto */}
      <div className="space-y-2">
        <Label htmlFor="projectType">
          Tipo de proyecto <span className="text-destructive">*</span>
        </Label>
        <Select
          value={projectType}
          onValueChange={(value) => onProjectTypeChange(value as ProjectType)}
          disabled={disabled}
        >
          <SelectTrigger
            id="projectType"
            className={errors?.projectType ? "border-destructive" : ""}
          >
            <SelectValue placeholder="Selecciona un tipo" />
          </SelectTrigger>
          <SelectContent>
            {PROJECT_TYPES.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors?.projectType && (
          <p className="text-sm text-destructive">{errors.projectType}</p>
        )}
      </div>
      
      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="description">Descripción corta</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe brevemente tu proyecto..."
          maxLength={MAX_DESCRIPTION_LENGTH}
          disabled={disabled}
          rows={3}
          className={errors?.description ? "border-destructive" : ""}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Texto informativo para la tienda pública</span>
          <span>{description.length}/{MAX_DESCRIPTION_LENGTH}</span>
        </div>
        {errors?.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
      </div>
    </div>
  )
}
