import Anthropic from "@anthropic-ai/sdk";
import { aiConfig } from "@/config/ai";

/**
 * The Anthropic client.
 *
 * Returns null when ANTHROPIC_API_KEY is not set — a supported configuration,
 * not an error. Every caller must handle null by taking its non-AI path.
 * All calls happen server-side; the key is never sent to the browser.
 */

let cached: Anthropic | null = null;

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function getAnthropic(): Anthropic | null {
  if (!isAiConfigured()) return null;
  if (!cached) {
    cached = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      // A hung request must not hold a web request open indefinitely.
      timeout: 30_000,
      maxRetries: 2,
    });
  }
  return cached;
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

/**
 * One completion. Returns null on any failure so callers fall back rather than
 * showing an error — a client asking about bond amounts should get the FAQ, not
 * a stack trace, when the API is having a bad day.
 */
export async function complete({
  system,
  messages,
  maxTokens = aiConfig.maxTokens,
  model = aiConfig.model,
}: {
  system: string;
  messages: ChatTurn[];
  maxTokens?: number;
  model?: string;
}): Promise<string | null> {
  const client = getAnthropic();
  if (!client) return null;

  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages: messages.map((turn) => ({ role: turn.role, content: turn.content })),
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return text.length > 0 ? text : null;
  } catch (error) {
    console.error("[ai] Completion failed:", error);
    return null;
  }
}

/**
 * A vision completion for image uploads (document photo checks).
 * `mediaType` must be one the API accepts, so callers filter first.
 */
export async function completeWithImage({
  system,
  prompt,
  imageBase64,
  mediaType,
  maxTokens = aiConfig.maxTokens,
}: {
  system: string;
  prompt: string;
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  maxTokens?: number;
}): Promise<string | null> {
  const client = getAnthropic();
  if (!client) return null;

  try {
    const response = await client.messages.create({
      model: aiConfig.model,
      max_tokens: maxTokens,
      system,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    return response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
  } catch (error) {
    console.error("[ai] Vision completion failed:", error);
    return null;
  }
}
