"use client";

import { useEffect, useRef } from "react";
import { useProfileStore, type SubscriptionStatus } from "@/stores/useProfileStore";
import { createClient } from "@/lib/supabase/client";
import type { ClientData, FreelanceProfile } from "@/types";
import { CLIENT_COLORS } from "@/lib/constants";

/**
 * Syncs profile + clients between Zustand (localStorage) and the database.
 * - On mount: fetches profile/clients from API and hydrates the store
 * - On store changes: debounce-saves profile back to API
 * - On client add/update/remove: syncs client to API
 *
 * Place this component inside the authenticated app layout.
 */
export function ProfileSync() {
  const hydrated = useRef(false);
  const profileSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    async function loadFromDb() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;

        const data = await res.json();

        const store = useProfileStore.getState();

        // Update subscription status from DB
        if (data.subscriptionStatus) {
          store.setSubscriptionStatus(data.subscriptionStatus as SubscriptionStatus);
        }

        // If the DB has clients, hydrate the store
        if (data.clients && data.clients.length > 0) {
          const dbClients: ClientData[] = data.clients.map(
            (c: Record<string, unknown>, i: number) => ({
              id: c.id as string,
              name: (c.name as string) ?? `Client ${i + 1}`,
              billing: (c.billing as string)?.toLowerCase() ?? "tjm",
              dailyRate: (c.dailyRate as number) ?? undefined,
              daysPerWeek: (c.daysPerWeek as number) ?? undefined,
              daysPerMonth: (c.daysPerMonth as number) ?? undefined,
              daysPerYear: (c.daysPerYear as number) ?? undefined,
              monthlyAmount: (c.monthlyAmount as number) ?? undefined,
              totalAmount: (c.totalAmount as number) ?? undefined,
              startMonth: (c.startMonth as number) ?? undefined,
              endMonth: (c.endMonth as number) ?? undefined,
              color: (c.color as string) ?? CLIENT_COLORS[i % CLIENT_COLORS.length],
            })
          );
          store.setClients(dbClients);
        }

        // Hydrate profile fields from DB (if set)
        const profileUpdates: Partial<FreelanceProfile> = {};
        if (data.monthlyExpenses != null) profileUpdates.monthlyExpenses = data.monthlyExpenses;
        if (data.savings != null) profileUpdates.savings = data.savings;
        if (data.adminHoursPerWeek != null) profileUpdates.adminHoursPerWeek = data.adminHoursPerWeek;
        if (data.workDaysPerWeek != null) profileUpdates.workDaysPerWeek = data.workDaysPerWeek;
        if (data.onboardingCompleted != null) store.setOnboardingCompleted(data.onboardingCompleted);

        if (Object.keys(profileUpdates).length > 0) {
          store.setProfile(profileUpdates);
        }
      } catch {
        // Silently fail — localStorage remains source of truth offline
      }
    }

    loadFromDb();
  }, []);

  // Subscribe to profile changes and debounce-sync to API
  useEffect(() => {
    const unsub = useProfileStore.subscribe((state, prevState) => {
      // Only sync profile fields (not clients — those are synced individually)
      const profileFields = [
        "monthlyExpenses",
        "savings",
        "adminHoursPerWeek",
        "workDaysPerWeek",
        "onboardingCompleted",
      ] as const;

      const changed = profileFields.some(
        (k) => state[k] !== prevState[k]
      );

      if (!changed) return;

      if (profileSaveTimer.current) clearTimeout(profileSaveTimer.current);
      profileSaveTimer.current = setTimeout(async () => {
        try {
          await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              monthlyExpenses: state.monthlyExpenses,
              savings: state.savings,
              adminHoursPerWeek: state.adminHoursPerWeek,
              workDaysPerWeek: state.workDaysPerWeek,
              onboardingCompleted: state.onboardingCompleted,
            }),
          });
        } catch {
          // Silently fail
        }
      }, 2000);
    });

    return () => unsub();
  }, []);

  // Subscribe to client changes and sync to API
  useEffect(() => {
    let prevClients = useProfileStore.getState().clients;

    const unsub = useProfileStore.subscribe((state) => {
      const curr = state.clients;
      if (curr === prevClients) return;

      // Detect added clients
      for (const c of curr) {
        if (!prevClients.find((p) => p.id === c.id)) {
          // New client — POST to API
          fetch("/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(c),
          }).catch(() => {});
        }
      }

      // Detect removed clients
      for (const p of prevClients) {
        if (!curr.find((c) => c.id === p.id)) {
          // Client removed — DELETE from API
          fetch(`/api/clients?id=${p.id}`, {
            method: "DELETE",
          }).catch(() => {});
        }
      }

      // Detect updated clients
      for (const c of curr) {
        const prev = prevClients.find((p) => p.id === c.id);
        if (prev && JSON.stringify(prev) !== JSON.stringify(c)) {
          // Client updated — PUT to API
          fetch("/api/clients", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(c),
          }).catch(() => {});
        }
      }

      prevClients = curr;
    });

    return () => unsub();
  }, []);

  return null;
}
