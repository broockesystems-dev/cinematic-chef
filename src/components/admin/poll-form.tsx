"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { deletePoll, savePoll } from "@/lib/admin/actions/polls";
import { fromLocalInput, toLocalInput } from "@/lib/datetime";
import type { Poll } from "@/lib/polls";
import { ConfirmDelete } from "./confirm-delete";

export function PollForm({ poll }: { poll?: Poll }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [month, setMonth] = useState(poll?.month.slice(0, 7) ?? "");
  const [status, setStatus] = useState(poll?.status ?? "draft");
  const [closesAt, setClosesAt] = useState(
    toLocalInput(poll?.closesAt ?? null),
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await savePoll(poll?.id ?? null, {
        month,
        status,
        closes_at: fromLocalInput(closesAt) ?? "",
      });
      if (!result.ok) return void toast.error(result.error);
      toast.success("Votação salva.");
      if (poll) router.refresh();
      else router.push(`/admin/polls/${result.data.id}`);
    });
  }

  return (
    <form onSubmit={submit} className="grid max-w-3xl gap-4 sm:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor="month">Mês</Label>
        <Input
          id="month"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <NativeSelect
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="draft">Rascunho</option>
          <option value="open">Aberta</option>
          <option value="closed">Encerrada</option>
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor="closes-at">Encerra em (Brasília)</Label>
        <Input
          id="closes-at"
          type="datetime-local"
          value={closesAt}
          onChange={(e) => setClosesAt(e.target.value)}
          required
        />
      </div>
      <div className="flex items-center gap-2 sm:col-span-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando…" : "Salvar"}
        </Button>
        {poll && (
          <div className="ml-auto">
            <ConfirmDelete
              title="Apagar esta votação?"
              description="Apaga a votação, as opções e todos os votos."
              onConfirm={async () => {
                const result = await deletePoll(poll.id);
                if (!result.ok) return void toast.error(result.error);
                router.push("/admin/polls");
              }}
            />
          </div>
        )}
      </div>
    </form>
  );
}
