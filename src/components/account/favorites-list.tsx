import { useLocale, useTranslations } from "next-intl";
import { AccessBadge } from "@/components/dish/access-badge";
import { FavoriteButton } from "@/components/dish/favorite-button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { localize, type I18nText } from "@/lib/i18n-text";

type Favorite = {
  id: string;
  slug: string;
  name: I18nText;
  access: "free" | "premium";
};

export function FavoritesList({ favorites }: { favorites: Favorite[] }) {
  const t = useTranslations("Account");
  const locale = useLocale() as Locale;
  return (
    <section aria-labelledby="favorites-heading" className="space-y-4">
      <h2
        id="favorites-heading"
        className="font-display text-2xl font-semibold"
      >
        {t("favorites")}
      </h2>
      {favorites.length === 0 ? (
        <p className="text-muted-foreground">{t("noFavorites")}</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {favorites.map((dish) => (
            <li key={dish.id} className="flex items-center gap-3 px-4 py-2">
              <Link
                href={`/dish/${dish.slug}`}
                className="flex-1 font-medium hover:underline"
              >
                {localize(dish.name, locale).text}
              </Link>
              <AccessBadge access={dish.access} />
              <FavoriteButton
                dishId={dish.id}
                initialFavorite
                signedIn
                size="icon"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
