"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useChef } from "./chef-provider";

/** Opens the chef panel. `compact` hides the label on phones (icon only). */
export function ChefButton({
  size = "default",
  compact = false,
}: {
  size?: "default" | "sm";
  compact?: boolean;
}) {
  const t = useTranslations("Chef");
  const { setOpen } = useChef();
  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={() => setOpen(true)}
    >
      <Sparkles aria-hidden className="text-primary" />
      <span className={compact ? "sr-only sm:not-sr-only" : undefined}>
        {t("open")}
      </span>
    </Button>
  );
}
