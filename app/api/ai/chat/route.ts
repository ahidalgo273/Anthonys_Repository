import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { aiConfig } from "@/config/ai";
import { db } from "@/lib/db";
import { askAssistant } from "@/lib/ai/assistant";
import { isAiConfigured } from "@/lib/ai/client";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * The intake assistant endpoint.
 *
 * All AI calls happen here, server-side. The API key never reaches the browser,
 * and the guardrail cannot be bypassed by calling the model directly, because
 * the client has no way to.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const requestSchema = z.object({
  message: z.string().trim().min(1, "Ask me something.").max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      }),
    )
    .max(20)
    .optional(),
});

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  // Tie the conversation to whoever we can identify: a signed-in user, or the
  // in-progress intake lead. Both are optional — a stranger can still ask.
  const [user, store] = await Promise.all([getCurrentUser(), cookies()]);
  const leadId = store.get("dd_lead")?.value ?? null;

  // Rate limit per lead so one conversation cannot run up an API bill.
  if (leadId) {
    const recent = await db.aiInteraction.count({
      where: { leadId, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    if (recent >= aiConfig.rateLimitPerSession) {
      return NextResponse.json(
        {
          message:
            "We have covered a lot of ground — at this point a real conversation will serve you better than I will. Book a call or email us and we will pick it up from here.",
          blocked: false,
          rateLimited: true,
        },
        { status: 429 },
      );
    }
  }

  const reply = await askAssistant({
    message: parsed.data.message,
    history: parsed.data.history ?? [],
    leadId,
    userId: user?.id ?? null,
  });

  return NextResponse.json({
    message: reply.message,
    blocked: reply.blocked,
    referralCreated: reply.referralCreated,
    usedModel: reply.usedModel,
    sources: reply.sources ?? [],
  });
}

/** Lets the UI tell the visitor honestly whether it is an AI or an FAQ search. */
export async function GET() {
  return NextResponse.json({ aiEnabled: isAiConfigured() });
}
