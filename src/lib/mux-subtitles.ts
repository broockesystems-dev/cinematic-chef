import "server-only";
import { getMux } from "@/lib/mux";

const LANGUAGE_NAMES = { pt: "Português", en: "English" } as const;

/**
 * Replaces the asset's text track for `lang` with the given .vtt file.
 * Returns false instead of throwing: Mux must be able to download the URL,
 * which fails for local (127.0.0.1) storage, and the URL stays saved in the
 * database so the webhook can retry once the asset is ready.
 */
export async function syncSubtitleTrack(
  assetId: string,
  lang: "pt" | "en",
  url: string,
): Promise<boolean> {
  if (!url.startsWith("https://")) return false;
  try {
    const mux = getMux();
    const asset = await mux.video.assets.retrieve(assetId);
    if (asset.status !== "ready") return false;

    const existing = (asset.tracks ?? []).filter(
      (track) => track.type === "text" && track.language_code === lang,
    );
    await Promise.all(
      existing.map((track) => mux.video.assets.deleteTrack(assetId, track.id!)),
    );
    await mux.video.assets.createTrack(assetId, {
      type: "text",
      text_type: "subtitles",
      language_code: lang,
      name: LANGUAGE_NAMES[lang],
      url,
      closed_captions: false,
    });
    return true;
  } catch (error) {
    console.error("subtitle sync failed", error);
    return false;
  }
}
