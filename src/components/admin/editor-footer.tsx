import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EditorFooter({
  onAdd,
  addLabel,
  onSave,
  onTranslate,
  isPending,
  isTranslating,
  isDirty,
}: {
  onAdd: () => void;
  addLabel: string;
  onSave: () => void;
  onTranslate: () => void;
  isPending: boolean;
  isTranslating: boolean;
  isDirty: boolean;
}) {
  return (
    <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t bg-background/95 py-4 backdrop-blur">
      <Button type="button" variant="outline" onClick={onAdd}>
        <Plus aria-hidden />
        {addLabel}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onTranslate}
        disabled={isTranslating}
      >
        Traduzir campos vazios
      </Button>
      <div className="ml-auto flex items-center gap-3">
        {isDirty && (
          <span className="text-sm text-muted-foreground">
            Alterações não salvas
          </span>
        )}
        <Button type="button" onClick={onSave} disabled={isPending}>
          {isPending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
