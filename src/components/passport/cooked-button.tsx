"use client";

import { Camera, Check, Loader2, Stamp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { markCooked, removeCooked } from "@/lib/actions/passport";
import { localize } from "@/lib/i18n-text";
import type { CookedState } from "@/lib/passport.server";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export function CookedButton({
  dishId,
  dishName,
  state,
}: {
  dishId: string;
  dishName: string;
  state: CookedState;
}) {
  const t = useTranslations("Passport");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!state.signedIn) {
    return (
      <Button asChild variant="outline">
        <Link
          href={{ pathname: "/login", query: { next: pathname } }}
          aria-label={t("signIn")}
        >
          <Stamp aria-hidden />
          {t("cooked")}
        </Link>
      </Button>
    );
  }
  const { userId, cooked, hasPhoto } = state;

  function pick(next: File | undefined) {
    if (!next) return;
    if (next.size > MAX_PHOTO_BYTES) return void toast.error(t("errors.photo"));
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  async function save() {
    setSaving(true);
    let photoPath: string | null = null;
    if (file) {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      photoPath = `${userId}/${dishId}-${Date.now()}.${extension}`;
      const { createClient } = await import("@/lib/supabase/client");
      const { error } = await createClient()
        .storage.from("cooked")
        .upload(photoPath, file, { contentType: file.type });
      if (error) {
        setSaving(false);
        return void toast.error(t("errors.photo"));
      }
    }
    const result = await markCooked(dishId, photoPath);
    setSaving(false);
    if (!result.ok) {
      return void toast.error(
        t(result.error === "forbidden" ? "errors.forbidden" : "errors.generic"),
      );
    }
    const { country, newStamp } = result.data;
    toast.success(
      newStamp && country
        ? t("newStamp", { country: localize(country, locale).text })
        : t("stamped"),
    );
    setOpen(false);
    setFile(null);
    setPreview(null);
    router.refresh();
  }

  async function remove() {
    setSaving(true);
    const result = await removeCooked(dishId);
    setSaving(false);
    if (!result.ok) return void toast.error(t("errors.generic"));
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        aria-pressed={cooked}
      >
        {cooked ? (
          <Check aria-hidden className="text-free" />
        ) : (
          <Stamp aria-hidden />
        )}
        {cooked ? t("cookedDone") : t("cooked")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dialogTitle", { dish: dishName })}</DialogTitle>
            <DialogDescription>{t("dialogBody")}</DialogDescription>
          </DialogHeader>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
            <img
              src={preview}
              alt=""
              className="aspect-square w-full rounded-lg object-cover"
            />
          )}
          <div>
            <Button asChild variant="outline" size="sm">
              <label htmlFor={inputId} className="cursor-pointer">
                <Camera aria-hidden />
                {file || hasPhoto ? t("changePhoto") : t("choosePhoto")}
              </label>
            </Button>
            <input
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              capture="environment"
              className="sr-only"
              onChange={(e) => pick(e.target.files?.[0])}
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            {cooked ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                onClick={remove}
                disabled={saving}
              >
                {t("remove")}
              </Button>
            ) : (
              <span />
            )}
            <Button
              type="button"
              onClick={save}
              disabled={saving || (cooked && !file)}
            >
              {saving && <Loader2 className="animate-spin" aria-hidden />}
              {saving ? t("saving") : cooked ? t("addPhoto") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
