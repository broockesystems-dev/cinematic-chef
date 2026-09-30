"use client";

import { Loader2, Lock, MapPin, Search, UtensilsCrossed } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import type { SearchResult } from "@/lib/explore";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 200;
const MIN_QUERY = 2;

/** Combobox search over dishes and places (WAI-ARIA combobox pattern). */
export function SearchBox() {
  const t = useTranslations("Explore");
  const locale = useLocale();
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);

  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < MIN_QUERY) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: trimmed, locale });
        const response = await fetch(`/api/search?${params}`, {
          signal: controller.signal,
        });
        const body = await response.json();
        setResults(body.results ?? []);
        setActive(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, locale]);

  const visible = trimmed.length >= MIN_QUERY ? results : null;
  const expanded = open && visible !== null;

  function go(result: SearchResult) {
    setOpen(false);
    setQuery("");
    setResults(null);
    inputRef.current?.blur();
    router.push(result.href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!visible?.length) {
      if (event.key === "Escape") setQuery("");
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % visible.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i <= 0 ? visible.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(visible[Math.max(active, 0)]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-label={t("searchLabel")}
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        placeholder={t("searchPlaceholder")}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="h-11 pl-9 text-base"
        autoComplete="off"
      />
      {loading && (
        <Loader2
          className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
          aria-label={t("searching")}
        />
      )}
      <ul
        id={listId}
        role="listbox"
        aria-label={t("searchLabel")}
        hidden={!expanded}
        className="absolute inset-x-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-lg border bg-popover p-1 shadow-xl"
      >
        {visible?.length === 0 && (
          <li
            role="presentation"
            className="px-3 py-2 text-sm text-muted-foreground"
          >
            {t("noResults", { query: trimmed })}
          </li>
        )}
        {visible?.map((result, index) => (
          <li
            key={`${result.kind}-${result.id}`}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === active}
            // mousedown fires before the input's blur closes the list.
            onMouseDown={(e) => {
              e.preventDefault();
              go(result);
            }}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2",
              index === active && "bg-accent",
            )}
          >
            {result.kind === "dish" ? (
              <UtensilsCrossed
                className="size-4 shrink-0 text-primary"
                aria-hidden
              />
            ) : (
              <MapPin
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate">{result.name}</span>
              {result.context && (
                <span className="block truncate text-xs text-muted-foreground">
                  {result.context}
                </span>
              )}
            </span>
            {result.access === "premium" && (
              <Lock className="size-3.5 shrink-0 text-premium" aria-hidden />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
