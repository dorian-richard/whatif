import { describe, test, expect } from "vitest";
import { simulate, getClientMonthlyCA, getClientBaseCA, JOURS_OUVRES, AVG_JOURS_OUVRES } from "./simulation-engine";
import type { ClientData, SimulationParams, FreelanceProfile } from "@/types";
import { DEFAULT_SIM, SEASONALITY } from "./constants";

// ─── FIXTURES ───

const tjmClient: ClientData = {
  id: "1",
  name: "Client TJM",
  billing: "tjm",
  dailyRate: 500,
  daysPerWeek: 5,
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
  businessStatus: "micro",
};

const defaultParams: SimulationParams = { ...DEFAULT_SIM };

// ─── JOURS_OUVRES ───

describe("Jours ouvres", () => {
  test("12 mois calcules", () => {
    expect(JOURS_OUVRES).toHaveLength(12);
  });

  test("chaque mois entre 19 et 23 jours", () => {
    JOURS_OUVRES.forEach((d) => {
      expect(d).toBeGreaterThanOrEqual(19);
      expect(d).toBeLessThanOrEqual(23);
    });
  });

  test("moyenne autour de 21-22", () => {
    expect(AVG_JOURS_OUVRES).toBeGreaterThan(20);
    expect(AVG_JOURS_OUVRES).toBeLessThan(23);
  });
});

// ─── getClientMonthlyCA ───

describe("getClientMonthlyCA", () => {
  test("TJM : CA = dailyRate * (daysPerWeek/5) * joursOuvres * season", () => {
    const ca = getClientMonthlyCA(tjmClient, 0, SEASONALITY[0]);
    const expected = 500 * (5 / 5) * JOURS_OUVRES[0] * SEASONALITY[0];
    expect(ca).toBeCloseTo(expected, 1);
  });

  test("TJM : CA sans saisonnalite (season=1)", () => {
    const ca = getClientMonthlyCA(tjmClient, 0, 1);
    expect(ca).toBe(500 * JOURS_OUVRES[0]);
  });

  test("TJM partiel : 2j/sem = 40% des jours ouvres", () => {
    const partTime: ClientData = { ...tjmClient, daysPerWeek: 2 };
    const ca = getClientMonthlyCA(partTime, 0, 1);
    expect(ca).toBeCloseTo(500 * (2 / 5) * JOURS_OUVRES[0], 1);
  });

  test("TJM : CA varie selon le mois (jours ouvres differents)", () => {
    const caJan = getClientMonthlyCA(tjmClient, 0, 1);
    const caFeb = getClientMonthlyCA(tjmClient, 1, 1);
    if (JOURS_OUVRES[0] !== JOURS_OUVRES[1]) {
      expect(caJan).not.toBe(caFeb);
    }
  });

  test("TJM legacy : daysPerMonth fallback si pas de daysPerWeek", () => {
    const legacy: ClientData = { id: "l", name: "Legacy", billing: "tjm", dailyRate: 500, daysPerMonth: 10 };
    const ca = getClientMonthlyCA(legacy, 0, 1);
    expect(ca).toBe(500 * 10);
  });

  test("Forfait : montant fixe, pas de saisonnalite", () => {
    const caJan = getClientMonthlyCA(forfaitClient, 0, SEASONALITY[0]);
    const caJul = getClientMonthlyCA(forfaitClient, 6, SEASONALITY[6]);
    expect(caJan).toBe(3000);
    expect(caJul).toBe(3000);
  });

  test("Mission : repartition uniforme sur la periode", () => {
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

// ─── getClientBaseCA ───

describe("getClientBaseCA", () => {
  test("TJM : utilise la moyenne des jours ouvres", () => {
    const base = getClientBaseCA(tjmClient);
    expect(base).toBeCloseTo(500 * AVG_JOURS_OUVRES, 1);
  });

  test("Forfait : retourne le montant mensuel", () => {
    expect(getClientBaseCA(forfaitClient)).toBe(3000);
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
    const params = { ...defaultParams, vacationWeeks: 4.33 };
    const result = simulate([tjmClient], params, defaultProfile);
    expect(result.after[0]).toBe(0);
    expect(result.after[3]).toBeGreaterThan(0);
  });

  test("Forfait : vacances -> revenu continue", () => {
    const params = { ...defaultParams, vacationWeeks: 4.33 };
    const result = simulate([forfaitClient], params, defaultProfile);
    expect(result.after[0]).toBe(3000);
    expect(result.after[1]).toBe(3000);
  });

  test("Mission : vacances -> revenu tombe a 0", () => {
    const params = { ...defaultParams, vacationWeeks: 4.33 };
    const result = simulate([missionClient], params, defaultProfile);
    expect(result.after[0]).toBe(0);
  });

  test("Variation tarifs : s'applique uniquement au TJM", () => {
    const params = { ...defaultParams, rateChange: 20 };
    const clients = [tjmClient, forfaitClient];
    const result = simulate(clients, params, defaultProfile);
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
    for (let i = 0; i < 12; i++) {
      expect(result.after[i]).toBe(3000);
    }
  });

  test("Nouveaux clients : montee progressive sur 3 mois", () => {
    const params = { ...defaultParams, newClients: 1 };
    const result = simulate([tjmClient], params, defaultProfile);
    const avgCA = getClientBaseCA(tjmClient);
    expect(result.after[0]).toBeCloseTo(
      result.before[0] + avgCA * (1 / 3) * SEASONALITY[0],
      1
    );
    expect(result.after[2]).toBeCloseTo(
      result.before[2] + avgCA * 1 * SEASONALITY[2],
      1
    );
  });

  test("Saisonnalite : TJM affecte, Forfait non", () => {
    const result = simulate([tjmClient, forfaitClient], defaultParams, defaultProfile);
    const julCA = result.before[6];
    const tjmJul = 500 * (5 / 5) * JOURS_OUVRES[6] * SEASONALITY[6];
    expect(julCA).toBeCloseTo(tjmJul + 3000, 1);
  });

  test("Edge case : 0 clients", () => {
    const result = simulate([], defaultParams, defaultProfile);
    expect(result.before.every((v) => v === 0)).toBe(true);
    expect(result.after.every((v) => v === 0)).toBe(true);
  });

  test("Edge case : 12 semaines vacances", () => {
    const params = { ...defaultParams, vacationWeeks: 12 };
    const result = simulate([tjmClient], params, defaultProfile);
    expect(result.after[0]).toBe(0);
    expect(result.after[1]).toBe(0);
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
      lostClientIndex: 1,
    };
    const result = simulate(clients, params, defaultProfile);
    const totalAfter = result.after.reduce((a, b) => a + b, 0);
    expect(totalAfter).toBeLessThan(
      result.before.reduce((a, b) => a + b, 0)
    );
    expect(totalAfter).toBeGreaterThan(0);
  });

  test("rateChangeAfter : s'applique a partir du mois 3", () => {
    const params = { ...defaultParams, rateChangeAfter: 15 };
    const result = simulate([tjmClient], params, defaultProfile);
    expect(result.after[0]).toBeCloseTo(result.before[0], 1);
    expect(result.after[1]).toBeCloseTo(result.before[1], 1);
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
