import { getFormatter, getTranslations } from "next-intl/server";
import type { LegalDocument } from "@/content/legal";

export async function LegalPage({
  title,
  document,
}: {
  title: string;
  document: LegalDocument;
}) {
  const t = await getTranslations("Legal");
  const format = await getFormatter();
  return (
    <article className="mx-auto w-full max-w-2xl space-y-8 px-4 py-16">
      <header className="space-y-2">
        <h1 className="font-display text-4xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {t("updated", {
            date: format.dateTime(new Date(document.updated), {
              dateStyle: "long",
            }),
          })}
        </p>
      </header>
      {document.sections.map((section) => (
        <section key={section.title} className="space-y-3">
          <h2 className="font-display text-xl font-semibold">
            {section.title}
          </h2>
          {section.body.map((paragraph) => (
            <p
              key={paragraph}
              className="leading-relaxed text-muted-foreground"
            >
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
