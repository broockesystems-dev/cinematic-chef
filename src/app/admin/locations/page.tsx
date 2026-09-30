import Link from "next/link";
import { LOCATION_TYPE_LABELS } from "@/components/admin/labels";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listDishes, listLocations } from "@/lib/admin/queries";
import { flattenTree } from "@/lib/locations";

export const metadata = { title: "Lugares" };

export default async function LocationsPage() {
  const [locations, dishes] = await Promise.all([
    listLocations(),
    listDishes(),
  ]);
  const dishCount = new Map<string, number>();
  for (const dish of dishes) {
    dishCount.set(dish.location_id, (dishCount.get(dish.location_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">Lugares</h1>
        <Button asChild>
          <Link href="/admin/locations/new">Novo lugar</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="hidden sm:table-cell">Slug</TableHead>
            <TableHead className="text-right">Pratos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flattenTree(locations).map(({ location, depth }) => (
            <TableRow key={location.id}>
              <TableCell>
                <Link
                  href={`/admin/locations/${location.id}`}
                  className="hover:underline"
                  style={{ paddingLeft: `${depth * 1.25}rem` }}
                >
                  {location.name.pt}
                  {location.iso_code && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {location.iso_code}
                    </span>
                  )}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {LOCATION_TYPE_LABELS[location.type]}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {location.slug}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {dishCount.get(location.id) ?? 0}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {locations.length === 0 && (
        <p className="text-muted-foreground">Nenhum lugar cadastrado ainda.</p>
      )}
    </div>
  );
}
