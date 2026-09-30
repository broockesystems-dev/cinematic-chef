"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Casts or changes the user's vote; RLS enforces subscription and open poll. */
export async function castVote(
  pollId: string,
  optionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };
  if (
    !z.guid().safeParse(pollId).success ||
    !z.guid().safeParse(optionId).success
  ) {
    return { ok: false, error: "invalid" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("votes")
    .insert({ poll_id: pollId, option_id: optionId, user_id: user.id });
  if (error?.code === "23505") {
    const { error: updateError, count } = await supabase
      .from("votes")
      .update({ option_id: optionId }, { count: "exact" })
      .eq("poll_id", pollId)
      .eq("user_id", user.id);
    if (updateError || count === 0) return { ok: false, error: "closed" };
  } else if (error) {
    return {
      ok: false,
      error: error.code === "42501" ? "forbidden" : "failed",
    };
  }
  revalidatePath("/[locale]/vote", "page");
  return { ok: true };
}
