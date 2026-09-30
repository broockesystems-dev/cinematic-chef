"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  check,
  checkRow,
  runAction,
  type ActionResult,
} from "../action-result";
import { LocationSchema, type LocationInput } from "../schemas";

export async function saveLocation(
  id: string | null,
  input: LocationInput,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await assertAdmin();
    const values = LocationSchema.parse(input);
    const supabase = await createClient();

    const row = id
      ? checkRow(
          await supabase
            .from("locations")
            .update(values)
            .eq("id", id)
            .select("id")
            .single(),
        )
      : checkRow(
          await supabase.from("locations").insert(values).select("id").single(),
        );

    revalidatePath("/", "layout");
    return { id: row.id };
  });
}

export async function deleteLocation(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    const supabase = await createClient();
    check(await supabase.from("locations").delete().eq("id", id));
    revalidatePath("/", "layout");
    return null;
  });
}
