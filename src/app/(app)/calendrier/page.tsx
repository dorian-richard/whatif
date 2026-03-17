"use client";

import { useMemo, useState } from "react";
import { useProfileStore } from "@/stores/useProfileStore";
import { getAnnualCA, getClientMonthlyCA } from "@/lib/simulation-engine";
import { BUSINESS_STATUS_CONFIG, MONTHS_SHORT, SEASONALITY } from "@/lib/constants";
import { fmt, cn } from "@/lib/utils";
import type { BusinessStatus } from "@/types";
import { CalendarDays, Banknote, Shield, Landmark, CircleAlert, Download } from "@/components/ui/icons";
import { ProBlur } from "@/components/ProBlur";
import { DEADLINES, CATEGORY_CONFIG, type DeadlineCategory, type FiscalDeadline, type FiscalEstimateContext } from "@/lib/fiscal-deadlines";

const MONTHS_FULL = [
  "Janvier", "F\u00e9vrier", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Ao\u00fbt", "Septembre", "Octobre", "Novembre", "D\u00e9cembre",
];

/* ════════════════════════════════════════════════
   ICS Export
   ════════════════════════════════════════════════ */

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function generateICS(
  deadlines: FiscalDeadline[][],
  status: BusinessStatus,
  annualCA: number,
  ctx: FiscalEstimateContext,
  monthlyCA: number[],
): string {
  const year = new Date().getFullYear();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Freelens//Calendrier Fiscal//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Freelens - Calendrier Fiscal",
    "X-WR-TIMEZONE:Europe/Paris",
  ];

  for (let month = 0; month < 12; month++) {
    for (const d of deadlines[month]) {
      // Clamp day to valid range for the month
      const maxDay = new Date(year, month + 1, 0).getDate();
      const day = Math.min(d.day, maxDay);
      const dateStr = `${year}${pad2(month + 1)}${pad2(day)}`;
      const amount = d.estimateFromMonthlyCA
        ? d.estimateFromMonthlyCA(monthlyCA[month])
        : d.estimateAmount?.(annualCA, status, ctx);
      const catLabel = CATEGORY_CONFIG[d.category].label;

      let description = catLabel;
      if (amount != null && amount > 0) {
        description += ` — Montant estime: ~${Math.round(amount)} EUR`;
      }
      if (d.note) {
        description += ` (${d.note})`;
      }

      lines.push("BEGIN:VEVENT");
      lines.push(`DTSTART;VALUE=DATE:${dateStr}`);
      lines.push(`DTEND;VALUE=DATE:${dateStr}`);
      lines.push(`SUMMARY:${d.label}`);
      lines.push(`DESCRIPTION:${description}`);
      lines.push(`CATEGORIES:${catLabel}`);
      lines.push(`UID:freelens-${status}-${month}-${d.day}-${d.label.replace(/\s/g, "-")}@freelens.app`);
      lines.push("END:VEVENT");
    }
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function downloadICS(content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "calendrier-fiscal-freelens.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════ */

export default function CalendrierPage() {
  const { clients, businessStatus, subscriptionStatus, vacationDaysPerMonth, remunerationType, mixtePartSalaire } = useProfileStore();

  const annualCA = useMemo(() => getAnnualCA(clients, vacationDaysPerMonth), [clients, vacationDaysPerMonth]);

  const fiscalCtx = useMemo<FiscalEstimateContext>(() => ({
    remunerationType: remunerationType ?? "salaire",
    mixtePartSalaire: mixtePartSalaire ?? 50,
  }), [remunerationType, mixtePartSalaire]);

  const monthlyCA = useMemo(() => {
    return Array.from({ length: 12 }, (_, month) => {
      const season = SEASONALITY[month];
      const vacDays = vacationDaysPerMonth?.[month] ?? 0;
      return clients.reduce((sum, c) => sum + getClientMonthlyCA(c, month, season, vacDays), 0);
    });
  }, [clients, vacationDaysPerMonth]);

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
    for (let i = 0; i < filteredByMonth.length; i++) {
      for (const d of filteredByMonth[i]) {
        if (d.estimateFromMonthlyCA) {
          sums[d.category] += d.estimateFromMonthlyCA(monthlyCA[i]);
        } else if (d.estimateAmount) {
          sums[d.category] += d.estimateAmount(annualCA, selectedStatus, fiscalCtx);
        }
      }
    }
    return sums;
  }, [filteredByMonth, annualCA, monthlyCA, selectedStatus, fiscalCtx]);

  const totalProvision = totals.urssaf + totals.tva + totals.is + totals.ir + totals.admin;

  const allStatuts: BusinessStatus[] = ["micro", "ei", "eurl_ir", "eurl_is", "sasu_ir", "sasu_is", "portage"];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Calendrier des &eacute;ch&eacute;ances fiscales</h1>
          <p className="text-muted-foreground">
            Toutes tes &eacute;ch&eacute;ances fiscales sur 12 mois avec les montants &agrave; provisionner.
          </p>
        </div>
        {subscriptionStatus === "ACTIVE" && (
          <button
            onClick={() => {
              const ics = generateICS(filteredByMonth, selectedStatus, annualCA, fiscalCtx, monthlyCA);
              downloadICS(ics);
            }}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Download className="size-4" />
            <span className="hidden sm:inline">Exporter .ics</span>
          </button>
        )}
      </div>

      <ProBlur label="Le calendrier des échéances fiscales est réservé au plan Pro">
      {/* Status selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {allStatuts.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedStatus(s)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0",
              selectedStatus === s
                ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {BUSINESS_STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Key figures — compact */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <Banknote className="size-4 text-[#10b981]" />
          <span className="text-muted-foreground">CA :</span>
          <span className="font-bold text-foreground">{fmt(annualCA)}&euro;</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Landmark className="size-4 text-[#06b6d4]" />
          <span className="text-muted-foreground">A provisionner :</span>
          <span className="font-bold text-foreground">{fmt(Math.round(totalProvision))}&euro;</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarDays className="size-4 text-[#F4BE7E]" />
          <span className="text-muted-foreground">{filteredByMonth.reduce((s, m) => s + m.length, 0)} echeances/an</span>
        </div>
      </div>

      {/* Category legend — inline */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(CATEGORY_CONFIG) as [DeadlineCategory, { label: string; color: string }][]).map(
          ([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="size-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
              {cfg.label}
              {totals[key] > 0 && <span className="font-semibold text-foreground">{fmt(Math.round(totals[key]))}&euro;</span>}
            </div>
          )
        )}
      </div>

      {/* 12-month timeline */}
      <div className="relative">
        {Array.from({ length: 12 }, (_, i) => {
          const deadlines = filteredByMonth[i];
          const isCurrentMo = i === currentMonth;

          return (
            <div
              key={i}
              className={cn("relative pl-5 md:pl-8 pb-6 border-l-2", isCurrentMo ? "border-[#5682F2]" : "border-border")}
            >
              {/* Month dot */}
              <div
                className={cn(
                  "absolute -left-[9px] top-0 size-4 rounded-full border-2",
                  isCurrentMo ? "bg-[#5682F2] border-[#5682F2]" : "bg-background border-border"
                )}
              />

              {/* Month name + CA */}
              <div className="mb-3">
                <div className={cn("text-sm font-bold", isCurrentMo ? "text-primary" : "text-foreground")}>
                  {MONTHS_FULL[i]}
                  {isCurrentMo && (
                    <span className="ml-2 text-[10px] font-normal text-primary uppercase tracking-wider">
                      Mois en cours
                    </span>
                  )}
                </div>
                {monthlyCA[i] > 0 && (
                  <div className="text-xs text-muted-foreground/80">
                    CA estim&eacute; : {fmt(monthlyCA[i])} &euro; HT
                  </div>
                )}
              </div>

              {/* Deadlines */}
              {deadlines.length === 0 ? (
                <div className="text-xs text-muted-foreground/80 italic">Aucune &eacute;ch&eacute;ance</div>
              ) : (
                <div className="space-y-2">
                  {deadlines.map((d, j) => {
                    const catCfg = CATEGORY_CONFIG[d.category];
                    const amount = d.estimateFromMonthlyCA
                      ? d.estimateFromMonthlyCA(monthlyCA[i])
                      : d.estimateAmount?.(annualCA, selectedStatus, fiscalCtx);

                    return (
                      <div
                        key={j}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: catCfg.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-foreground truncate">{d.label}</div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80">
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
                  {/* Monthly subtotal */}
                  {(() => {
                    const monthTotal = deadlines.reduce((sum, d) => {
                      const amt = d.estimateFromMonthlyCA
                        ? d.estimateFromMonthlyCA(monthlyCA[i])
                        : d.estimateAmount?.(annualCA, selectedStatus, fiscalCtx);
                      return sum + (amt != null && amt > 0 ? amt : 0);
                    }, 0);
                    return monthTotal > 0 ? (
                      <div className="flex items-center justify-end gap-2 pt-1 pr-3 text-sm text-muted-foreground">
                        <span>Total du mois :</span>
                        <span className="font-bold text-foreground">~{fmt(monthTotal)} &euro;</span>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-muted-foreground/80 pb-8">
        Dates indicatives bas&eacute;es sur le calendrier fiscal standard.
        Les montants estim&eacute;s sont calcul&eacute;s &agrave; partir de ton CA actuel et des taux moyens.
        Consulte ton expert-comptable pour les dates exactes.
      </div>
      </ProBlur>
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
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="size-4" style={{ color }} />
        <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-bold text-foreground">
        {isCount ? value : <>{fmt(value)} &euro;</>}
      </div>
    </div>
  );
}
