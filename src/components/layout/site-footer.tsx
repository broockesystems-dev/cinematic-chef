import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { site } from "@/lib/site";

export function SiteFooter() {
  const t = useTranslations("Footer");
  const tHeader = useTranslations("Header");
  const tLegal = useTranslations("Legal");

  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {site.name}. {t("rights")}
        </p>
        <nav aria-label={t("contact")}>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            <li>
              <Link href="/pricing" className="hover:text-foreground">
                {tHeader("pricing")}
              </Link>
            </li>
            <li>
              <Link href="/trips" className="hover:text-foreground">
                {tHeader("trips")}
              </Link>
            </li>
            <li>
              <Link href="/vote" className="hover:text-foreground">
                {tHeader("vote")}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-foreground">
                {tLegal("privacy")}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-foreground">
                {tLegal("terms")}
              </Link>
            </li>
            <li>
              <a
                href={`mailto:${site.contactEmail}`}
                className="hover:text-foreground"
              >
                {t("contact")}
              </a>
            </li>
            <li>
              <a
                href={site.instagram}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground"
              >
                Instagram
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
