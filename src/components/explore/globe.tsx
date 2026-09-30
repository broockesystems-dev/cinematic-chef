"use client";

import { useEffect, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import type { GlobePin } from "@/lib/explore";

export type GlobeFocus = { lat: number; lng: number; altitude: number } | null;

type Props = {
  pins: GlobePin[];
  focus: GlobeFocus;
  /** Slow auto-rotation, only on the world view. */
  autoRotate: boolean;
  /** Phones and low-end devices: smaller texture, lower pixel ratio. */
  lite: boolean;
  reducedMotion: boolean;
  pinLabel: (pin: GlobePin) => string;
  pinName: (pin: GlobePin) => string;
  onPinClick: (pin: GlobePin) => void;
};

const WORLD_VIEW = { lat: 20, lng: 10 };
const RESUME_ROTATION_MS = 8000;
const FLY_MS = 1500;

export default function GlobeView({
  pins,
  focus,
  autoRotate,
  lite,
  reducedMotion,
  pinLabel,
  pinName,
  onPinClick,
}: Props) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const [ready, setReady] = useState(false);
  // Pin callbacks are captured by DOM elements created once; keep them fresh.
  const handlers = useRef({ onPinClick, pinLabel, pinName });
  useEffect(() => {
    handlers.current = { onPinClick, pinLabel, pinName };
  });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // One-time renderer and controls setup.
  useEffect(() => {
    const globe = globeRef.current;
    if (!ready || !globe) return;
    globe
      .renderer()
      .setPixelRatio(Math.min(window.devicePixelRatio, lite ? 1.5 : 2));
    const controls = globe.controls();
    controls.enableDamping = true;
    controls.minDistance = 115;
    controls.maxDistance = 500;
    controls.autoRotateSpeed = 0.35;
  }, [ready, lite]);

  // Auto-rotate on the world view, pausing while the user interacts.
  useEffect(() => {
    const globe = globeRef.current;
    if (!ready || !globe) return;
    const controls = globe.controls();
    const enabled = autoRotate && !reducedMotion;
    controls.autoRotate = enabled;
    if (!enabled) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const onStart = () => {
      clearTimeout(timer);
      controls.autoRotate = false;
    };
    const onEnd = () => {
      timer = setTimeout(
        () => (controls.autoRotate = true),
        RESUME_ROTATION_MS,
      );
    };
    controls.addEventListener("start", onStart);
    controls.addEventListener("end", onEnd);
    return () => {
      clearTimeout(timer);
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end", onEnd);
    };
  }, [ready, autoRotate, reducedMotion]);

  // Fly to the selected place (or back out to the world view).
  useEffect(() => {
    const globe = globeRef.current;
    if (!ready || !globe) return;
    const target = focus ?? { ...WORLD_VIEW, altitude: lite ? 2.4 : 2.2 };
    globe.pointOfView(target, reducedMotion ? 0 : FLY_MS);
  }, [ready, focus, lite, reducedMotion]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {size && (
        <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={lite ? "/globe/earth-2k.webp" : "/globe/earth-4k.webp"}
          bumpImageUrl={lite ? undefined : "/globe/bump-2k.webp"}
          showAtmosphere
          atmosphereColor="#9cc3ff"
          atmosphereAltitude={0.16}
          rendererConfig={{
            antialias: !lite,
            powerPreference: lite ? "low-power" : "high-performance",
          }}
          onGlobeReady={() => setReady(true)}
          htmlElementsData={pins}
          htmlAltitude={0.01}
          htmlTransitionDuration={0}
          htmlElement={(d) => createPinElement(d as GlobePin, handlers)}
          htmlElementVisibilityModifier={(el, isVisible) => {
            // Hide pins on the far side of the globe.
            el.style.opacity = isVisible ? "1" : "0";
            el.style.pointerEvents = isVisible ? "auto" : "none";
          }}
        />
      )}
    </div>
  );
}

function createPinElement(
  pin: GlobePin,
  handlers: React.RefObject<Pick<Props, "onPinClick" | "pinLabel" | "pinName">>,
): HTMLElement {
  const button = document.createElement("button");
  button.type = "button";
  // The panel list is the keyboard/screen-reader path; pins are for pointer users.
  button.tabIndex = -1;
  button.setAttribute("aria-label", handlers.current.pinLabel(pin));
  button.className = "globe-pin";
  button.innerHTML = `<span class="globe-pin-dot"></span><span class="globe-pin-label"></span>`;
  (button.querySelector(".globe-pin-label") as HTMLElement).textContent =
    `${handlers.current.pinName(pin)} · ${pin.dishCount}`;
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    handlers.current.onPinClick(pin);
  });
  return button;
}
