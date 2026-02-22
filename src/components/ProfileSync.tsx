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
  const syncing = useRef(true);
  const profileSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const clientsSnapshot = useRef(useProfileStore.getState().clients);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    async function loadFromDb() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        syncing.current = false;
        return;
      }

      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          syncing.current = false;
          return;
        }

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
        if (data.workedDaysPerYear != null) profileUpdates.workedDaysPerYear = data.workedDaysPerYear;
        if (data.businessStatus != null) profileUpdates.businessStatus = data.businessStatus;
        if (data.remunerationType != null) profileUpdates.remunerationType = data.remunerationType;
        if (data.customUrssafRate != null) profileUpdates.customUrssafRate = data.customUrssafRate;
        if (data.customIrRate != null) profileUpdates.customIrRate = data.customIrRate;
        if (data.customTaxRate != null) profileUpdates.customTaxRate = data.customTaxRate;
        if (data.monthlySalary != null) profileUpdates.monthlySalary = data.monthlySalary;
        if (data.mixtePartSalaire != null) profileUpdates.mixtePartSalaire = data.mixtePartSalaire;
        if (data.role != null) profileUpdates.role = data.role;
        if (data.age != null) profileUpdates.age = data.age;
        if (data.onboardingCompleted != null) store.setOnboardingCompleted(data.onboardingCompleted);

        if (Object.keys(profileUpdates).length > 0) {
          store.setProfile(profileUpdates);
        }
      } catch {
        // Silently fail — localStorage remains source of truth offline
      } finally {
        // Snapshot current clients so the subscriber doesn't re-POST hydrated data
        clientsSnapshot.current = useProfileStore.getState().clients;
        syncing.current = false;
      }
    }

    loadFromDb();
  }, []);

  // Subscribe to profile changes and debounce-sync to API
  useEffect(() => {
    const unsub = useProfileStore.subscribe((state, prevState) => {
      if (syncing.current) return;

      // Only sync profile fields (not clients — those are synced individually)
      const profileFields = [
        "monthlyExpenses",
        "savings",
        "adminHoursPerWeek",
        "workDaysPerWeek",
        "workedDaysPerYear",
        "businessStatus",
        "remunerationType",
        "customUrssafRate",
        "customIrRate",
        "customTaxRate",
        "monthlySalary",
        "mixtePartSalaire",
        "role",
        "age",
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
              workedDaysPerYear: state.workedDaysPerYear,
              businessStatus: state.businessStatus,
              remunerationType: state.remunerationType,
              customUrssafRate: state.customUrssafRate,
              customIrRate: state.customIrRate,
              customTaxRate: state.customTaxRate,
              monthlySalary: state.monthlySalary,
              mixtePartSalaire: state.mixtePartSalaire,
              role: state.role,
              age: state.age,
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
    const unsub = useProfileStore.subscribe((state) => {
      if (syncing.current) return;

      const curr = state.clients;
      const prev = clientsSnapshot.current;
      if (curr === prev) return;

      // Detect added clients
      for (const c of curr) {
        if (!prev.find((p) => p.id === c.id)) {
          fetch("/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(c),
          }).catch(() => {});
        }
      }

      // Detect removed clients
      for (const p of prev) {
        if (!curr.find((c) => c.id === p.id)) {
          fetch(`/api/clients?id=${p.id}`, {
            method: "DELETE",
          }).catch(() => {});
        }
      }

      // Detect updated clients
      for (const c of curr) {
        const p = prev.find((x) => x.id === c.id);
        if (p && JSON.stringify(p) !== JSON.stringify(c)) {
          fetch("/api/clients", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(c),
          }).catch(() => {});
        }
      }

      clientsSnapshot.current = curr;
    });

    return () => unsub();
  }, []);

  return null;
}
