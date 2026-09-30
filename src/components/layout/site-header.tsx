import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { UserMenu } from "@/components/auth/user-menu";
import { LocaleSwitcher } from "./locale-switcher";

export function SiteHeader() {
  const t = useTranslations("Header");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight"
        >
          The Cinematic Chef
        </Link>
        <nav aria-label={t("home")} className="flex items-center gap-2">
          <LocaleSwitcher />
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
