import { z } from "zod";
import { packages } from "@/config/pricing";
import { stateCodes } from "@/config/states";

/**
 * Validation for every intake step.
 *
 * Each step validates on the server as well as in the browser, because browser
 * validation is a convenience and server validation is the actual rule.
 */

export const STEPS = ["contact", "state", "goal", "timeline", "screening", "package"] as const;
export type Step = (typeof STEPS)[number];

export const STEP_LABELS: Record<Step, string> = {
  contact: "Your details",
  state: "Your state",
  goal: "Your goal",
  timeline: "Your timeline",
  screening: "Eligibility",
  package: "Choose a package",
};

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(200),
  email: z
    .string()
    .trim()
    .min(3)
    .max(254)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address."),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  source: z.string().trim().max(100).optional().or(z.literal("")),
});

export const stateSchema = z.object({
  stateCode: z.enum(stateCodes as [string, ...string[]], {
    message: "Please choose Georgia, Florida, or North Carolina.",
  }),
});

export const GOALS = [
  {
    value: "auction_access",
    label: "Dealer auction access",
    description: "I want to buy at dealer-only auctions.",
  },
  {
    value: "retail",
    label: "Retail sales to the public",
    description: "I want to sell cars directly to retail customers.",
  },
  {
    value: "wholesale",
    label: "Dealer-to-dealer sales",
    description: "I want to buy and sell with other licensed dealers.",
  },
  {
    value: "suite_only",
    label: "I need an office that qualifies",
    description: "My main problem is the location requirement.",
  },
] as const;

export const goalSchema = z.object({
  goal: z.enum(GOALS.map((g) => g.value) as [string, ...string[]], {
    message: "Please choose what you want the license for.",
  }),
  needsSuite: z.enum(["yes", "no", "unsure"]).optional(),
});

export const TIMELINES = [
  { value: "asap", label: "As soon as possible" },
  { value: "1_3_months", label: "In the next 1–3 months" },
  { value: "3_6_months", label: "In 3–6 months" },
  { value: "researching", label: "Just researching for now" },
] as const;

export const timelineSchema = z.object({
  timeline: z.enum(TIMELINES.map((t) => t.value) as [string, ...string[]], {
    message: "Please choose a timeline.",
  }),
});

/**
 * Screening answers are validated loosely on purpose: the questions are
 * declared in config/states/*.ts and change when a state changes, so this
 * schema checks the shape and the screening engine handles the meaning.
 */
export const screeningSchema = z.object({
  answers: z.record(z.string(), z.union([z.string().max(4000), z.boolean()])),
});

export const packageSchema = z.object({
  packageId: z.enum(packages.map((p) => p.id) as [string, ...string[]], {
    message: "Please choose a package.",
  }),
  addOnIds: z.array(z.string()).optional(),
  // LEGAL GUARDRAIL: checkout cannot proceed without this acknowledgment.
  acknowledged: z.literal(true, {
    message: "Please confirm you understand we are not a law firm before continuing.",
  }),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type PackageInput = z.infer<typeof packageSchema>;
