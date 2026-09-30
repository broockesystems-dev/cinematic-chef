import { Badge } from "@/components/ui/badge";
import { ACCESS_LABELS } from "./labels";

type Props = { status: "draft" | "published"; publishedAt: string | null };

export function DishStatusBadge({ status, publishedAt }: Props) {
  if (status === "draft") return <Badge variant="outline">Rascunho</Badge>;
  if (publishedAt && new Date(publishedAt) > new Date()) {
    return <Badge variant="secondary">Agendado</Badge>;
  }
  return <Badge className="bg-free/15 text-free">Publicado</Badge>;
}

export function AccessBadge({ access }: { access: "free" | "premium" }) {
  return (
    <Badge
      variant="outline"
      className={
        access === "free"
          ? "border-free/40 text-free"
          : "border-premium/40 text-premium"
      }
    >
      {ACCESS_LABELS[access]}
    </Badge>
  );
}
