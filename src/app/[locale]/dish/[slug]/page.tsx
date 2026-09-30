import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, Gauge, Users } from "lucide-react";
import { ChefButton } from "@/components/chef/chef-button";
import { ChefProvider } from "@/components/chef/chef-provider";
import { ChefSheet } from "@/components/chef/chef-sheet";
import { AccessBadge } from "@/components/dish/access-badge";
import { DishVideo } from "@/components/dish/dish-video";
import { FavoriteButton } from "@/components/dish/favorite-button";
import { LockedRecipe } from "@/components/dish/locked-recipe";
import { Recipe } from "@/components/dish/recipe";
import { RecipeJsonLd } from "@/components/dish/recipe-json-ld";
import type { RecipeIngredient, RecipeStep } from "@/components/dish/types";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getChefState } from "@/lib/chef-state";
import { getDishPage, getFavoriteState } from "@/lib/dishes";
import { explorePath } from "@/lib/explore";
import { formatMinutes } from "@/lib/format";
import { localize } from "@/lib/i18n-text";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dish/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getDishPage(slug);
  if (!data) return {};
  const name = localize(data.dish.name, locale as Locale).text;
  const story = localize(data.dish.story, locale as Locale).text;
  return pageMetadata({
    locale: locale as Locale,
    path: `/dish/${slug}`,
    title: name,
    description: story.slice(0, 160),
    type: "article",
  });
}

export default async function DishPage({
  params,
}: PageProps<"/[locale]/dish/[slug]">) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);

  const data = await getDishPage(slug);
  if (!data) notFound();
  const { dish, path, hasAccess } = data;
  const t = await getTranslations("Dish");
  const [favoriteState, chefState] = await Promise.all([
    getFavoriteState(dish.id),
    getChefState(dish.id),
  ]);

  const name = localize(dish.name, locale);
  const story = localize(dish.story, locale);
  // Localize on the server so the client only receives the strings it shows.
  const langIfFallback = (text: ReturnType<typeof localize>) =>
    text.isFallback ? text.locale : undefined;

  const ingredients: RecipeIngredient[] = data.ingredients.map((ingredient) => {
    const ingredientName = localize(ingredient.name, locale);
    return {
      id: ingredient.id,
      name: ingredientName.text,
      note: ingredient.note
        ? localize(ingredient.note, locale).text || null
        : null,
      lang: langIfFallback(ingredientName),
      amount: {
        qtyMetric: ingredient.qty_metric,
        unitMetric: ingredient.unit_metric,
        qtyUs: ingredient.qty_us,
        unitUs: ingredient.unit_us,
      },
    };
  });
  const steps: RecipeStep[] = data.steps.map((step) => {
    const text = localize(step.text, locale);
    return {
      id: step.id,
      title: step.title ? localize(step.title, locale).text || null : null,
      text: text.text,
      lang: langIfFallback(text),
      mediaUrl: step.media_url,
      timerSeconds: step.timer_seconds,
    };
  });

  return (
    <ChefProvider
      initial={chefState}
      dishId={dish.id}
      slug={dish.slug}
      dishName={localize(dish.name, locale).text}
    >
      <article>
        <RecipeJsonLd data={data} locale={locale} />
        <header className="relative isolate overflow-hidden border-b">
          {dish.cover_url ? (
            <Image
              src={dish.cover_url}
              alt=""
              fill
              priority
              sizes="100vw"
              className="-z-10 object-cover opacity-40"
            />
          ) : (
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/20 via-background to-background"
            />
          )}
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/60 to-transparent"
            aria-hidden
          />
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 pt-12 pb-10 sm:pt-32">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                {path.map((location, i) => (
                  <li key={location.id} className="flex items-center gap-1.5">
                    {i > 0 && <span aria-hidden>›</span>}
                    <Link
                      href={explorePath(path.slice(0, i + 1))}
                      className="hover:text-foreground"
                    >
                      {localize(location.name, locale).text}
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
            <h1
              className="font-display text-4xl font-semibold text-balance sm:text-6xl"
              lang={langIfFallback(name)}
            >
              {name.text}
            </h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <AccessBadge access={dish.access} />
              <FavoriteButton
                dishId={dish.id}
                initialFavorite={favoriteState.favorite}
                signedIn={favoriteState.signedIn}
              />
              <ChefButton />
              <dl className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
                {dish.prep_minutes && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-4" aria-hidden />
                    <dt className="sr-only">{t("prepTime")}</dt>
                    <dd>{formatMinutes(dish.prep_minutes)}</dd>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Gauge className="size-4" aria-hidden />
                  <dt className="sr-only">{t("difficultyLabel")}</dt>
                  <dd>{t(`difficulty.${dish.difficulty}`)}</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="size-4" aria-hidden />
                  <dt className="sr-only">{t("servingsLabel")}</dt>
                  <dd>{t("servings", { count: dish.base_servings })}</dd>
                </div>
              </dl>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl space-y-14 px-4 py-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
            {story.text && (
              <section aria-labelledby="story-heading" className="space-y-4">
                <h2
                  id="story-heading"
                  className="font-display text-2xl font-semibold"
                >
                  {t("story")}
                </h2>
                <p
                  className="text-lg leading-relaxed text-pretty text-muted-foreground"
                  lang={langIfFallback(story)}
                >
                  {story.text}
                </p>
                {story.isFallback && (
                  <p className="text-xs text-muted-foreground">
                    {t("translationMissing")}
                  </p>
                )}
              </section>
            )}
            {(data.teaser || data.full) && (
              <section aria-label={t("fullVideo")} className="space-y-3">
                <DishVideo
                  dishId={dish.id}
                  dishName={name.text}
                  teaser={data.teaser}
                  full={data.full}
                />
                {!hasAccess && (
                  <p className="text-sm text-muted-foreground">
                    <Link
                      href="/pricing"
                      className="text-primary hover:underline"
                    >
                      {t("watchFull")}
                    </Link>
                  </p>
                )}
              </section>
            )}
          </div>

          {hasAccess ? (
            <Recipe
              dishName={name.text}
              baseServings={dish.base_servings}
              ingredients={ingredients}
              steps={steps}
            />
          ) : (
            <LockedRecipe slug={dish.slug} />
          )}
        </div>
      </article>
      <ChefSheet />
    </ChefProvider>
  );
}
