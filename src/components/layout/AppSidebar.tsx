"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, SlidersHorizontal, ClipboardList, Scale, Target, ArrowLeftRight, BarChart3, Settings, Shield, CalendarDays, Landmark } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/simulator", label: "Simulateur", icon: SlidersHorizontal },
  { href: "/scenarios", label: "Scénarios", icon: ClipboardList },
  { href: "/comparateur", label: "Comparateur", icon: Scale },
  { href: "/objectif", label: "Objectif", icon: Target },
  { href: "/transition", label: "Transition", icon: ArrowLeftRight },
  { href: "/benchmark", label: "Benchmark", icon: BarChart3 },
  { href: "/acre", label: "ACRE", icon: Shield },
  { href: "/calendrier", label: "Calendrier", icon: CalendarDays },
  { href: "/retraite", label: "Retraite", icon: Landmark },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[220px] flex-col bg-[#0a0a14] border-r border-white/[0.06] z-20">
        {/* Logo */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2.5 px-5 h-16 shrink-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Freelens" className="h-9 w-auto opacity-80" />
          <span className="text-lg font-bold text-white">Freelens</span>
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
                    ? "bg-[#5682F2]/15 text-[#5682F2]"
                    : "text-[#8b8b9e] hover:text-white hover:bg-white/[0.04]"
                )}
              >
                <item.icon className="size-[18px]" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/[0.06] space-y-3">
          <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[11px] text-[#5a5a6e] uppercase tracking-wider mb-0.5">Plan</div>
            <div className="text-sm font-semibold text-white">Free</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium text-[#8b8b9e] hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-150"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a14]/90 backdrop-blur-xl border-t border-white/[0.06] z-20 flex items-center justify-around h-14 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                isActive ? "text-[#5682F2]" : "text-[#5a5a6e]"
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
