"use client";

import { Languages, Loader2 } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslator, type I18nValue } from "./use-translator";

type Props = {
  label: string;
  value: I18nValue;
  onChange: (value: I18nValue) => void;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  placeholder?: string;
};

/** PT and EN side by side, with a per-field "translate from PT" button. */
export function I18nField({
  label,
  value,
  onChange,
  multiline,
  rows = 4,
  required,
  placeholder,
}: Props) {
  const id = useId();
  const { translate, isTranslating } = useTranslator();
  const Control = multiline ? Textarea : Input;

  async function translateField() {
    const result = await translate([value.pt]);
    if (result) onChange({ ...value, en: result[0] });
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </legend>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex h-6 items-center">
            <Label
              htmlFor={`${id}-pt`}
              className="text-xs text-muted-foreground"
            >
              Português
            </Label>
          </div>
          <Control
            id={`${id}-pt`}
            value={value.pt}
            onChange={(e) => onChange({ ...value, pt: e.target.value })}
            required={required}
            placeholder={placeholder}
            {...(multiline ? { rows } : {})}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex h-6 items-center justify-between gap-2">
            <Label
              htmlFor={`${id}-en`}
              className="text-xs text-muted-foreground"
            >
              English
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={translateField}
              disabled={!value.pt.trim() || isTranslating}
            >
              {isTranslating ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <Languages aria-hidden />
              )}
              Traduzir
            </Button>
          </div>
          <Control
            id={`${id}-en`}
            lang="en"
            value={value.en}
            onChange={(e) => onChange({ ...value, en: e.target.value })}
            {...(multiline ? { rows } : {})}
          />
        </div>
      </div>
    </fieldset>
  );
}

export function toI18nValue(
  value: { pt: string; en?: string } | null | undefined,
): I18nValue {
  return { pt: value?.pt ?? "", en: value?.en ?? "" };
}
