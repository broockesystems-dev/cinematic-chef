import { BundleForm } from "@/components/admin/bundle-form";
import { listDishes } from "@/lib/admin/queries";

export const metadata = { title: "Novo roteiro" };

export default async function NewBundlePage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Novo roteiro</h1>
      <BundleForm dishes={await listDishes()} />
    </div>
  );
}
