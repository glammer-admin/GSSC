// open-next.config.ts
// Adaptador de OpenNext para correr Next.js (SSR + BFF) en Cloudflare Workers.
// Docs: https://opennext.js.org/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Opcional: caché incremental con KV/R2 para ISR.
  // incrementalCache: r2IncrementalCache,
});
