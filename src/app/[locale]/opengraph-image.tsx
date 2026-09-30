import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { OG_SIZE, OgCard } from "@/components/og/og-card";
import type { Locale } from "@/i18n/routing";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "The Cinematic Chef";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations({
    locale: (await params).locale as Locale,
    namespace: "Explore",
  });
  return new ImageResponse(
    <OgCard
      eyebrow="@thecinematic.chef"
      title="The Cinematic Chef"
      subtitle={t("title")}
    />,
    size,
  );
}
