import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/auth";
import { fontVariables } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · The Cinematic Chef" },
  robots: { index: false, follow: false },
};

// Separate root layout: the admin panel is Portuguese-only and lives outside
// the /pt and /en routes. Every action and API route re-checks the role, and
// RLS enforces it in the database, so this guard is only the first line.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentUser();
  if (!user) redirect("/pt/login?next=/admin");
  if (user.role !== "admin") notFound();

  return (
    <html lang="pt-BR" className={`dark ${fontVariables} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <AdminNav email={user.email} />
        <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
        <Toaster richColors />
      </body>
    </html>
  );
}
