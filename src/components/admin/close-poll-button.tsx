"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { closePoll } from "@/lib/admin/actions/polls";

export function ClosePollButton({ pollId }: { pollId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await closePoll(pollId);
          if (!result.ok) return void toast.error(result.error);
          toast.success("Votação encerrada e vencedor definido.");
          router.refresh();
        })
      }
    >
      Encerrar e definir vencedor
    </Button>
  );
}
