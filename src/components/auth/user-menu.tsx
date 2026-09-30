"use client";

import type { User } from "@supabase/supabase-js";
import { LogOut, Shield, UserRound } from "lucide-react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname } from "@/i18n/navigation";
import { signOut } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";

/**
 * Reads the session in the browser so the header can stay static. The role
 * only toggles the admin link; the admin area checks it again on the server.
 */
export function UserMenu() {
  const t = useTranslations("Header");
  const pathname = usePathname();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) return setIsAdmin(false);
      supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()
        .then(({ data: profile }) => setIsAdmin(profile?.role === "admin"));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (user === undefined) return <div className="size-9" aria-hidden />;

  if (!user) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link href={{ pathname: "/login", query: { next: pathname } }}>
          {t("signIn")}
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("account")}>
          <UserRound aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuItem asChild>
            {/* next/link, not the i18n Link: /admin is outside the locale routes. */}
            <NextLink href="/admin">
              <Shield aria-hidden />
              {t("admin")}
            </NextLink>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => signOut()}>
          <LogOut aria-hidden />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
