import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function LockedRecipe({ slug }: { slug: string }) {
  const t = useTranslations("Dish.locked");
  return (
    <section
      aria-labelledby="locked-heading"
      className="flex flex-col items-center gap-4 rounded-xl border border-premium/30 bg-card px-6 py-12 text-center"
    >
      <Lock className="size-8 text-premium" aria-hidden />
      <h2 id="locked-heading" className="font-display text-2xl font-semibold">
        {t("title")}
      </h2>
      <p className="max-w-md text-muted-foreground">{t("body")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/pricing">{t("cta")}</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={{ pathname: "/login", query: { next: `/dish/${slug}` } }}>
            {t("signIn")}
          </Link>
        </Button>
      </div>
    </section>
  );
}
