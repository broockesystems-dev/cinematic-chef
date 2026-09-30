import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { routing } from "@/i18n/routing";
import { ancestry, explorePath, type SearchResult } from "@/lib/explore";
import { getExploreData } from "@/lib/explore.server";
import { localize, type I18nText } from "@/lib/i18n-text";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createPublicClient } from "@/lib/supabase/public";

const QuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
  locale: z.enum(routing.locales).default(routing.defaultLocale),
});

export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parsed.success) return NextResponse.json({ results: [] });
  const { q, locale } = parsed.data;

  if (!(await rateLimit(`search:${await clientIp()}`, 60, 60))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const [{ data: rows, error }, explore] = await Promise.all([
    createPublicClient().rpc("search_catalog", { p_query: q, p_limit: 20 }),
    getExploreData(),
  ]);
  if (error) {
    console.error("search failed", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }

  const byId = new Map(explore.locations.map((l) => [l.id, l]));
  const names = (chain: { name: I18nText }[]) =>
    chain.map((l) => localize(l.name, locale).text).join(" › ");

  const results: SearchResult[] = rows.flatMap((row): SearchResult[] => {
    const chain = ancestry(row.location_id, byId);
    // Places without published dishes are hidden from the explorer.
    if (chain.length === 0) return [];
    const name = localize(row.name as I18nText, locale).text;
    return row.kind === "dish"
      ? [
          {
            kind: "dish",
            id: row.id,
            name,
            context: names(chain.slice(1)),
            href: `/dish/${row.slug}`,
            access: row.access,
          },
        ]
      : [
          {
            kind: "location",
            id: row.id,
            name,
            context: names(chain.slice(0, -1)),
            href: explorePath(chain),
            access: null,
          },
        ];
  });

  return NextResponse.json(
    { results },
    // Public data: let the CDN absorb repeated queries for a minute.
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
