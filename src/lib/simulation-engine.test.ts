import { describe, test, expect } from "vitest";
import { simulate, getClientMonthlyCA } from "./simulation-engine";
import type { ClientData, SimulationParams, FreelanceProfile } from "@/types";
import { DEFAULT_SIM, SEASONALITY } from "./constants";

// ─── FIXTURES ───

const tjmClient: ClientData = {
  id: "1",
  name: "Client TJM",
  billing: "tjm",
  dailyRate: 500,
  daysPerMonth: 10,
};

const forfaitClient: ClientData = {
  id: "2",
  name: "Client Forfait",
  billing: "forfait",
  monthlyAmount: 3000,
};

const missionClient: ClientData = {
  id: "3",
  name: "Client Mission",
  billing: "mission",
  totalAmount: 12000,
  startMonth: 2,
  endMonth: 5,
};

const defaultProfile: FreelanceProfile = {
  monthlyExpenses: 1800,
  savings: 10000,
  adminHoursPerWeek: 6,
  workDaysPerWeek: 5,
};

const defaultParams: SimulationParams = { ...DEFAULT_SIM };

// ─── getClientMonthlyCA ───

describe("getClientMonthlyCA", () => {
  test("TJM : CA = dailyRate * daysPerMonth * season", () => {
    const ca = getClientMonthlyCA(tjmClient, 0, SEASONALITY[0]);
    expect(ca).toBeCloseTo(500 * 10 * 0.88, 1);
  });

  test("TJM : CA sans saisonnalite (season=1)", () => {
    expect(getClientMonthlyCA(tjmClient, 0, 1)).toBe(5000);
  });

  test("Forfait : montant fixe, pas de saisonnalite", () => {
    const caJan = getClientMonthlyCA(forfaitClient, 0, SEASONALITY[0]);
    const caJul = getClientMonthlyCA(forfaitClient, 6, SEASONALITY[6]);
    expect(caJan).toBe(3000);
    expect(caJul).toBe(3000);
  });

  test("Mission : repartition uniforme sur la periode", () => {
    // 12000€ sur 4 mois (mars a juin) = 3000€/mois
    const ca = getClientMonthlyCA(missionClient, 3, SEASONALITY[3]);
    expect(ca).toBe(3000);
  });

  test("Mission : 0 en dehors de la periode", () => {
    expect(getClientMonthlyCA(missionClient, 0, SEASONALITY[0])).toBe(0);
    expect(getClientMonthlyCA(missionClient, 8, SEASONALITY[8])).toBe(0);
  });

  test("Client inactif retourne 0", () => {
    const inactive = { ...tjmClient, isActive: false };
    expect(getClientMonthlyCA(inactive, 0, 1)).toBe(0);
  });
});

// ─── simulate ───

