"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { setFavorite } from "@/lib/actions/account";
import { cn } from "@/lib/utils";

type Props = {
  dishId: string;
  initialFavorite: boolean;
  signedIn: boolean;
  size?: "default" | "icon";
};

export function FavoriteButton({
  dishId,
  initialFavorite,
  signedIn,
  size = "default",
}: Props) {
  const t = useTranslations("Favorite");
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [favorite, setOptimistic] = useOptimistic(initialFavorite);

  if (!signedIn) {
    return (
      <Button asChild variant="outline" size={size}>
        <Link
          href={{ pathname: "/login", query: { next: pathname } }}
          aria-label={t("signIn")}
        >
          <Heart aria-hidden />
          {size !== "icon" && t("add")}
        </Link>
      </Button>
    );
  }

  const label = favorite ? t("remove") : t("add");
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      aria-pressed={favorite}
      aria-label={size === "icon" ? label : undefined}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!favorite);
          const result = await setFavorite(dishId, !favorite);
          if (!result.ok) toast.error(t("error"));
        })
      }
    >
      <Heart
        aria-hidden
        className={cn(favorite && "fill-primary text-primary")}
      />
      {size !== "icon" && label}
    </Button>
  );
}
