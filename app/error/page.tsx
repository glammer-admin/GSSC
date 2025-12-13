import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ErrorCodeDisplay } from "@/components/error-code-display"
import { getErrorByCode } from "@/lib/errors/error-codes"

interface ErrorPageProps {
  searchParams: Promise<{ code?: string }>
}

export default async function ErrorPage({ searchParams }: ErrorPageProps) {
  const params = await searchParams
  const errorCode = params.code || "ERR-GEN-000"
  const errorInfo = getErrorByCode(errorCode)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center p-8 max-w-md">
        {/* Icono */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-50 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-semibold text-slate-800 mb-3">
          {errorInfo.userMessage}
        </h1>

        {/* Subtítulo */}
        <p className="text-slate-600 mb-6">
          Ha ocurrido un problema. Por favor, intenta nuevamente.
        </p>

        {/* Código de referencia */}
        <div className="mb-6">
          <ErrorCodeDisplay code={errorCode} />
        </div>

        {/* Botón de acción */}
        <Button asChild>
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  )
}

