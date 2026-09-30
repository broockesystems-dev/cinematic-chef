"use client";

import { Captions, Loader2, RefreshCw, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createVideoUpload, setSubtitle } from "@/lib/admin/actions/videos";
import type { AdminVideo } from "@/lib/admin/queries";
import { createClient } from "@/lib/supabase/client";

type Kind = "teaser" | "full";

const KIND_INFO: Record<Kind, { title: string; description: string }> = {
  teaser: {
    title: "Teaser",
    description: "Trecho curto, público para todos os visitantes.",
  },
  full: {
    title: "Vídeo completo",
    description:
      "Só para assinantes, tocado com URL assinada de curta duração.",
  },
};

const STATUS_LABELS: Record<AdminVideo["status"], string> = {
  waiting: "Aguardando o Mux",
  preparing: "Processando no Mux",
  ready: "Pronto",
  errored: "Erro no processamento",
};

type Props = { dishId: string; videos: AdminVideo[]; muxConfigured: boolean };

export function VideoPanel({ dishId, videos, muxConfigured }: Props) {
  const router = useRouter();
  const isProcessing = videos.some(
    (v) => v.mux_upload_id && v.status !== "ready" && v.status !== "errored",
  );

  // Mux reports progress through the webhook; poll while something is processing.
  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(interval);
  }, [isProcessing, router]);

  return (
    <div className="space-y-4">
      {!muxConfigured && (
        <p
          role="alert"
          className="rounded-md border border-premium/40 px-4 py-3 text-sm"
        >
          Mux não configurado: defina <code>MUX_TOKEN_ID</code> e{" "}
          <code>MUX_TOKEN_SECRET</code> no servidor para enviar vídeos. As
          legendas já podem ser enviadas.
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {(["teaser", "full"] as const).map((kind) => (
          <VideoCard
            key={kind}
            dishId={dishId}
            kind={kind}
            video={videos.find((v) => v.kind === kind)}
            muxConfigured={muxConfigured}
          />
        ))}
      </div>
    </div>
  );
}

function VideoCard({
  dishId,
  kind,
  video,
  muxConfigured,
}: {
  dishId: string;
  kind: Kind;
  video?: AdminVideo;
  muxConfigured: boolean;
}) {
  const router = useRouter();
  const inputId = useId();
  const [progress, setProgress] = useState<number | null>(null);

  async function upload(file: File) {
    setProgress(0);
    const result = await createVideoUpload(dishId, kind);
    if (!result.ok) {
      setProgress(null);
      return void toast.error(result.error);
    }
    // Loaded on demand: only the admin needs the chunked uploader.
    const { createUpload } = await import("@mux/upchunk");
    const uploader = createUpload({
      endpoint: result.data.uploadUrl,
      file,
      chunkSize: 30720,
    });
    uploader.on("progress", (event) => setProgress(Math.round(event.detail)));
    uploader.on("error", (event) => {
      setProgress(null);
      toast.error(`Falha no upload: ${event.detail.message}`);
    });
    uploader.on("success", () => {
      setProgress(null);
      toast.success("Upload concluído. O Mux está processando o vídeo.");
      router.refresh();
    });
  }

  const info = KIND_INFO[kind];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          {info.title}
          {video?.mux_upload_id && (
            <Badge
              variant={video.status === "errored" ? "destructive" : "outline"}
            >
              {STATUS_LABELS[video.status]}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{info.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {video?.mux_playback_id && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Playback ID</dt>
            <dd className="truncate font-mono text-xs">
              {video.mux_playback_id}
            </dd>
            {video.duration_s && (
              <>
                <dt className="text-muted-foreground">Duração</dt>
                <dd>{formatDuration(Number(video.duration_s))}</dd>
              </>
            )}
          </dl>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            disabled={!muxConfigured || progress !== null}
          >
            <label
              htmlFor={inputId}
              className={
                muxConfigured
                  ? "cursor-pointer"
                  : "pointer-events-none opacity-50"
              }
            >
              {progress !== null ? (
                <Loader2 className="animate-spin" aria-hidden />
              ) : (
                <Upload aria-hidden />
              )}
              {video?.mux_upload_id ? "Substituir vídeo" : "Enviar vídeo"}
            </label>
          </Button>
          <input
            id={inputId}
            type="file"
            accept="video/*"
            className="sr-only"
            disabled={!muxConfigured || progress !== null}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = "";
            }}
          />
          {video?.mux_upload_id && video.status !== "ready" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.refresh()}
            >
              <RefreshCw aria-hidden />
              Atualizar status
            </Button>
          )}
        </div>
        {progress !== null && (
          <div
            role="progressbar"
            aria-label="Progresso do upload"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="space-y-2 border-t pt-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Captions className="size-4" aria-hidden />
            Legendas (.vtt)
          </p>
          {(["pt", "en"] as const).map((lang) => (
            <SubtitleRow
              key={lang}
              dishId={dishId}
              kind={kind}
              lang={lang}
              url={video?.subtitles[lang]}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SubtitleRow({
  dishId,
  kind,
  lang,
  url,
}: {
  dishId: string;
  kind: Kind;
  lang: "pt" | "en";
  url?: string;
}) {
  const router = useRouter();
  const inputId = useId();
  const [isUploading, setIsUploading] = useState(false);

  async function upload(file: File) {
    setIsUploading(true);
    const path = `subtitles/${dishId}-${kind}-${lang}-${Date.now()}.vtt`;
    const storage = createClient().storage.from("media");
    const { error } = await storage.upload(path, file, {
      contentType: "text/vtt",
    });
    if (error) {
      setIsUploading(false);
      return void toast.error(`Falha no upload: ${error.message}`);
    }
    const result = await setSubtitle(
      dishId,
      kind,
      lang,
      storage.getPublicUrl(path).data.publicUrl,
    );
    setIsUploading(false);
    if (!result.ok) return void toast.error(result.error);
    toast.success(
      result.data.syncedToMux
        ? "Legenda salva e enviada ao Mux."
        : "Legenda salva. Vai para o Mux quando o vídeo estiver pronto.",
    );
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="w-8 font-medium uppercase">{lang}</span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex-1 truncate text-muted-foreground hover:underline"
        >
          {url.split("/").pop()}
        </a>
      ) : (
        <span className="flex-1 text-muted-foreground">Nenhuma</span>
      )}
      <Button asChild variant="ghost" size="sm" disabled={isUploading}>
        <label htmlFor={inputId} className="cursor-pointer">
          {isUploading && <Loader2 className="animate-spin" aria-hidden />}
          {url ? "Trocar" : "Enviar"}
        </label>
      </Button>
      <input
        id={inputId}
        type="file"
        accept=".vtt,text/vtt"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
