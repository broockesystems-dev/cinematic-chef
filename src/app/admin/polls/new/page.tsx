import { PollForm } from "@/components/admin/poll-form";

export const metadata = { title: "Nova votação" };

export default function NewPollPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Nova votação</h1>
      <p className="text-muted-foreground">
        Crie como rascunho, adicione de 2 a 5 opções e depois abra a votação.
      </p>
      <PollForm />
    </div>
  );
}
