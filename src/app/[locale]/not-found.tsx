import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <section className="mx-auto flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold">{t("title")}</h1>
      <Button asChild>
        <Link href="/">{t("back")}</Link>
      </Button>
    </section>
  );
}
