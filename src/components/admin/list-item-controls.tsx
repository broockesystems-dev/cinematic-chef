import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  label: string;
  isFirst: boolean;
  isLast: boolean;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
};

export function ListItemControls({
  label,
  isFirst,
  isLast,
  onMove,
  onRemove,
}: Props) {
  return (
    <div className="flex gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={isFirst}
        onClick={() => onMove(-1)}
        aria-label={`Subir ${label}`}
      >
        <ArrowUp aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={isLast}
        onClick={() => onMove(1)}
        aria-label={`Descer ${label}`}
      >
        <ArrowDown aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        aria-label={`Remover ${label}`}
        className="text-destructive"
      >
        <Trash2 aria-hidden />
      </Button>
    </div>
  );
}
