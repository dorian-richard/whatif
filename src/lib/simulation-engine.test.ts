import { describe, test, expect } from "vitest";
import { simulate, getClientMonthlyCA, getClientBaseCA, computeIR, computeNetFromCA, JOURS_OUVRES, AVG_JOURS_OUVRES } from "./simulation-engine";
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

// ─── computeIR ───

describe("computeIR — bareme progressif 2026", () => {
  test("0€ → 0€ d'IR", () => {
    expect(computeIR(0)).toBe(0);
  });

  test("revenu negatif → 0€", () => {
    expect(computeIR(-5000)).toBe(0);
  });

  test("10 000€ → 0€ (sous le seuil 11 600€)", () => {
    expect(computeIR(10000)).toBe(0);
  });

  test("20 000€ → tranche 11% partielle", () => {
    // (20000 - 11600) * 0.11 = 924€
    expect(computeIR(20000)).toBeCloseTo(924, 0);
  });

  test("50 000€ → tranches 0 + 11 + 30%", () => {
    // 0→11600: 0€
    // 11601→29579: (29579-11600)*0.11 = 1977.69€
    // 29580→50000: (50000-29579)*0.30 = 6126.30€
    // Total = 8103.99€
    expect(computeIR(50000)).toBeCloseTo(8104, 0);
  });

  test("100 000€ → tranches 0 + 11 + 30 + 41%", () => {
    // 0→11600: 0€
    // 11601→29579: 1977.69€
    // 29580→84577: (84577-29579)*0.30 = 16499.40€
    // 84578→100000: (100000-84577)*0.41 = 6323.43€
    // Total = 24800.52€
    expect(computeIR(100000)).toBeCloseTo(24801, 0);
  });

  test("2 parts fiscales → quotient familial", () => {
    // 50k / 2 parts = 25k par part → (25000-11600)*0.11 = 1474€ par part → 2948€
    expect(computeIR(50000, 2)).toBeCloseTo(2948, 0);
  });

  test("1.5 parts", () => {
    const ir = computeIR(50000, 1.5);
    expect(ir).toBeGreaterThan(computeIR(50000, 2));
    expect(ir).toBeLessThan(computeIR(50000, 1));
  });
});

// ─── computeNetFromCA ───

describe("computeNetFromCA — IR progressif", () => {
  test("Micro 50k : URSSAF 25.6% + IR progressif sur 66%", () => {
    const profile: FreelanceProfile = {
      monthlyExpenses: 0, savings: 0, adminHoursPerWeek: 0,
      workDaysPerWeek: 5, businessStatus: "micro",
    };
    const net = computeNetFromCA(50000, profile);
    const urssaf = 50000 * 0.256; // 12800
    const taxable = 50000 * 0.66; // 33000
    const ir = computeIR(taxable); // ~2005
    expect(net).toBeCloseTo(50000 - urssaf - ir, 0);
  });

  test("Micro avec customIrRate → flat rate", () => {
    const profile: FreelanceProfile = {
      monthlyExpenses: 0, savings: 0, adminHoursPerWeek: 0,
      workDaysPerWeek: 5, businessStatus: "micro", customIrRate: 0.11,
    };
    const net = computeNetFromCA(50000, profile);
    // flat: 50000 * (1 - 0.256) - 50000 * 0.66 * 0.11 — wait, with flat rate it's still
    // urssaf + ir on CA (old formula was CA * (1 - urssaf - ir))
    // But new formula: urssaf on CA, ir flat on taxable (66% of CA)
    // Actually let me check — with customIrRate the irOn function does taxable * flatIrRate
    // So: 50000 - 50000*0.256 - 50000*0.66*0.11 = 50000 - 12800 - 3630 = 33570
    expect(net).toBeCloseTo(33570, 0);
  });

  test("EI 80k : charges pro deductibles", () => {
    const profile: FreelanceProfile = {
      monthlyExpenses: 0, savings: 0, adminHoursPerWeek: 0,
      workDaysPerWeek: 5, businessStatus: "ei", chargesPro: 15,
    };
    const net = computeNetFromCA(80000, profile);
    const afterCharges = 80000 * 0.85; // 68000
    const afterUrssaf = afterCharges * 0.55; // 37400
    const ir = computeIR(afterUrssaf);
    expect(net).toBeCloseTo(afterUrssaf - ir, 0);
  });

  test("SASU IS dividendes : PFU 30% + PUMa sur l'assiette au-dessus du seuil", () => {
    const profile: FreelanceProfile = {
      monthlyExpenses: 0, savings: 0, adminHoursPerWeek: 0,
      workDaysPerWeek: 5, businessStatus: "sasu_is", remunerationType: "dividendes",
    };
    const net = computeNetFromCA(100000, profile);
    // IS progressif : 42500 × 15% + 57500 × 25% = 20 750€
    // Après IS : 100 000 - 20 750 = 79 250€
    // PFU 30% flat : 79 250 × 0,70 = 55 475€
    // PUMa : pas d'activité → 6,5% × (79 250 - 24 030) × 1 = 3 589€
    //   (abattement 50% PASS = 24 030€ ; PASS 2026 = 48 060€)
    // Net final : 55 475 - 3 589 = 51 886€
    expect(net).toBeCloseTo(51886, 0);
  });

  test("PUMa ne s'applique pas si les dividendes sont sous le seuil 50% PASS", () => {
    const profile: FreelanceProfile = {
      monthlyExpenses: 0, savings: 0, adminHoursPerWeek: 0,
      workDaysPerWeek: 5, businessStatus: "sasu_is", remunerationType: "dividendes",
    };
    // Avec CA = 25 000€ :
    // IS : 25000 × 15% = 3 750€ ; après IS = 21 250€
    // 21 250 < 24 030 (50% PASS) → pas de PUMa
    // PFU 30% : 21 250 × 0,70 = 14 875€
    const net = computeNetFromCA(25000, profile);
    expect(net).toBeCloseTo(14875, 0);
  });

  test("SASU IS salaire : charges pro deduites du benefice IS", () => {
    const profile: FreelanceProfile = {
      monthlyExpenses: 0, savings: 0, adminHoursPerWeek: 0,
      workDaysPerWeek: 5, businessStatus: "sasu_is", remunerationType: "salaire",
      chargesPro: 20, // 20% de charges pro deductibles
    };
    // CA = 100 000€ ; après charges pro = 80 000€
    // Salaire 100% : urssaf 45% → net social = 80 000 × 0,55 = 44 000€
    // Abattement 10% : taxable = 44 000 × 0,90 = 39 600€
    // IR : 0 + 17979 × 0,11 + (39600 - 29579) × 0,30 = 1977,69 + 3006,30 = 4984€
    // Net = 44 000 - 4 984 = 39 016€
    const net = computeNetFromCA(100000, profile);
    expect(net).toBeCloseTo(39016, 0);
  });

  test("Mixte SASU IS : IR progressif correct sur la base taxable", () => {
    const profile: FreelanceProfile = {
      monthlyExpenses: 0, savings: 0, adminHoursPerWeek: 0,
      workDaysPerWeek: 5, businessStatus: "sasu_is", remunerationType: "mixte",
      mixtePartSalaire: 50,
    };
    // Pas de regression : le calcul mixte doit rester stable et positif
    const net = computeNetFromCA(100000, profile);
    expect(net).toBeGreaterThan(40000);
    expect(net).toBeLessThan(70000);
  });
});

