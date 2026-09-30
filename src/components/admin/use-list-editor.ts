"use client";

import { useCallback, useState } from "react";

type Keyed<T> = T & { key: string };

/** Local state for an ordered, editable list with stable React keys. */
export function useListEditor<T extends object>(initial: T[]) {
  const [items, setItems] = useState<Keyed<T>[]>(() =>
    initial.map((item) => ({ ...item, key: crypto.randomUUID() })),
  );
  const [isDirty, setIsDirty] = useState(false);

  const change = useCallback((next: (prev: Keyed<T>[]) => Keyed<T>[]) => {
    setItems(next);
    setIsDirty(true);
  }, []);

  return {
    items,
    isDirty,
    markSaved: () => setIsDirty(false),
    add: (item: T) =>
      change((prev) => [...prev, { ...item, key: crypto.randomUUID() }]),
    remove: (key: string) =>
      change((prev) => prev.filter((i) => i.key !== key)),
    update: (key: string, patch: Partial<T>) =>
      change((prev) =>
        prev.map((i) => (i.key === key ? { ...i, ...patch } : i)),
      ),
    move: (key: string, offset: -1 | 1) =>
      change((prev) => {
        const from = prev.findIndex((i) => i.key === key);
        const to = from + offset;
        if (from < 0 || to < 0 || to >= prev.length) return prev;
        const next = [...prev];
        [next[from], next[to]] = [next[to], next[from]];
        return next;
      }),
  };
}
