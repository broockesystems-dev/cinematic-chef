import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DishForm } from "@/components/admin/dish-form";
import { DishStatusBadge } from "@/components/admin/dish-status-badge";
import { IngredientsEditor } from "@/components/admin/ingredients-editor";
import { StepsEditor } from "@/components/admin/steps-editor";
import { VideoPanel } from "@/components/admin/video-panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDishWithRecipe, listLocations } from "@/lib/admin/queries";
import { isMuxConfigured } from "@/lib/mux";

export const metadata = { title: "Editar prato" };

export default async function EditDishPage({
  params,
}: PageProps<"/admin/dishes/[id]">) {
  const { id } = await params;
  const [data, locations] = await Promise.all([
    getDishWithRecipe(id),
    listLocations(),
  ]);
  if (!data) notFound();
  const { dish, ingredients, steps, videos } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-semibold">{dish.name.pt}</h1>
        <DishStatusBadge status={dish.status} publishedAt={dish.published_at} />
        <Button asChild variant="ghost" size="sm" className="ml-auto">
          <Link href={`/pt/dish/${dish.slug}`} target="_blank">
            <ExternalLink aria-hidden />
            Ver no site
          </Link>
        </Button>
      </div>
      <Tabs defaultValue="details">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="ingredients">
            Ingredientes ({ingredients.length})
          </TabsTrigger>
          <TabsTrigger value="steps">Passos ({steps.length})</TabsTrigger>
          <TabsTrigger value="videos">Vídeos</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="pt-6">
          <DishForm locations={locations} dish={dish} />
        </TabsContent>
        <TabsContent value="ingredients" className="pt-6">
          <IngredientsEditor dishId={dish.id} ingredients={ingredients} />
        </TabsContent>
        <TabsContent value="steps" className="pt-6">
          <StepsEditor dishId={dish.id} steps={steps} />
        </TabsContent>
        <TabsContent value="videos" className="pt-6">
          <VideoPanel
            dishId={dish.id}
            videos={videos}
            muxConfigured={isMuxConfigured()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
