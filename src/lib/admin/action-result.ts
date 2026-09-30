import "server-only";
import { z } from "zod";
import { ForbiddenError } from "@/lib/auth";

export type ActionResult<T = null> =
  { ok: true; data: T } | { ok: false; error: string };

type PostgrestLikeError = { code?: string; message: string };

export class DbError extends Error {
  constructor(public readonly cause: PostgrestLikeError) {
    super(cause.message);
  }
}

/** Throws a DbError when a Supabase call failed; `data` may still be null. */
export function check<T>(result: {
  data: T;
  error: PostgrestLikeError | null;
}): T {
  if (result.error) throw new DbError(result.error);
  return result.data;
}

/** Like `check`, for calls that must return data (lists, `.single()`). */
export function checkRow<
  R extends { data: unknown; error: PostgrestLikeError | null },
>(result: R): NonNullable<R["data"]> {
  if (result.error) throw new DbError(result.error);
  if (result.data == null)
    throw new DbError({ message: "Registro não encontrado." });
  return result.data as NonNullable<R["data"]>;
}

const DB_MESSAGES: Record<string, string> = {
  "23505": "Já existe um registro com esse slug.",
  "23503": "Não dá para apagar: existem lugares ou pratos ligados a este item.",
  "42501": "Sem permissão para esta ação.",
};

/** Runs an admin mutation and turns any failure into a readable message. */
export async function runAction<T>(
  fn: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { ok: false, error: DB_MESSAGES["42501"] };
    }
    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      return {
        ok: false,
        error: `${issue.path.join(".") || "Dados"}: ${issue.message}`,
      };
    }
    if (error instanceof DbError) {
      const known = error.cause.code && DB_MESSAGES[error.cause.code];
      return { ok: false, error: known || error.message };
    }
    console.error("admin action failed", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro inesperado.",
    };
  }
}
