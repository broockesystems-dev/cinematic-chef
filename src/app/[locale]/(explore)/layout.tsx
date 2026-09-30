import { ExploreShell } from "@/components/explore/explore-shell";
import { buildPins } from "@/lib/explore";
import { getExploreData } from "@/lib/explore.server";

// Public catalog only (no cookies), so these pages are static and refreshed
// every few minutes; admin edits also revalidate them immediately.
export const revalidate = 300;

export default async function ExploreLayout({
  children,
}: LayoutProps<"/[locale]">) {
  const data = await getExploreData();
  return (
    <ExploreShell locations={data.locations} pins={buildPins(data)}>
      {children}
    </ExploreShell>
  );
}
