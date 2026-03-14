"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, SlidersHorizontal, ClipboardList, Target, BarChart3, CalendarDays, Sun, Moon, Scale, Briefcase, Landmark, BadgePercent, UserRound, CreditCard, Wallet, TrendingUp, Kanban, Building2, Receipt, HandCoins, Users, Gauge } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";
import { useProfileStore } from "@/stores/useProfileStore";
import { getUpcomingDeadlines } from "@/lib/fiscal-deadlines";
import { getEffectiveStatus, getTrialDaysRemaining } from "@/lib/subscription";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; pro?: boolean };
type NavSection = { label: string | null; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/radar", label: "Diagnostic", icon: Gauge, pro: true },
      { href: "/clients", label: "Mes clients", icon: Users },
    ],
  },
  {
    label: "Pilotage",
    items: [
      { href: "/paiements", label: "Paiements", icon: CreditCard, pro: true },
      { href: "/facturation", label: "Facturation", icon: Receipt, pro: true },
      { href: "/pipeline", label: "Leads", icon: Kanban, pro: true },
      { href: "/tresorerie", label: "Trésorerie", icon: Wallet, pro: true },
      { href: "/calendrier", label: "Calendrier", icon: CalendarDays, pro: true },
    ],
  },
  {
    label: "Analyse",
    items: [
      { href: "/comparateur", label: "Comparateur", icon: Scale, pro: true },
      { href: "/objectif", label: "Objectif", icon: Target },
      { href: "/benchmark", label: "Benchmark", icon: BarChart3, pro: true },
      { href: "/historique", label: "Historique", icon: TrendingUp, pro: true },
    ],
  },
  {
    label: "Projections",
    items: [
      { href: "/simulator", label: "Simulateur", icon: SlidersHorizontal, pro: true },
      { href: "/scenarios", label: "Scénarios", icon: ClipboardList },
      // { href: "/transition", label: "Transition", icon: Briefcase },
      // { href: "/acre", label: "ACRE", icon: BadgePercent, pro: true },
      // { href: "/retraite", label: "Retraite", icon: Landmark, pro: true },
      { href: "/holding", label: "Holding", icon: Building2, pro: true },
      { href: "/patrimoine", label: "Patrimoine", icon: HandCoins, pro: true },
    ],
  },
];

const NAV_MOBILE_TABS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/simulator", label: "Simulateur", icon: SlidersHorizontal },
  { href: "/paiements", label: "Paiements", icon: CreditCard },
];

