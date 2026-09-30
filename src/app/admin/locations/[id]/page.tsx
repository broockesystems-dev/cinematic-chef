import { notFound } from "next/navigation";
import { LocationForm } from "@/components/admin/location-form";
import { listLocations } from "@/lib/admin/queries";

export const metadata = { title: "Editar lugar" };

export default async function EditLocationPage({
  params,
}: PageProps<"/admin/locations/[id]">) {
  const { id } = await params;
  const locations = await listLocations();
  const location = locations.find((l) => l.id === id);
  if (!location) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">
        {location.name.pt}
      </h1>
      <LocationForm locations={locations} location={location} />
    </div>
  );
}
