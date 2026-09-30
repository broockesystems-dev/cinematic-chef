import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AccessBadge({
  access,
  className,
}: {
  access: "free" | "premium";
  className?: string;
}) {
  const t = useTranslations("Dish");
  return (
    <Badge
      variant="outline"
      className={cn(
        access === "free"
          ? "border-free/50 text-free"
          : "border-premium/50 text-premium",
        className,
      )}
    >
      {access === "premium" && <Lock aria-hidden />}
      {t(access)}
    </Badge>
  );
}
