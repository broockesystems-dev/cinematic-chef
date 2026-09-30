import { useTranslations } from "next-intl";

export function SkipLink() {
  const t = useTranslations("Header");
  return (
    <a
      href="#content"
      className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >
      {t("skip")}
    </a>
  );
}
