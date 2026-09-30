"use client";

import { useCallback, useSyncExternalStore } from "react";
import { defaultUnitSystem, type UnitSystem } from "@/lib/quantity";

const STORAGE_KEY = "unit-system";
const CHANGE_EVENT = "unit-system-change";

function read(): UnitSystem | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "metric" || value === "us" ? value : null;
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * Metric or US measures. Defaults by language (PT → metric, EN → US) and
 * remembers the visitor's choice in this browser only.
 */
export function useUnitSystem(
  locale: string,
): [UnitSystem, (next: UnitSystem) => void] {
  const fallback = defaultUnitSystem(locale);
  const stored = useSyncExternalStore(subscribe, read, () => null);

  const set = useCallback((next: UnitSystem) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the choice just won't persist.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [stored ?? fallback, set];
}
