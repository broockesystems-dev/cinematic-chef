import { notFound } from "next/navigation";
import { ClosePollButton } from "@/components/admin/close-poll-button";
import { PollForm } from "@/components/admin/poll-form";
import { PollOptionsEditor } from "@/components/admin/poll-options-editor";
import { listLocations } from "@/lib/admin/queries";
import { getPollForAdmin } from "@/lib/polls";

export const metadata = { title: "Editar votação" };

export default async function EditPollPage({
  params,
}: PageProps<"/admin/polls/[id]">) {
  const { id } = await params;
  const [poll, locations] = await Promise.all([
    getPollForAdmin(id),
    listLocations(),
  ]);
  if (!poll) notFound();
  const total = poll.options.reduce((sum, o) => sum + (o.votes ?? 0), 0);

  return (
    <div className="space-y-10">
      <h1 className="font-display text-3xl font-semibold">
        Votação de {poll.month.slice(0, 7)}
      </h1>
      <PollForm poll={poll} />

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">Opções</h2>
        <PollOptionsEditor poll={poll} locations={locations} />
      </section>

      {poll.status !== "draft" && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold">
            Resultado ({total} votos)
          </h2>
          <ul className="divide-y rounded-lg border">
            {poll.options.map((option) => (
              <li
                key={option.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <span>
                  {option.dishName.pt}
                  {option.id === poll.winnerOptionId && (
                    <span className="ml-2 text-primary">· vencedor</span>
                  )}
                </span>
                <span className="tabular-nums">{option.votes ?? 0}</span>
              </li>
            ))}
          </ul>
          {poll.status === "open" && <ClosePollButton pollId={poll.id} />}
        </section>
      )}
    </div>
  );
}
