"use client"

import { useState } from "react"

interface ErrorCodeDisplayProps {
  code: string
}

export function ErrorCodeDisplay({ code }: ErrorCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback: el usuario puede seleccionar y copiar manualmente
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="text-xs text-slate-400 font-mono bg-slate-100 px-3 py-1.5 rounded-md hover:bg-slate-200 transition-colors cursor-pointer border-0"
        title="Click para copiar el código"
        type="button"
      >
        Código: {code}
      </button>
      {copied && (
        <span className="text-xs text-green-600 animate-in fade-in duration-200">
          ¡Copiado!
        </span>
      )}
    </div>
  )
}

