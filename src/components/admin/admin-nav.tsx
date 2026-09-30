"use client";

import { ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Painel" },
  { href: "/admin/locations", label: "Lugares" },
  { href: "/admin/dishes", label: "Pratos" },
  { href: "/admin/polls", label: "Votações" },
];

export function AdminNav({ email }: { email: string | null }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <header className="border-b bg-card/50">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/admin" className="font-display font-semibold">
          The Cinematic Chef{" "}
          <span className="text-muted-foreground">· Admin</span>
        </Link>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground",
                isActive(link.href) && "bg-accent text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="hidden text-muted-foreground md:inline">
            {email}
          </span>
          <Button asChild variant="ghost" size="sm">
            <Link href="/pt">
              <ExternalLink aria-hidden />
              Ver site
            </Link>
          </Button>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              <LogOut aria-hidden />
              Sair
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