describe("Moteur de simulation", () => {
  test("Sans simulation : before === after", () => {
    const result = simulate([tjmClient], defaultParams, defaultProfile);
    expect(result.before).toEqual(result.after);
    expect(result.before).toHaveLength(12);
  });

  test("TJM : vacances -> revenu tombe a 0", () => {
    const params = { ...defaultParams, vacationWeeks: 4.33 }; // ~1 mois
    const result = simulate([tjmClient], params, defaultProfile);
    // Premier mois complet de vacances -> 0
    expect(result.after[0]).toBe(0);
    // Les mois suivants devraient etre normaux
    expect(result.after[3]).toBeGreaterThan(0);
  });

  test("Forfait : vacances -> revenu continue", () => {
    const params = { ...defaultParams, vacationWeeks: 4.33 };
    const result = simulate([forfaitClient], params, defaultProfile);
    // Le forfait continue pendant les vacances
    expect(result.after[0]).toBe(3000);
    expect(result.after[1]).toBe(3000);
  });

  test("Mission : vacances -> revenu tombe a 0", () => {
    // Mission de mars a juin, vacances en mars
    const params = { ...defaultParams, vacationWeeks: 4.33 };
    const result = simulate([missionClient], params, defaultProfile);
    // Mois 0 (jan) : mission pas active = 0 de toute facon
    // Mois 2 (mars) : mission active mais vacances terminées
    expect(result.after[0]).toBe(0); // Pas de mission en jan
  });

  test("Variation tarifs : s'applique uniquement au TJM", () => {
    const params = { ...defaultParams, rateChange: 20 };
    const clients = [tjmClient, forfaitClient];
    const result = simulate(clients, params, defaultProfile);
    // TJM augmente de 20%, forfait inchange
    for (let i = 0; i < 12; i++) {
      const tjmBefore = getClientMonthlyCA(tjmClient, i, SEASONALITY[i]);
      const forfaitBefore = getClientMonthlyCA(forfaitClient, i, SEASONALITY[i]);
      const expectedAfter = tjmBefore * 1.2 + forfaitBefore;
      expect(result.after[i]).toBeCloseTo(expectedAfter, 1);
    }
  });

  test("Reduction jours/semaine : proportionnel TJM seulement", () => {
    const params = { ...defaultParams, workDaysPerWeek: 4 };
    const clients = [tjmClient, forfaitClient];
    const result = simulate(clients, params, defaultProfile);
    for (let i = 0; i < 12; i++) {
      const tjmBefore = getClientMonthlyCA(tjmClient, i, SEASONALITY[i]);
      const forfaitBefore = getClientMonthlyCA(forfaitClient, i, SEASONALITY[i]);
      const expectedAfter = tjmBefore * (4 / 5) + forfaitBefore;
      expect(result.after[i]).toBeCloseTo(expectedAfter, 1);
    }
  });

  test("Perte client : disparait de la projection", () => {
    const clients = [tjmClient, forfaitClient];
    const params = { ...defaultParams, lostClientIndex: 0 };
    const result = simulate(clients, params, defaultProfile);
    // Seul le forfait reste
    for (let i = 0; i < 12; i++) {
      expect(result.after[i]).toBe(3000);
    }
  });

  test("Nouveaux clients : montee progressive sur 3 mois", () => {
    const params = { ...defaultParams, newClients: 1 };
    const result = simulate([tjmClient], params, defaultProfile);
    // Mois 0 : 33% du CA moyen * saisonnalite
    const avgCA = 5000; // tjmClient base CA
    expect(result.after[0]).toBeCloseTo(
      result.before[0] + avgCA * (1 / 3) * SEASONALITY[0],
      1
    );
    // Mois 2 : 100%
    expect(result.after[2]).toBeCloseTo(
      result.before[2] + avgCA * 1 * SEASONALITY[2],
      1
    );
  });

  test("Saisonnalite : TJM affecte, Forfait non", () => {
    const result = simulate([tjmClient, forfaitClient], defaultParams, defaultProfile);
    // Juillet (index 6) : saisonnalite = 0.78
    const julCA = result.before[6];
    const tjmJul = 500 * 10 * 0.78;
    expect(julCA).toBeCloseTo(tjmJul + 3000, 1);
    // Forfait est toujours 3000
  });

  test("Edge case : 0 clients", () => {
    const result = simulate([], defaultParams, defaultProfile);
    expect(result.before.every((v) => v === 0)).toBe(true);
    expect(result.after.every((v) => v === 0)).toBe(true);
  });

  test("Edge case : 12 semaines vacances", () => {
    const params = { ...defaultParams, vacationWeeks: 12 };
    const result = simulate([tjmClient], params, defaultProfile);
    // ~2.77 mois de vacances, les premiers mois a 0
    expect(result.after[0]).toBe(0);
    expect(result.after[1]).toBe(0);
    // Total after < total before
    const totalBefore = result.before.reduce((a, b) => a + b, 0);
    const totalAfter = result.after.reduce((a, b) => a + b, 0);
    expect(totalAfter).toBeLessThan(totalBefore);
  });

  test("Combo : vacances + hausse tarifs + perte client", () => {
    const clients = [tjmClient, forfaitClient];
    const params: SimulationParams = {
      ...defaultParams,
      vacationWeeks: 2,
      rateChange: 10,
      lostClientIndex: 1, // perd le forfait
    };
    const result = simulate(clients, params, defaultProfile);
    // Seul le TJM reste, augmente de 10%, avec 2 semaines de vacances
    const totalAfter = result.after.reduce((a, b) => a + b, 0);
    // Sans le forfait (3000*12 = 36000) et avec +10% sur le TJM
    expect(totalAfter).toBeLessThan(
      result.before.reduce((a, b) => a + b, 0)
    );
    expect(totalAfter).toBeGreaterThan(0);
  });

  test("rateChangeAfter : s'applique a partir du mois 3", () => {
    const params = { ...defaultParams, rateChangeAfter: 15 };
    const result = simulate([tjmClient], params, defaultProfile);
    // Mois 0 et 1 : pas de changement
    expect(result.after[0]).toBeCloseTo(result.before[0], 1);
    expect(result.after[1]).toBeCloseTo(result.before[1], 1);
    // Mois 2+ : +15%
    expect(result.after[2]).toBeCloseTo(result.before[2] * 1.15, 1);
    expect(result.after[5]).toBeCloseTo(result.before[5] * 1.15, 1);
  });

  test("after ne contient jamais de valeurs negatives", () => {
    const params: SimulationParams = {
      ...defaultParams,
      vacationWeeks: 12,
      lostClientIndex: 0,
      rateChange: -30,
    };
    const result = simulate([tjmClient, forfaitClient], params, defaultProfile);
    expect(result.after.every((v) => v >= 0)).toBe(true);
  });
});
