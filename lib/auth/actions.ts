"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requestMagicLink } from "./magic-link";
import { destroySession } from "./session";

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .max(254)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address."),
  next: z.string().optional(),
});

export type SignInState = { sent: boolean; error?: string; email?: string };

export async function requestSignInLink(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return { sent: false, error: parsed.error.issues[0]?.message ?? "Please check your email address." };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    null;

  const result = await requestMagicLink({
    email: parsed.data.email,
    next: parsed.data.next,
    ip,
  });

  if (!result.ok) return { sent: false, error: result.error };

  return { sent: true, email: parsed.data.email };
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/");
}