const NAV_MOBILE_SECTIONS: NavSection[] = [
  {
    label: null,
    items: [
      { href: "/radar", label: "Diagnostic", icon: Gauge, pro: true },
      { href: "/clients", label: "Mes clients", icon: Users },
    ],
  },
  {
    label: "Pilotage",
    items: [
      { href: "/facturation", label: "Facturation", icon: Receipt, pro: true },
      { href: "/pipeline", label: "Leads", icon: Kanban, pro: true },
      { href: "/tresorerie", label: "Trésorerie", icon: Wallet, pro: true },
      { href: "/calendrier", label: "Calendrier", icon: CalendarDays, pro: true },
    ],
  },
  {
    label: "Analyse",
    items: [
      { href: "/comparateur", label: "Comparateur", icon: Scale, pro: true },
      { href: "/objectif", label: "Objectif", icon: Target },
      { href: "/benchmark", label: "Benchmark", icon: BarChart3, pro: true },
      { href: "/historique", label: "Historique", icon: TrendingUp, pro: true },
    ],
  },
  {
    label: "Projections",
    items: [
      { href: "/simulator", label: "Simulateur", icon: SlidersHorizontal, pro: true },
      { href: "/scenarios", label: "Scénarios", icon: ClipboardList },
      // { href: "/transition", label: "Transition", icon: Briefcase },
      // { href: "/acre", label: "ACRE", icon: BadgePercent, pro: true },
      // { href: "/retraite", label: "Retraite", icon: Landmark, pro: true },
      { href: "/holding", label: "Holding", icon: Building2, pro: true },
      { href: "/patrimoine", label: "Patrimoine", icon: HandCoins, pro: true },
    ],
  },
  {
    label: null,
    items: [
      { href: "/settings", label: "Mon profil", icon: UserRound },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const subscriptionStatus = useProfileStore((s) => s.subscriptionStatus);
  const trialEndsAt = useProfileStore((s) => s.trialEndsAt);
  const businessStatus = useProfileStore((s) => s.businessStatus);
  const effectiveStatus = getEffectiveStatus(subscriptionStatus, trialEndsAt);
  const isPro = effectiveStatus === "ACTIVE";
  const trialDays = getTrialDaysRemaining(trialEndsAt);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const upcomingDeadlines = mounted ? getUpcomingDeadlines(businessStatus, 7) : [];
  const hasUpcoming = upcomingDeadlines.length > 0;
  const showNewBadge = mounted && new Date() < new Date("2026-05-01");

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem("freelens-profile");
    localStorage.removeItem("freelens_scenarios");
    window.location.href = "/login";
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
          <img src="/logo.webp" alt="Freelens" className="h-9 w-auto opacity-80 hidden dark:block" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-light.webp" alt="Freelens" className="h-9 w-auto opacity-80 block dark:hidden" />
          <span className="text-lg font-bold text-foreground">Freelens</span>
        </button>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {NAV_SECTIONS.map((section, si) => (
            <div key={si} className={si > 0 ? "mt-1" : ""}>
              {section.label && (
                <div className="pt-3 pb-1 px-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">{section.label}</span>
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const showCalBadge = item.href === "/calendrier" && hasUpcoming;
                  const showNew = item.href === "/facturation" && showNewBadge;
                  return (
                    <button
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <span className="relative">
                        <item.icon className="size-[18px]" />
                        {showCalBadge && (
                          <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-[#f87171] ring-2 ring-sidebar" />
                        )}
                      </span>
                      <span>{item.label}</span>
                      {showNew ? (
                        <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#4ade80]/15 text-[#4ade80]">New</span>
                      ) : showCalBadge ? (
                        <span className="ml-auto text-[10px] font-bold text-[#f87171]">{upcomingDeadlines.length}</span>
                      ) : item.pro && !isPro ? (
                        <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">Pro</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-border space-y-2">
          <div className={cn("px-3 py-2 rounded-xl border", isPro ? "bg-primary/10 border-primary/20" : "bg-muted/50 border-border")}>
            <div className="text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">Plan</div>
            <div className={cn("text-sm font-semibold", isPro ? "text-primary" : "text-foreground")}>
              {trialDays > 0 && subscriptionStatus === "FREE"
                ? `Essai Pro — ${trialDays}j`
                : isPro ? "Pro" : "Free"}
            </div>
          </div>
          <button
            onClick={() => router.push("/settings")}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
              pathname === "/settings"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <UserRound className="size-[18px]" />
            <span>Mon profil</span>
          </button>
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

      {/* Mobile drawer overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-20"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "md:hidden fixed bottom-14 left-0 right-0 z-20 bg-sidebar/95 backdrop-blur-xl border-t border-border rounded-t-2xl transition-transform duration-200 ease-out",
          mobileMenuOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="px-4 pt-4 pb-3 max-h-[60vh] overflow-y-auto">
          <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-4" />
          {NAV_MOBILE_SECTIONS.map((section, si) => (
            <div key={si} className={si > 0 ? "mt-2" : ""}>
              {section.label && (
                <div className="px-1 pb-1.5 pt-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">{section.label}</span>
                </div>
              )}
              <div className="grid grid-cols-4 gap-2">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const showCalBadge = item.href === "/calendrier" && hasUpcoming;
                  const showNew = item.href === "/facturation" && showNewBadge;
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        router.push(item.href);
                        setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1 py-3 rounded-xl transition-colors",
                        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <span className="relative">
                        <item.icon className="size-5" />
                        {showCalBadge && (
                          <span className="absolute -top-1 -right-1 size-2 rounded-full bg-[#f87171] ring-2 ring-sidebar" />
                        )}
                        {showNew ? (
                          <span className="absolute -top-1.5 -right-3 text-[7px] font-bold uppercase text-[#4ade80]">New</span>
                        ) : item.pro && !isPro && !showCalBadge ? (
                          <span className="absolute -top-1 -right-2.5 text-[7px] font-bold uppercase text-primary">Pro</span>
                        ) : null}
                      </span>
                      <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Theme + logout */}
        <div className="flex items-center gap-2 px-4 pb-4 pt-2 border-t border-border mt-1">
          <button
            onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); setMobileMenuOpen(false); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            {mounted && (theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />)}
            <span>{mounted ? (theme === "dark" ? "Mode clair" : "Mode sombre") : "Thème"}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/[0.08] transition-colors"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar/90 backdrop-blur-xl border-t border-border z-20 flex items-center justify-around h-14 px-2">
        {NAV_MOBILE_TABS.map((item) => {
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
        {/* Plus button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
            mobileMenuOpen ? "text-primary" : "text-muted-foreground/60"
          )}
        >
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {mobileMenuOpen ? (
              <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
            ) : (
              <><circle cx="4" cy="4" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="4" r="1.5" fill="currentColor" stroke="none" /><circle cx="20" cy="4" r="1.5" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="20" cy="12" r="1.5" fill="currentColor" stroke="none" /></>
            )}
          </svg>
          <span className="text-[10px] font-medium">{mobileMenuOpen ? "Fermer" : "Plus"}</span>
        </button>
      </nav>
    </>
  );
}
