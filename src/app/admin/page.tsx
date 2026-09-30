import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/admin/queries";

export default async function AdminDashboard() {
  const stats = await getDashboardStats();
  const tiles = [
    { label: "Pratos publicados", value: stats.published },
    { label: "Agendados", value: stats.scheduled },
    { label: "Rascunhos", value: stats.drafts },
    { label: "Pratos só para assinantes", value: stats.premium },
    { label: "Lugares", value: stats.locations },
    { label: "Assinantes ativos", value: stats.subscribers },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">Painel</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/locations/new">Novo lugar</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/dishes/new">Novo prato</Link>
          </Button>
        </div>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <li key={tile.label}>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-normal text-muted-foreground">
                  {tile.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dd className="font-display text-4xl font-semibold tabular-nums">
                  {tile.value}
                </dd>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
