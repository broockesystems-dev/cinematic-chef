import "server-only";
import { getAccount } from "@/lib/account";
import { CHEF_DAILY_LIMIT, startOfUtcDay, type ChefMessage } from "@/lib/chef";
import { createClient } from "@/lib/supabase/server";

export type ChefState =
  | { status: "signed_out" }
  | { status: "locked" }
  | { status: "ready"; messages: ChefMessage[]; remaining: number };

/** What the chef panel should show for this visitor and dish. */
export async function getChefState(dishId: string): Promise<ChefState> {
  const account = await getAccount();
  if (!account) return { status: "signed_out" };
  if (!account.subscription && account.role !== "admin")
    return { status: "locked" };

  const supabase = await createClient();
  const [{ data: messages }, { count }] = await Promise.all([
    supabase
      .from("ai_messages")
      .select("id, role, content")
      .eq("dish_id", dishId)
      .order("created_at", { ascending: true })
      .limit(100),
    supabase
      .from("ai_messages")
      .select("*", { count: "exact", head: true })
      .eq("role", "user")
      .gte("created_at", startOfUtcDay()),
  ]);
  return {
    status: "ready",
    messages: (messages ?? []) as ChefMessage[],
    remaining: Math.max(0, CHEF_DAILY_LIMIT - (count ?? 0)),
  };
}
