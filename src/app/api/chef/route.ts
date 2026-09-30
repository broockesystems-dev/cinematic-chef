import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccount } from "@/lib/account";
import {
  buildChefSystemPrompt,
  CHEF_DAILY_LIMIT,
  CHEF_HISTORY_LIMIT,
  CHEF_MAX_MESSAGE_LENGTH,
  startOfUtcDay,
} from "@/lib/chef";
import { getDishPage } from "@/lib/dishes";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

const BodySchema = z.object({
  slug: z.string().min(1).max(200),
  message: z.string().trim().min(1).max(CHEF_MAX_MESSAGE_LENGTH),
});

const FALLBACK_TEXT = {
  refusal: {
    pt: "Desculpe, não posso ajudar com isso.",
    en: "Sorry, I can't help with that.",
  },
  error: {
    pt: "O chef não conseguiu responder agora. Tente de novo em instantes.",
    en: "The chef couldn't answer right now. Please try again in a moment.",
  },
};

const error = (code: string, status: number) =>
  NextResponse.json({ error: code }, { status });

/**
 * Chat with the AI chef about one dish. Subscribers only, checked here and
 * again by RLS when the message is stored. Streams plain text back.
 */
export async function POST(request: Request) {
  const account = await getAccount();
  if (!account) return error("unauthenticated", 401);

  const allowed =
    (await rateLimit(`chef:ip:${await clientIp()}`, 30, 60)) &&
    (await rateLimit(`chef:user:${account.id}`, 10, 60));
  if (!allowed) return error("rate_limited", 429);

  const body = BodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return error("bad_request", 400);

  if (!account.subscription && account.role !== "admin")
    return error("subscription_required", 403);

  const data = await getDishPage(body.data.slug);
  if (!data?.hasAccess) return error("not_found", 404);

  const supabase = await createClient();
  const { count } = await supabase
    .from("ai_messages")
    .select("*", { count: "exact", head: true })
    .eq("role", "user")
    .gte("created_at", startOfUtcDay());
  const used = count ?? 0;
  if (used >= CHEF_DAILY_LIMIT) return error("daily_limit", 429);

  if (!process.env.ANTHROPIC_API_KEY) return error("unavailable", 503);

  const { data: rows } = await supabase
    .from("ai_messages")
    .select("role, content")
    .eq("dish_id", data.dish.id)
    .order("created_at", { ascending: false })
    .limit(CHEF_HISTORY_LIMIT);
  const history = (rows ?? []).reverse();
  // The conversation sent to the API must start with the user.
  while (history[0]?.role === "assistant") history.shift();

  const { error: insertError } = await supabase.from("ai_messages").insert({
    user_id: account.id,
    dish_id: data.dish.id,
    role: "user",
    content: body.data.message,
  });
  if (insertError) return error("subscription_required", 403);

  const locale = account.locale;
  const client = new Anthropic();
  const stream = client.beta.messages.stream({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    // Conversational answers: low effort keeps them quick and cheap.
    output_config: { effort: "low" },
    // If a safety classifier declines, retry server-side on the recommended model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [
      {
        type: "text",
        text: buildChefSystemPrompt({ data, locale, country: account.country }),
        // Same dish, same cook: the prefix repeats on every turn.
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: body.data.message },
    ],
  });

  const encoder = new TextEncoder();
  const output = new ReadableStream<Uint8Array>({
    async start(controller) {
      let text = "";
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            text += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal" && !text) {
          text = FALLBACK_TEXT.refusal[locale];
          controller.enqueue(encoder.encode(text));
        }
        const usage = final.usage;
        await supabase.from("ai_messages").insert({
          user_id: account.id,
          dish_id: data.dish.id,
          role: "assistant",
          content: text || FALLBACK_TEXT.error[locale],
          tokens:
            usage.input_tokens +
            usage.output_tokens +
            (usage.cache_read_input_tokens ?? 0) +
            (usage.cache_creation_input_tokens ?? 0),
        });
      } catch (err) {
        console.error("chef stream failed", err);
        if (!text)
          controller.enqueue(encoder.encode(FALLBACK_TEXT.error[locale]));
      } finally {
        controller.close();
      }
    },
    cancel() {
      // The cook closed the chat: stop paying for tokens nobody will read.
      stream.abort();
    },
  });

  return new Response(output, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Chef-Remaining": String(CHEF_DAILY_LIMIT - used - 1),
    },
  });
}
