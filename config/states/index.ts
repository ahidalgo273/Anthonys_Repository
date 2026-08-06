/**
 * The state registry.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NON-DEVELOPER NOTE
 * To add a fourth state: create a file next to this one (say `tx.ts`) modeled
 * on `ga.ts`, add its code to `StateCode` in `types.ts`, and add it to the
 * `stateList` below. The guide page, intake screening, document checklist,
 * packet, and renewal reminders all pick it up automatically.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { georgia } from "./ga";
import { florida } from "./fl";
import { northCarolina } from "./nc";
import type { StateCode, StateRules } from "./types";

export * from "./types";

/** Display order used everywhere on the site. */
export const stateList: StateRules[] = [georgia, florida, northCarolina];

export const statesByCode: Record<StateCode, StateRules> = {
  GA: georgia,
  FL: florida,
  NC: northCarolina,
};

export const stateCodes = stateList.map((s) => s.code);

/** Returns undefined for an unknown code rather than throwing — callers decide. */
export function getState(code: string): StateRules | undefined {
  return statesByCode[code.toUpperCase() as StateCode];
}

/** Look up by URL segment, e.g. "georgia". */
export function getStateBySlug(slug: string): StateRules | undefined {
  return stateList.find((s) => s.slug === slug);
}

/** Type guard for validating user input before it reaches the database. */
export function isStateCode(value: unknown): value is StateCode {
  return typeof value === "string" && value.toUpperCase() in statesByCode;
}

export { georgia, florida, northCarolina };
