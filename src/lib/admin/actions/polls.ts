"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  check,
  checkRow,
  runAction,
  type ActionResult,
} from "../action-result";
import { i18nText, optionalI18nText } from "../schemas";

const PollSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Mês no formato AAAA-MM"),
  status: z.enum(["draft", "open", "closed"]),
  closes_at: z.iso.datetime(),
});

const OptionSchema = z.object({
  dish_name: i18nText(120),
  description: optionalI18nText(400),
  location_id: z.guid().nullable(),
  image_url: z.url().nullable(),
});
const OptionsSchema = z
  .array(OptionSchema)
  .min(2, "Mínimo de 2 opções")
  .max(5, "Máximo de 5 opções");

export async function savePoll(
  id: string | null,
  input: z.input<typeof PollSchema>,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await assertAdmin();
    const { month, ...values } = PollSchema.parse(input);
    const row = { ...values, month: `${month}-01` };
    const supabase = await createClient();
    const saved = id
      ? checkRow(
          await supabase
            .from("polls")
            .update(row)
            .eq("id", id)
            .select("id")
            .single(),
        )
      : checkRow(
          await supabase.from("polls").insert(row).select("id").single(),
        );
    revalidatePath("/", "layout");
    return { id: saved.id };
  });
}

/** Options can only change while the poll is a draft, so no vote is ever lost. */
export async function savePollOptions(
  pollId: string,
  items: z.input<typeof OptionsSchema>,
): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    const options = OptionsSchema.parse(items);
    const supabase = await createClient();
    const poll = checkRow(
      await supabase.from("polls").select("status").eq("id", pollId).single(),
    );
    if (poll.status !== "draft")
      throw new Error(
        "As opções só podem mudar enquanto a votação é rascunho.",
      );
    check(await supabase.from("poll_options").delete().eq("poll_id", pollId));
    check(
      await supabase.from("poll_options").insert(
        options.map((option, position) => ({
          ...option,
          poll_id: pollId,
          position,
        })),
      ),
    );
    revalidatePath("/", "layout");
    return null;
  });
}

/** Closes the poll and records the option with the most votes as the winner. */
export async function closePoll(
  pollId: string,
): Promise<ActionResult<{ winner: string | null }>> {
  return runAction(async () => {
    await assertAdmin();
    const supabase = await createClient();
    const results =
      check(await supabase.rpc("poll_results", { p_poll_id: pollId })) ?? [];
    const winner = [...results].sort((a, b) => b.votes - a.votes)[0];
    check(
      await supabase
        .from("polls")
        .update({
          status: "closed",
          winner_option_id:
            winner && winner.votes > 0 ? winner.option_id : null,
        })
        .eq("id", pollId),
    );
    revalidatePath("/", "layout");
    return { winner: winner?.option_id ?? null };
  });
}

export async function deletePoll(pollId: string): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    const supabase = await createClient();
    check(await supabase.from("polls").delete().eq("id", pollId));
    revalidatePath("/", "layout");
    return null;
  });
}
