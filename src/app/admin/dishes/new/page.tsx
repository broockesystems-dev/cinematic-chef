import { DishForm } from "@/components/admin/dish-form";
import { listLocations } from "@/lib/admin/queries";

export const metadata = { title: "Novo prato" };

export default async function NewDishPage() {
  const locations = await listLocations();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Novo prato</h1>
      <p className="text-muted-foreground">
        Salve os dados básicos primeiro; ingredientes, passos e vídeos ficam
        liberados em seguida.
      </p>
      <DishForm locations={locations} />
    </div>
  );
}
