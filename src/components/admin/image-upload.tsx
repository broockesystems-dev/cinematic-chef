"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 10 * 1024 * 1024;

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  /** Folder inside the `media` bucket, e.g. "covers". */
  folder: string;
  label: string;
};

/** Uploads straight to Supabase Storage; storage RLS only allows admins. */
export function ImageUpload({ value, onChange, folder, label }: Props) {
  const id = useId();
  const [isUploading, setIsUploading] = useState(false);

  async function upload(file: File) {
    if (file.size > MAX_BYTES) return toast.error("Imagem maior que 10 MB.");
    setIsUploading(true);
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${folder}/${crypto.randomUUID()}.${extension}`;
    const storage = createClient().storage.from("media");
    const { error } = await storage.upload(path, file, {
      contentType: file.type,
    });
    setIsUploading(false);
    if (error) return toast.error(`Falha no upload: ${error.message}`);
    onChange(storage.getPublicUrl(path).data.publicUrl);
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview of arbitrary storage URLs
          <img
            src={value}
            alt=""
            className="size-20 rounded-md border object-cover"
          />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-md border border-dashed text-muted-foreground">
            <ImagePlus aria-hidden />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            asChild
            disabled={isUploading}
          >
            <label htmlFor={id} className="cursor-pointer">
              {isUploading && <Loader2 className="animate-spin" aria-hidden />}
              {value ? "Trocar imagem" : "Enviar imagem"}
            </label>
          </Button>
          <input
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = "";
            }}
          />
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
            >
              <X aria-hidden />
              Remover
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
