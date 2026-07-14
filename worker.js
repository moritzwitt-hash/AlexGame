// Cloudflare Worker Entry-Point (Static Assets + API-Routing).
//
// Hintergrund (siehe PLAN-Changelog): Der ursprüngliche Plan sah klassische
// Cloudflare-Pages-Functions vor (Datei-basiertes Routing unter functions/).
// Beim ersten Deploy stellte sich heraus, dass Git-Integration inzwischen
// über "Workers Builds" läuft, das dieses Datei-Routing NICHT unterstützt
// (`wrangler pages functions build` wäre ein Kompatibilitäts-Shim, aber
// Cloudflare empfiehlt einen expliziten Worker-Entry-Point). Deshalb dieser
// eine fetch()-Handler: routet die zwei API-Endpunkte selbst, alles andere
// geht an das ASSETS-Binding (statische Dateien aus public/, siehe
// wrangler.toml [assets]).

import { handleLevels } from "./lib/levels.js";
import { handleAttempt } from "./lib/attempt.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/levels") {
      return handleLevels();
    }

    if (request.method === "POST" && url.pathname === "/api/attempt") {
      return handleAttempt(request, env);
    }

    // Alles andere: statische Datei aus public/ ausliefern.
    return env.ASSETS.fetch(request);
  },
};
