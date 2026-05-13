/**
 * Containment-check mot en yttre rektangel (typiskt tomtgränsen).
 *
 * Implementation: testar inner-rectens fyra hörn mot outer-rectens lokala
 * frame. Returnerar "inside" om alla fyra hörnen ligger innanför, "outside"
 * om inget hörn ligger inom, annars "partial".
 *
 * Anmärkning: Heuristiken är exakt för det avsedda fallet "litet objekt i
 * stor tomt". Den missar två edge cases:
 *   1) Inner är *större* än outer och täcker den helt (alla 4 utanför, men
 *      objektet skär outer:s kant).
 *   2) Smala objekt som korsar outer-kanten med alla 4 hörn utanför.
 * För dessa fall skulle SAT-baserad polygon-test behövas; det är out of scope
 * för v1 av tomt-varningen och nämns i ADR-009.
 */

import type { Rect } from "./types.js";
import { rectCorners } from "./rotation.js";
import { worldToLocal } from "./coordinates.js";

export type Containment = "inside" | "partial" | "outside";

const CONTAINMENT_EPSILON_MM = 1e-3;

export function rectContainedIn(inner: Rect, outer: Rect): Containment {
  const halfW = outer.width / 2 + CONTAINMENT_EPSILON_MM;
  const halfH = outer.height / 2 + CONTAINMENT_EPSILON_MM;
  const corners = rectCorners(inner);
  let inCount = 0;
  for (const c of corners) {
    const local = worldToLocal(c, outer);
    if (Math.abs(local.x) <= halfW && Math.abs(local.y) <= halfH) inCount++;
  }
  if (inCount === 4) return "inside";
  if (inCount === 0) return "outside";
  return "partial";
}
