import { notFound } from "next/navigation";
import { BundleForm } from "@/components/admin/bundle-form";
import { listDishes } from "@/lib/admin/queries";
import { listBundles } from "@/lib/bundles";

export const metadata = { title: "Editar roteiro" };

export default async function EditBundlePage({
  params,
}: PageProps<"/admin/bundles/[id]">) {
  const { id } = await params;
  const [bundles, dishes] = await Promise.all([listBundles(), listDishes()]);
  const bundle = bundles.find((b) => b.id === id);
  if (!bundle) notFound();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">{bundle.name.pt}</h1>
      <BundleForm dishes={dishes} bundle={bundle} />
    </div>
  );
}
