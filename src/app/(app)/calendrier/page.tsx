"use client";

import { useMemo, useState } from "react";
import { useProfileStore } from "@/stores/useProfileStore";
import { getClientBaseCA } from "@/lib/simulation-engine";
import { BUSINESS_STATUS_CONFIG, MONTHS_SHORT } from "@/lib/constants";
import { fmt, cn } from "@/lib/utils";
import type { BusinessStatus } from "@/types";
import { CalendarDays, Banknote, Shield, Landmark, CircleAlert } from "@/components/ui/icons";

/* ════════════════════════════════════════════════
   Types & Config
   ════════════════════════════════════════════════ */

type DeadlineCategory = "urssaf" | "tva" | "is" | "ir" | "admin";

interface FiscalDeadline {
  month: number;
  day: number;
  label: string;
  category: DeadlineCategory;
  statuses: BusinessStatus[];
  estimateAmount?: (annualCA: number, status: BusinessStatus) => number;
  note?: string;
}

const CATEGORY_CONFIG: Record<DeadlineCategory, { label: string; color: string }> = {
  urssaf: { label: "URSSAF", color: "#5682F2" },
  tva: { label: "TVA", color: "#f97316" },
  is: { label: "IS", color: "#a78bfa" },
  ir: { label: "IR", color: "#4ade80" },
  admin: { label: "Admin", color: "#8b8b9e" },
};

const MONTHS_FULL = [
  "Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre",
];

/* ════════════════════════════════════════════════
   Deadline data
   ════════════════════════════════════════════════ */

const rate = (s: BusinessStatus) => BUSINESS_STATUS_CONFIG[s].urssaf;
const isRate = (s: BusinessStatus) => BUSINESS_STATUS_CONFIG[s].is;

const DEADLINES: FiscalDeadline[] = [
  // ── MICRO : URSSAF quarterly ──
  { month: 0, day: 31, label: "Declaration CA T4 (N-1)", category: "urssaf", statuses: ["micro"],
    estimateAmount: (ca) => ca * 0.22 / 4 },
  { month: 3, day: 30, label: "Declaration CA T1", category: "urssaf", statuses: ["micro"],
    estimateAmount: (ca) => ca * 0.22 / 4 },
  { month: 6, day: 31, label: "Declaration CA T2", category: "urssaf", statuses: ["micro"],
    estimateAmount: (ca) => ca * 0.22 / 4 },
  { month: 9, day: 31, label: "Declaration CA T3", category: "urssaf", statuses: ["micro"],
    estimateAmount: (ca) => ca * 0.22 / 4 },

  // ── TNS : URSSAF quarterly (EI, EURL IR, EURL IS) ──
  { month: 1, day: 5, label: "Appel provisionnel URSSAF T1", category: "urssaf",
    statuses: ["ei", "eurl_ir", "eurl_is"],
    estimateAmount: (ca, s) => ca * rate(s) / 4 },
  { month: 4, day: 5, label: "Appel provisionnel URSSAF T2", category: "urssaf",
    statuses: ["ei", "eurl_ir", "eurl_is"],
    estimateAmount: (ca, s) => ca * rate(s) / 4 },
  { month: 7, day: 5, label: "Appel provisionnel URSSAF T3", category: "urssaf",
    statuses: ["ei", "eurl_ir", "eurl_is"],
    estimateAmount: (ca, s) => ca * rate(s) / 4 },
  { month: 10, day: 5, label: "Appel provisionnel URSSAF T4", category: "urssaf",
    statuses: ["ei", "eurl_ir", "eurl_is"],
    estimateAmount: (ca, s) => ca * rate(s) / 4 },

  // ── SASU : bulletin de paie + charges mensuelles ──
  ...Array.from({ length: 12 }, (_, i): FiscalDeadline => ({
    month: i, day: 15, label: "Bulletin de paie + charges sociales", category: "urssaf",
    statuses: ["sasu_ir", "sasu_is"],
    estimateAmount: (ca, s) => ca * rate(s) / 12,
  })),

  // ── TVA : declaration mensuelle (non-micro) ──
  ...Array.from({ length: 12 }, (_, i): FiscalDeadline => ({
    month: i, day: 19, label: "Declaration TVA", category: "tva",
    statuses: ["ei", "eurl_ir", "eurl_is", "sasu_ir", "sasu_is"],
  })),

  // ── IS acomptes ──
  { month: 2, day: 15, label: "Acompte IS T1", category: "is",
    statuses: ["eurl_is", "sasu_is"],
    estimateAmount: (ca, s) => ca * isRate(s) / 4 },
  { month: 5, day: 15, label: "Acompte IS T2", category: "is",
    statuses: ["eurl_is", "sasu_is"],
    estimateAmount: (ca, s) => ca * isRate(s) / 4 },
  { month: 8, day: 15, label: "Acompte IS T3", category: "is",
    statuses: ["eurl_is", "sasu_is"],
    estimateAmount: (ca, s) => ca * isRate(s) / 4 },
  { month: 11, day: 15, label: "Acompte IS T4", category: "is",
    statuses: ["eurl_is", "sasu_is"],
    estimateAmount: (ca, s) => ca * isRate(s) / 4 },

  // ── IR ──
  { month: 4, day: 25, label: "Declaration de revenus IR", category: "ir",
    statuses: ["micro", "ei", "eurl_ir", "eurl_is", "sasu_ir", "sasu_is"] },

  // ── Admin ──
  { month: 4, day: 15, label: "Liasse fiscale (2065 / 2035)", category: "admin",
    statuses: ["ei", "eurl_ir", "eurl_is", "sasu_ir", "sasu_is"] },
  { month: 5, day: 30, label: "AG (approbation des comptes)", category: "admin",
    statuses: ["eurl_ir", "eurl_is", "sasu_ir", "sasu_is"] },
  { month: 11, day: 15, label: "CFE (Cotisation Fonciere)", category: "admin",
    statuses: ["micro", "ei", "eurl_ir", "eurl_is", "sasu_ir", "sasu_is"],
    note: "Exonere la 1ere annee" },
];

