"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { deleteAccount } from "@/lib/actions/account";
import { createClient } from "@/lib/supabase/client";

export function DeleteAccount() {
  const t = useTranslations("Account");
  const tLegal = useTranslations("Legal");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteAccount();
      if (!result.ok) return void toast.error(t("error"));
      toast.success(t("deleted"));
      // Tell the browser client too, so the header menu updates immediately.
      await createClient().auth.signOut({ scope: "local" });
      router.replace("/");
    });
  }

  return (
    <section
      aria-labelledby="delete-heading"
      className="space-y-3 rounded-xl border border-destructive/30 p-6"
    >
      <h2 id="delete-heading" className="font-display text-xl font-semibold">
        {t("privacy")}
      </h2>
      <p className="text-sm text-muted-foreground">
        <Link href="/privacy" className="underline hover:text-foreground">
          {tLegal("privacy")}
        </Link>
      </p>
      <p className="text-sm text-muted-foreground">{t("deleteBody")}</p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="border-destructive/50 text-destructive"
            disabled={isPending}
          >
            {t("deleteTitle")}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              {t("deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
