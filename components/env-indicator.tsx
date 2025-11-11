"use client"

import { useEffect, useState } from "react"

export function EnvIndicator() {
  const [env, setEnv] = useState<string>("")

  useEffect(() => {
    // Obtener ambiente del cliente
    const appEnv = process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || "development"
    setEnv(appEnv === "production" ? "production" : appEnv === "staging" ? "staging" : "development")
  }, [])

  if (!env || env === "production") return null

  const colors = {
    development: "bg-blue-600",
    staging: "bg-yellow-600",
  }

  const labels = {
    development: "🎭 DESARROLLO",
    staging: "🚧 STAGING",
  }

  return (
    <div 
      className={`fixed top-0 right-0 z-50 ${colors[env as keyof typeof colors]} text-white px-4 py-2 text-xs font-bold rounded-bl-lg shadow-lg`}
      title={`Ambiente: ${env}`}
    >
      {labels[env as keyof typeof labels]}
    </div>
  )
}