/* ════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════ */

export default function CalendrierPage() {
  const { clients, businessStatus } = useProfileStore();

  const annualCA = useMemo(
    () => clients.reduce((sum, c) => sum + getClientBaseCA(c), 0) * 12,
    [clients]
  );

  const [selectedStatus, setSelectedStatus] = useState<BusinessStatus>(businessStatus);

  const currentMonth = new Date().getMonth();

  // Filter deadlines for selected status
  const filteredByMonth = useMemo(() => {
    const byMonth: FiscalDeadline[][] = Array.from({ length: 12 }, () => []);
    for (const d of DEADLINES) {
      if (d.statuses.includes(selectedStatus)) {
        byMonth[d.month].push(d);
      }
    }
    // Sort each month by day
    for (const arr of byMonth) {
      arr.sort((a, b) => a.day - b.day);
    }
    return byMonth;
  }, [selectedStatus]);

  // Totals by category
  const totals = useMemo(() => {
    const sums: Record<DeadlineCategory, number> = { urssaf: 0, tva: 0, is: 0, ir: 0, admin: 0 };
    for (const month of filteredByMonth) {
      for (const d of month) {
        if (d.estimateAmount) {
          sums[d.category] += d.estimateAmount(annualCA, selectedStatus);
        }
      }
    }
    return sums;
  }, [filteredByMonth, annualCA, selectedStatus]);

  const totalProvision = totals.urssaf + totals.is;

  const allStatuts: BusinessStatus[] = ["micro", "ei", "eurl_ir", "eurl_is", "sasu_ir", "sasu_is"];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Calendrier Fiscal</h1>
        <p className="text-[#8b8b9e]">
          Toutes tes &eacute;ch&eacute;ances fiscales sur 12 mois avec les montants &agrave; provisionner.
        </p>
      </div>

      {/* Status selector */}
      <div className="flex flex-wrap gap-2">
        {allStatuts.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedStatus(s)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              selectedStatus === s
                ? "bg-[#5682F2]/15 text-[#5682F2] ring-1 ring-[#5682F2]/30"
                : "bg-white/[0.04] text-[#8b8b9e] hover:text-white hover:bg-white/[0.06]"
            )}
          >
            {BUSINESS_STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Category legend */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(CATEGORY_CONFIG) as [DeadlineCategory, { label: string; color: string }][]).map(
          ([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-[#8b8b9e]">
              <div className="size-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
              {cfg.label}
            </div>
          )
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon={Banknote} label="URSSAF / an" value={totals.urssaf} color="#5682F2" />
        <SummaryCard icon={Shield} label="IS / an" value={totals.is} color="#a78bfa" />
        <SummaryCard icon={Landmark} label="Total provisions" value={totalProvision} color="#06b6d4" />
        <SummaryCard
          icon={CalendarDays}
          label="Echeances / an"
          value={filteredByMonth.reduce((s, m) => s + m.length, 0)}
          color="#F4BE7E"
          isCount
        />
      </div>

      {/* 12-month timeline */}
      <div className="relative">
        {Array.from({ length: 12 }, (_, i) => {
          const deadlines = filteredByMonth[i];
          const isCurrentMo = i === currentMonth;

          return (
            <div
              key={i}
              className={cn("relative pl-8 pb-6 border-l-2", isCurrentMo ? "border-[#5682F2]" : "border-white/[0.06]")}
            >
              {/* Month dot */}
              <div
                className={cn(
                  "absolute -left-[9px] top-0 size-4 rounded-full border-2",
                  isCurrentMo ? "bg-[#5682F2] border-[#5682F2]" : "bg-[#0a0a14] border-white/[0.12]"
                )}
              />

              {/* Month name */}
              <div className={cn("text-sm font-bold mb-3", isCurrentMo ? "text-[#5682F2]" : "text-white")}>
                {MONTHS_FULL[i]}
                {isCurrentMo && (
                  <span className="ml-2 text-[10px] font-normal text-[#5682F2] uppercase tracking-wider">
                    Mois en cours
                  </span>
                )}
              </div>

              {/* Deadlines */}
              {deadlines.length === 0 ? (
                <div className="text-xs text-[#5a5a6e] italic">Aucune &eacute;ch&eacute;ance</div>
              ) : (
                <div className="space-y-2">
                  {deadlines.map((d, j) => {
                    const catCfg = CATEGORY_CONFIG[d.category];
                    const amount = d.estimateAmount?.(annualCA, selectedStatus);

                    return (
                      <div
                        key={j}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: catCfg.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">{d.label}</div>
                          <div className="flex items-center gap-2 text-[11px] text-[#5a5a6e]">
                            <span>{d.day} {MONTHS_SHORT[i]}</span>
                            {d.note && (
                              <>
                                <span>&middot;</span>
                                <span className="italic">{d.note}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {amount != null && amount > 0 && (
                          <span className="text-sm font-semibold shrink-0" style={{ color: catCfg.color }}>
                            ~{fmt(amount)} &euro;
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-[#5a5a6e] pb-8">
        Dates indicatives bas&eacute;es sur le calendrier fiscal standard.
        Les montants estim&eacute;s sont calcul&eacute;s &agrave; partir de ton CA actuel et des taux moyens.
        Consulte ton expert-comptable pour les dates exactes.
      </div>
    </div>
  );
}

/* ── Summary card component ── */

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
  isCount,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: number;
  color: string;
  isCount?: boolean;
}) {
  return (
    <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="size-4" style={{ color }} />
        <span className="text-[10px] text-[#5a5a6e] uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-bold text-white">
        {isCount ? value : <>{fmt(value)} &euro;</>}
      </div>
    </div>
  );
}
