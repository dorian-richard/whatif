"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, SlidersHorizontal, ClipboardList, Target, BarChart3, Settings, CalendarDays, Sun, Moon } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { useProfileStore } from "@/stores/useProfileStore";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/simulator", label: "Simulateur", icon: SlidersHorizontal },
  { href: "/scenarios", label: "Scénarios", icon: ClipboardList },
  { href: "/objectif", label: "Objectif", icon: Target },
  { href: "/benchmark", label: "Benchmark", icon: BarChart3 },
  { href: "/calendrier", label: "Calendrier", icon: CalendarDays },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const subscriptionStatus = useProfileStore((s) => s.subscriptionStatus);
  const isPro = subscriptionStatus === "ACTIVE";
  useEffect(() => setMounted(true), []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[220px] flex-col bg-sidebar border-r border-border z-20">
        {/* Logo */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2.5 px-5 h-16 shrink-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Freelens" className="h-9 w-auto opacity-80 hidden dark:block" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-light.png" alt="Freelens" className="h-9 w-auto opacity-80 block dark:hidden" />
          <span className="text-lg font-bold text-foreground">Freelens</span>
        </button>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="size-[18px]" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-border space-y-3">
          <div className={cn("px-3 py-2 rounded-xl border", isPro ? "bg-primary/10 border-primary/20" : "bg-muted/50 border-border")}>
            <div className="text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">Plan</div>
            <div className={cn("text-sm font-semibold", isPro ? "text-primary" : "text-foreground")}>{isPro ? "Pro" : "Free"}</div>
          </div>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
          >
            {mounted && (theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />)}
            {!mounted && <Sun className="size-[18px]" />}
            <span>{mounted ? (theme === "dark" ? "Mode clair" : "Mode sombre") : "Thème"}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-150"
          >
            <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar/90 backdrop-blur-xl border-t border-border z-20 flex items-center justify-around h-14 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground/60"
              )}
            >
              <item.icon className="size-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