// ─── getClientMonthlyCA ───

describe("getClientMonthlyCA", () => {
  test("TJM : CA = dailyRate * (daysPerWeek/5) * joursOuvres (no seasonality)", () => {
    const ca = getClientMonthlyCA(tjmClient, 0, SEASONALITY[0]);
    const expected = 500 * (5 / 5) * JOURS_OUVRES[0];
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

  test("TJM : vacances -> revenu tombe a 0 en aout (mois 7)", () => {
    const params = { ...defaultParams, vacationWeeks: 4.33 };
    const result = simulate([tjmClient], params, defaultProfile);
    // Vacances summer-first: aout (7) est le premier mois de vacances
    expect(result.after[7]).toBe(0);
    // Janvier (0) n'est plus touche
    expect(result.after[0]).toBeGreaterThan(0);
  });

  test("Forfait : vacances -> revenu continue", () => {
    const params = { ...defaultParams, vacationWeeks: 4.33 };
    const result = simulate([forfaitClient], params, defaultProfile);
    expect(result.after[7]).toBe(3000);
    expect(result.after[6]).toBe(3000);
  });

  test("Mission : vacances -> revenu tombe a 0 en aout", () => {
    // Mission active mois 2-5, vacances touchent aout qui est hors periode
    // Testons avec une mission active toute l'annee
    const fullMission: ClientData = {
      id: "fm", name: "Full Mission", billing: "mission",
      totalAmount: 12000, startMonth: 0, endMonth: 11,
    };
    const params = { ...defaultParams, vacationWeeks: 4.33 };
    const result = simulate([fullMission], params, defaultProfile);
    expect(result.after[7]).toBe(0); // aout
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

  test("Saisonnalite : TJM (daysPerWeek) not affected by season, Forfait non", () => {
    const result = simulate([tjmClient, forfaitClient], defaultParams, defaultProfile);
    const julCA = result.before[6];
    const tjmJul = 500 * (5 / 5) * JOURS_OUVRES[6];
    expect(julCA).toBeCloseTo(tjmJul + 3000, 1);
  });

  test("Edge case : 0 clients", () => {
    const result = simulate([], defaultParams, defaultProfile);
    expect(result.before.every((v) => v === 0)).toBe(true);
    expect(result.after.every((v) => v === 0)).toBe(true);
  });

  test("Edge case : 12 semaines vacances (ete d'abord)", () => {
    const params = { ...defaultParams, vacationWeeks: 12 };
    const result = simulate([tjmClient], params, defaultProfile);
    // 12 semaines ≈ 2.77 mois → aout (7) et juillet (6) a 0
    expect(result.after[7]).toBe(0);
    expect(result.after[6]).toBe(0);
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
