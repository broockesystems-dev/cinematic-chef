import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listPollsForAdmin } from "@/lib/polls";

export const metadata = { title: "Votações" };

const STATUS = {
  draft: "Rascunho",
  open: "Aberta",
  closed: "Encerrada",
} as const;

export default async function PollsPage() {
  const polls = await listPollsForAdmin();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">Votações</h1>
        <Button asChild>
          <Link href="/admin/polls/new">Nova votação</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mês</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Opções</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {polls.map((poll) => (
            <TableRow key={poll.id}>
              <TableCell>
                <Link
                  href={`/admin/polls/${poll.id}`}
                  className="font-medium hover:underline"
                >
                  {poll.month.slice(0, 7)}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={poll.status === "open" ? "default" : "outline"}>
                  {STATUS[poll.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {(poll.poll_options as unknown as { count: number }[])[0]
                  ?.count ?? 0}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {polls.length === 0 && (
        <p className="text-muted-foreground">Nenhuma votação ainda.</p>
      )}
    </div>
  );
}
