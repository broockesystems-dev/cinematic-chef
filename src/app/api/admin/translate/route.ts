import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { translatePtToEn, TranslationError } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";

const BodySchema = z.object({
  texts: z.array(z.string().max(5000)).min(1).max(50),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!(await rateLimit(`translate:${user.id}`, 30, 60))) {
    return NextResponse.json(
      { error: "Muitas traduções seguidas. Espere um minuto." },
      { status: 429 },
    );
  }

  const body = BodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY não configurada no servidor." },
      { status: 503 },
    );
  }

  try {
    const translations = await translatePtToEn(body.data.texts);
    return NextResponse.json({ translations });
  } catch (error) {
    console.error("translation failed", error);
    const message =
      error instanceof TranslationError
        ? error.message
        : "Falha ao traduzir. Tente de novo.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
