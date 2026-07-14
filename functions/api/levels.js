// GET /api/levels -- liefert NUR die public-Felder aller Level (PLAN Abschnitt 3).
// server-Felder (Alex-Persona-Zusatz, Judge-Rubrik) werden hier NIE ausgeliefert.

import { LEVELS } from "../_lib/levels.config.js";

export async function onRequestGet() {
  const publicLevels = LEVELS.map((level) => ({
    id: level.id,
    order: level.order,
    careLetter: level.careLetter,
    ...level.public,
  }));

  return new Response(JSON.stringify(publicLevels), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
