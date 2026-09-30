"use client";

import { ChevronUp } from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  resolveSlugPath,
  type ExploreLocation,
  type GlobePin,
} from "@/lib/explore";
import { localize } from "@/lib/i18n-text";
import { cn } from "@/lib/utils";
import type { GlobeFocus } from "./globe";
import { GlobeBoundary } from "./globe-boundary";
import { SearchBox } from "./search-box";

// three.js is large: load it only in the browser, after the page is usable.
const GlobeView = dynamic(() => import("./globe"), {
  ssr: false,
  loading: () => <GlobePlaceholder />,
});

const ALTITUDE: Record<ExploreLocation["type"], number> = {
  continent: 1.6,
  country: 0.9,
  city: 0.45,
  neighborhood: 0.3,
};
const MOBILE_PIN_LIMIT = 40;

type Props = {
  locations: ExploreLocation[];
  pins: GlobePin[];
  children: React.ReactNode;
};

export function ExploreShell({ locations, pins, children }: Props) {
  const t = useTranslations("Explore");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  const isMobile = useMediaQuery("(max-width: 1023px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const webgl = useSyncExternalStore(noop, hasWebGL, () => true);
  const saveData = useSyncExternalStore(noop, prefersSaveData, () => false);
  const globeReady = useIdle();

  const slugKey = pathname.startsWith("/explore/")
    ? pathname.slice("/explore/".length)
    : "";
  const chain = useMemo(
    () => resolveSlugPath(slugKey.split("/").filter(Boolean), locations) ?? [],
    [slugKey, locations],
  );
  const current = chain.at(-1);
  const focus: GlobeFocus = useMemo(
    () =>
      current
        ? {
            lat: current.lat,
            lng: current.lng,
            altitude: ALTITUDE[current.type],
          }
        : null,
    [current],
  );

  const visiblePins = useMemo(
    () =>
      isMobile
        ? [...pins]
            .sort((a, b) => b.dishCount - a.dishCount)
            .slice(0, MOBILE_PIN_LIMIT)
        : pins,
    [pins, isMobile],
  );

  return (
    <div className="relative h-[calc(100dvh-3.5rem)] overflow-hidden lg:grid lg:grid-cols-[1fr_26rem]">
      <div
        className="absolute inset-x-0 top-0 bottom-[38%] lg:relative lg:inset-auto lg:h-full"
        aria-hidden
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.3_0.05_250/0.35),transparent_65%)]" />
        {!globeReady ? (
          <GlobePlaceholder />
        ) : webgl && !saveData ? (
          <GlobeBoundary
            fallback={<GlobeUnavailable message={t("globeUnavailable")} />}
          >
            <GlobeView
              pins={visiblePins}
              focus={focus}
              autoRotate={!current}
              lite={isMobile}
              reducedMotion={reducedMotion}
              pinName={(pin) => localize(pin.name, locale).text}
              pinLabel={(pin) =>
                t("pinLabel", {
                  place: localize(pin.name, locale).text,
                  count: pin.dishCount,
                })
              }
              onPinClick={(pin) => {
                setExpanded(false);
                router.push(`/explore/${pin.path.join("/")}`);
              }}
            />
          </GlobeBoundary>
        ) : (
          <GlobeUnavailable message={t("globeUnavailable")} />
        )}
      </div>

      <aside
        aria-label={t("title")}
        className={cn(
          // Phone: bottom sheet over the globe. Desktop: side panel.
          "absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-2xl border-t bg-background/95 shadow-2xl backdrop-blur transition-[max-height] duration-300",
          expanded ? "max-h-[85%]" : "max-h-[45%]",
          "lg:relative lg:inset-auto lg:max-h-none lg:rounded-none lg:border-t-0 lg:border-l lg:shadow-none",
        )}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? t("collapsePanel") : t("expandPanel")}
          className="flex justify-center py-2 lg:hidden"
        >
          <ChevronUp
            className={cn(
              "size-5 text-muted-foreground transition-transform",
              expanded && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        <div className="px-4 pb-3 lg:pt-4">
          <SearchBox />
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6">{children}</div>
      </aside>
    </div>
  );
}

/** True once the browser is idle, so the panel is interactive before three.js loads. */
function useIdle(): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (!("requestIdleCallback" in window)) {
      const timer = setTimeout(() => setIdle(true), 300);
      return () => clearTimeout(timer);
    }
    const handle = requestIdleCallback(() => setIdle(true), { timeout: 2000 });
    return () => cancelIdleCallback(handle);
  }, []);
  return idle;
}

function prefersSaveData(): boolean {
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  return connection?.saveData === true;
}

function noop() {
  return () => {};
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function GlobePlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="aspect-square w-[min(70%,32rem)] animate-pulse rounded-full bg-[radial-gradient(circle_at_35%_35%,oklch(0.35_0.06_240),oklch(0.16_0.02_250)_70%)]" />
    </div>
  );
}

function GlobeUnavailable({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 flex items-start justify-center p-8 lg:items-center">
      <p className="max-w-xs text-center text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
