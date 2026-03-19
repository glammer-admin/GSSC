import { initGsscAuthn } from "@glam-urban/gssc-authn"

export function register() {
  initGsscAuthn({
    sessionSecret: process.env.SESSION_SECRET || "",
    devFallbackSecret: process.env.NODE_ENV === "development",
  })
}
