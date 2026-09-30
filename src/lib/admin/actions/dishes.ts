"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { getMux, isMuxConfigured } from "@/lib/mux";
import { createClient } from "@/lib/supabase/server";
import {
  check,
  checkRow,
  runAction,
  type ActionResult,
} from "../action-result";
import {
  DishSchema,
  IngredientListSchema,
  StepListSchema,
  type DishInput,
  type IngredientInput,
  type StepInput,
} from "../schemas";

export async function saveDish(
  id: string | null,
  input: DishInput,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await assertAdmin();
    const values = DishSchema.parse(input);
    const supabase = await createClient();

    const row = id
      ? checkRow(
          await supabase
            .from("dishes")
            .update(values)
            .eq("id", id)
            .select("id")
            .single(),
        )
      : checkRow(
          await supabase.from("dishes").insert(values).select("id").single(),
        );

    revalidatePath("/", "layout");
    return { id: row.id };
  });
}

export async function deleteDish(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    const supabase = await createClient();
    const videos = checkRow(
      await supabase.from("videos").select("mux_asset_id").eq("dish_id", id),
    );
    check(await supabase.from("dishes").delete().eq("id", id));

    // Best effort: don't keep paying Mux storage for a deleted dish.
    if (isMuxConfigured()) {
      const mux = getMux();
      await Promise.allSettled(
        videos.flatMap((v) =>
          v.mux_asset_id ? [mux.video.assets.delete(v.mux_asset_id)] : [],
        ),
      );
    }
    revalidatePath("/", "layout");
    return null;
  });
}

export async function saveIngredients(
  dishId: string,
  items: IngredientInput[],
): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    const values = IngredientListSchema.parse(items);
    const supabase = await createClient();
    check(
      await supabase.rpc("admin_replace_ingredients", {
        p_dish_id: dishId,
        p_items: values,
      }),
    );
    revalidatePath("/", "layout");
    return null;
  });
}

export async function saveSteps(
  dishId: string,
  items: StepInput[],
): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    const values = StepListSchema.parse(items);
    const supabase = await createClient();
    check(
      await supabase.rpc("admin_replace_steps", {
        p_dish_id: dishId,
        p_items: values,
      }),
    );
    revalidatePath("/", "layout");
    return null;
  });
}
