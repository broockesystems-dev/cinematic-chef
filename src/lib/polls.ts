import "server-only";
import type { I18nText } from "@/lib/i18n-text";
import { createClient } from "@/lib/supabase/server";

export type PollOption = {
  id: string;
  dishName: I18nText;
  description: I18nText | null;
  imageUrl: string | null;
  locationId: string | null;
  votes: number | null;
};

export type Poll = {
  id: string;
  month: string;
  status: "draft" | "open" | "closed";
  closesAt: string;
  winnerOptionId: string | null;
  options: PollOption[];
};

async function withOptions(poll: {
  id: string;
  month: string;
  status: Poll["status"];
  closes_at: string;
  winner_option_id: string | null;
}): Promise<Poll> {
  const supabase = await createClient();
  const [{ data: options }, { data: results }] = await Promise.all([
    supabase
      .from("poll_options")
      .select("id, dish_name, description, image_url, location_id")
      .eq("poll_id", poll.id)
      .order("position"),
    supabase.rpc("poll_results", { p_poll_id: poll.id }),
  ]);
  const counts = new Map((results ?? []).map((r) => [r.option_id, r.votes]));
  return {
    id: poll.id,
    month: poll.month,
    status: poll.status,
    closesAt: poll.closes_at,
    winnerOptionId: poll.winner_option_id,
    options: (options ?? []).map((o) => ({
      id: o.id,
      dishName: o.dish_name as I18nText,
      description: (o.description as I18nText | null) ?? null,
      imageUrl: o.image_url,
      locationId: o.location_id,
      // null = results not visible to this visitor yet.
      votes: counts.size ? (counts.get(o.id) ?? 0) : null,
    })),
  };
}

const POLL_COLUMNS = "id, month, status, closes_at, winner_option_id";

/** The poll open now (if any), this visitor's vote, and past winners. */
export async function getVotePage() {
  const supabase = await createClient();
  const [{ data: open }, { data: closed }, { data: claims }] =
    await Promise.all([
      supabase
        .from("polls")
        .select(POLL_COLUMNS)
        .eq("status", "open")
        .gt("closes_at", new Date().toISOString())
        .order("month", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("polls")
        .select(POLL_COLUMNS)
        .eq("status", "closed")
        .order("month", { ascending: false })
        .limit(12),
      supabase.auth.getClaims(),
    ]);

  const current = open ? await withOptions(open) : null;
  let myVote: string | null = null;
  if (current && claims?.claims) {
    const { data: vote } = await supabase
      .from("votes")
      .select("option_id")
      .eq("poll_id", current.id)
      .maybeSingle();
    myVote = vote?.option_id ?? null;
  }
  const past = await Promise.all((closed ?? []).map(withOptions));
  return { current, myVote, past };
}

export async function getPollForAdmin(id: string): Promise<Poll | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("polls")
    .select(POLL_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return data ? withOptions(data) : null;
}

export async function listPollsForAdmin() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("polls")
    .select(`${POLL_COLUMNS}, poll_options(count)`)
    .order("month", { ascending: false });
  return data ?? [];
}
