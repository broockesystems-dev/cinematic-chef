import Link from "next/link";
import {
  AccessBadge,
  DishStatusBadge,
} from "@/components/admin/dish-status-badge";
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
import { indexById, pathOf } from "@/lib/locations";

export const metadata = { title: "Pratos" };

export default async function DishesPage() {
  const [dishes, locations] = await Promise.all([
    listDishes(),
    listLocations(),
  ]);
  const byId = indexById(locations);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">Pratos</h1>
        <Button asChild>
          <Link href="/admin/dishes/new">Novo prato</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prato</TableHead>
            <TableHead className="hidden md:table-cell">Lugar</TableHead>
            <TableHead>Acesso</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dishes.map((dish) => (
            <TableRow key={dish.id}>
              <TableCell>
                <Link
                  href={`/admin/dishes/${dish.id}`}
                  className="font-medium hover:underline"
                >
                  {dish.name.pt}
                </Link>
                {!dish.name.en && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    sem EN
                  </span>
                )}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {pathOf(dish.location_id, byId)
                  .slice(1)
                  .map((l) => l.name.pt)
                  .join(" › ")}
              </TableCell>
              <TableCell>
                <AccessBadge access={dish.access} />
              </TableCell>
              <TableCell>
                <DishStatusBadge
                  status={dish.status}
                  publishedAt={dish.published_at}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {dishes.length === 0 && (
        <p className="text-muted-foreground">Nenhum prato ainda.</p>
      )}
    </div>
  );
}
