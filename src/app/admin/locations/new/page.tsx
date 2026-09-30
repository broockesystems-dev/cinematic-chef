import { LocationForm } from "@/components/admin/location-form";
import { listLocations } from "@/lib/admin/queries";

export const metadata = { title: "Novo lugar" };

export default async function NewLocationPage({
  searchParams,
}: PageProps<"/admin/locations/new">) {
  const { parent } = await searchParams;
  const locations = await listLocations();
  const parentRow = locations.find((l) => l.id === parent);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Novo lugar</h1>
      <LocationForm locations={locations} parent={parentRow ?? null} />
    </div>
  );
}
