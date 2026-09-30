import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listBundles } from "@/lib/bundles";
import { formatPrice } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Roteiros" };

export default async function BundlesPage() {
  const supabase = await createClient();
  const [bundles, { data: purchases }] = await Promise.all([
    listBundles(),
    supabase.from("purchases").select("bundle_id"),
  ]);
  const sold = new Map<string, number>();
  for (const p of purchases ?? [])
    sold.set(p.bundle_id, (sold.get(p.bundle_id) ?? 0) + 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">Roteiros</h1>
        <Button asChild>
          <Link href="/admin/bundles/new">Novo roteiro</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Roteiro</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Vendas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bundles.map((bundle) => (
            <TableRow key={bundle.id}>
              <TableCell>
                <Link
                  href={`/admin/bundles/${bundle.id}`}
                  className="font-medium hover:underline"
                >
                  {bundle.name.pt}
                </Link>
                <span className="ml-2 text-xs text-muted-foreground">
                  {bundle.dishIds.length} pratos
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatPrice(bundle.priceBrl, "BRL", "pt")} ·{" "}
                {formatPrice(bundle.priceUsd, "USD", "pt")}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    bundle.status === "published" ? "default" : "outline"
                  }
                >
                  {bundle.status === "published" ? "Publicado" : "Rascunho"}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {sold.get(bundle.id) ?? 0}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {bundles.length === 0 && (
        <p className="text-muted-foreground">Nenhum roteiro ainda.</p>
      )}
    </div>
  );
}
