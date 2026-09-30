"use client";

import MuxPlayer from "@mux/mux-player-react/lazy";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PlaybackTokens } from "@/lib/video";

type Video = { playbackId: string; tokens?: PlaybackTokens };

type Props = {
  dishId: string;
  dishName: string;
  teaser: Video | null;
  full: Video | null;
};

/** Teaser for everyone; the full video only arrives here when access was granted server-side. */
export function DishVideo({ dishId, dishName, teaser, full }: Props) {
  const t = useTranslations("Dish");
  const title = t("videoTitle", { dish: dishName });

  if (full && teaser) {
    return (
      <Tabs defaultValue="full">
        <TabsList>
          <TabsTrigger value="full">{t("fullVideo")}</TabsTrigger>
          <TabsTrigger value="teaser">{t("teaser")}</TabsTrigger>
        </TabsList>
        <TabsContent value="full" className="pt-3">
          <SignedPlayer dishId={dishId} video={full} title={title} />
        </TabsContent>
        <TabsContent value="teaser" className="pt-3">
          <Player playbackId={teaser.playbackId} title={title} />
        </TabsContent>
      </Tabs>
    );
  }
  if (full) return <SignedPlayer dishId={dishId} video={full} title={title} />;
  if (teaser) return <Player playbackId={teaser.playbackId} title={title} />;
  return null;
}

function Player({
  playbackId,
  title,
  tokens,
  onError,
}: {
  playbackId: string;
  title: string;
  tokens?: PlaybackTokens;
  onError?: () => void;
}) {
  return (
    <MuxPlayer
      playbackId={playbackId}
      tokens={tokens}
      streamType="on-demand"
      title={title}
      metadataVideoTitle={title}
      accentColor="#f0a44b"
      loading="viewport"
      // No analytics cookies: keeps the player LGPD-friendly without a consent banner.
      disableCookies
      className="aspect-video w-full overflow-hidden rounded-lg"
      onError={onError}
    />
  );
}

/** Signed tokens expire after an hour; fetch fresh ones once if playback fails. */
function SignedPlayer({
  dishId,
  video,
  title,
}: {
  dishId: string;
  video: Video;
  title: string;
}) {
  const [tokens, setTokens] = useState(video.tokens);
  const [refreshed, setRefreshed] = useState(false);

  async function refreshTokens() {
    if (refreshed) return;
    setRefreshed(true);
    const response = await fetch("/api/video-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dishId }),
    });
    if (response.ok) setTokens((await response.json()).tokens);
  }

  return (
    <Player
      playbackId={video.playbackId}
      title={title}
      tokens={tokens}
      onError={refreshTokens}
    />
  );
}
