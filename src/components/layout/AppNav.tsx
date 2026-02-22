"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { LayoutDashboard, SlidersHorizontal, ClipboardList, Settings, Moon, Sun } from "@/components/ui/icons";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/simulator", label: "Simulateur", icon: SlidersHorizontal },
  { href: "/scenarios", label: "Scenarios", icon: ClipboardList },
  { href: "/settings", label: "Parametres", icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-gray-100 dark:border-slate-800 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Freelens" className="h-9 w-auto opacity-80 hidden dark:block" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-light.png" alt="Freelens" className="h-9 w-auto opacity-80 block dark:hidden" />
          <span className="text-lg font-bold text-gray-900 dark:text-white hidden sm:block">Freelens</span>
        </button>

        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                  )}
                >
                  <item.icon className="size-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="size-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Basculer le theme"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
