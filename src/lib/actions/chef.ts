"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Deletes the user's conversation about one dish (RLS: own rows only). */
export async function clearChefConversation(
  dishId: string,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user || !z.guid().safeParse(dishId).success) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase
    .from("ai_messages")
    .delete()
    .eq("user_id", user.id)
    .eq("dish_id", dishId);
  return { ok: !error };
}
