import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ErrorCodeDisplay } from "@/components/error-code-display"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center p-8 max-w-md">
        {/* Icono de búsqueda */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-semibold text-slate-800 mb-3">
          Página no encontrada
        </h1>

        {/* Subtítulo */}
        <p className="text-slate-600 mb-6">
          La página que buscas no existe o fue movida.
        </p>

        {/* Código de referencia */}
        <div className="mb-6">
          <ErrorCodeDisplay code="NAV-NTF-001" />
        </div>

        {/* Botón de acción */}
        <Button asChild>
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  )
}

