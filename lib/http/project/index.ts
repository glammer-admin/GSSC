/**
 * Exports del módulo de cliente HTTP para proyectos
 */

// Cliente de proyectos
export { getProjectClient, HttpError, NetworkError } from "./project-client"

// Cliente de Storage para logos
export { getProjectStorageClient, type LogoUploadResult } from "./project-storage-client"

// Tipos
export type {
  BackendProject,
  CreateProjectDTO,
  UpdateProjectDTO,
  BackendArrayResponse,
  BackendCreateResponse,
  BackendUpdateResponse,
} from "./types"
