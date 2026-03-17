"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useProfileStore } from "@/stores/useProfileStore";
import { usePaymentStore, type PaymentStatus, type PaymentRecord } from "@/stores/usePaymentStore";
import { getClientMonthlyCA } from "@/lib/simulation-engine";
import { MONTHS_SHORT, SEASONALITY } from "@/lib/constants";
import { fmt, cn } from "@/lib/utils";
import { CreditCard, Check, Clock, AlertTriangle, Banknote, Users } from "@/components/ui/icons";
import { ProBlur } from "@/components/ProBlur";

const STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "En attente", color: "#fbbf24", bg: "bg-[#fbbf24]/12" },
  paid: { label: "Payé", color: "#4ade80", bg: "bg-[#4ade80]/12" },
  late: { label: "En retard", color: "#f87171", bg: "bg-[#f87171]/12" },
  partial: { label: "Partiel", color: "#f97316", bg: "bg-[#f97316]/12" },
};

const CURRENT_YEAR = new Date().getFullYear();

export default function PaiementsPage() {
  const { clients, vacationDaysPerMonth } = useProfileStore();
  const { payments, upsertPayment, setPayments, loaded, setLoaded } = usePaymentStore();

  const [year, setYear] = useState(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Load payments from DB
  useEffect(() => {
    async function loadPayments() {
      try {
        const res = await fetch(`/api/payments?year=${year}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.length > 0) {
          setPayments(
            data.map((p: Record<string, unknown>) => ({
              id: p.id,
              clientId: p.clientId,
              month: p.month,
              year: p.year,
              expected: p.expected,
              received: p.received,
              status: (p.status as string).toLowerCase() as PaymentStatus,
              paidAt: p.paidAt ? String(p.paidAt) : undefined,
            }))
          );
        }
      } catch { /* silently fail */ }
      setLoaded(true);
    }
    loadPayments();
  }, [year, setPayments, setLoaded]);

  // Compute expected CA per client per month
  const monthlyExpected = useMemo(() => {
    const result: Record<string, number[]> = {};
    for (const c of clients) {
      result[c.id] = Array.from({ length: 12 }, (_, month) => {
        const season = SEASONALITY[month];
        const vacDays = vacationDaysPerMonth?.[month] ?? 0;
        return getClientMonthlyCA(c, month, season, vacDays);
      });
    }
    return result;
  }, [clients, vacationDaysPerMonth]);

  // Persist payment change to API
  const syncPayment = useCallback(async (p: PaymentRecord) => {
    try {
      await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: p.id,
          clientId: p.clientId,
          month: p.month,
          year: p.year,
          expected: p.expected,
          received: p.received,
          status: p.status.toUpperCase(),
        }),
      });
    } catch { /* silently fail */ }
  }, []);

  const handleStatusChange = useCallback((clientId: string, month: number, newStatus: PaymentStatus) => {
    const expected = monthlyExpected[clientId]?.[month] ?? 0;
    const received = newStatus === "paid" ? expected : 0;
    upsertPayment({ clientId, month, year, expected, received, status: newStatus });
    // Sync to DB
    const p = usePaymentStore.getState().getPayment(clientId, month, year);
    if (p) syncPayment(p);
  }, [monthlyExpected, year, upsertPayment, syncPayment]);

  // Summary
  const monthPayments = useMemo(() => {
    return clients
      .map((c) => {
        const expected = monthlyExpected[c.id]?.[selectedMonth] ?? 0;
        const payment = payments.find(
          (p) => p.clientId === c.id && p.month === selectedMonth && p.year === year
        );
        return {
          client: c,
          expected,
          received: payment?.received ?? 0,
          status: (payment?.status ?? "pending") as PaymentStatus,
        };
      })
      .filter((p) => p.expected > 0);
  }, [clients, monthlyExpected, payments, selectedMonth, year]);

  const totalExpected = monthPayments.reduce((s, p) => s + p.expected, 0);
  const totalReceived = monthPayments.reduce((s, p) => s + p.received, 0);
  const paidCount = monthPayments.filter((p) => p.status === "paid").length;
  const lateCount = monthPayments.filter((p) => p.status === "late").length;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Suivi des paiements clients</h1>
        <p className="text-muted-foreground">
          Suis les paiements de tes clients mois par mois.
        </p>
      </div>

      <ProBlur label="Le suivi des paiements clients est réservé au plan Pro">
      {/* Month / Year selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setYear(year - 1)}
            className="px-2 py-1 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            &larr;
          </button>
          <span className="text-sm font-bold text-foreground w-12 text-center">{year}</span>
          <button
            onClick={() => setYear(year + 1)}
            className="px-2 py-1 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            &rarr;
          </button>
        </div>
        <div className="flex gap-1 flex-wrap">
          {MONTHS_SHORT.map((m, i) => (
            <button
              key={i}
              onClick={() => setSelectedMonth(i)}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                selectedMonth === i
                  ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Banknote className="size-4 text-[#5682F2]" />
            <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">Attendu</span>
          </div>
          <div className="text-xl font-bold text-foreground">{fmt(totalExpected)}&euro;</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Check className="size-4 text-[#4ade80]" />
            <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">Reçu</span>
          </div>
          <div className="text-xl font-bold text-[#4ade80]">{fmt(totalReceived)}&euro;</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Users className="size-4 text-[#a78bfa]" />
            <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">Payés</span>
          </div>
          <div className="text-xl font-bold text-foreground">{paidCount}/{monthPayments.length}</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="size-4 text-[#f87171]" />
            <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">En retard</span>
          </div>
          <div className={cn("text-xl font-bold", lateCount > 0 ? "text-[#f87171]" : "text-foreground")}>{lateCount}</div>
        </div>
      </div>

      {/* Client payment table / cards */}
      {clients.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <CreditCard className="size-8 text-muted-foreground/80 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Ajoute des clients dans ton profil pour suivre leurs paiements.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-[10px] text-muted-foreground/80 uppercase tracking-wider font-medium">Client</th>
                    <th className="text-right px-4 py-3 text-[10px] text-muted-foreground/80 uppercase tracking-wider font-medium">Attendu</th>
                    <th className="text-right px-4 py-3 text-[10px] text-muted-foreground/80 uppercase tracking-wider font-medium">Reçu</th>
                    <th className="text-center px-4 py-3 text-[10px] text-muted-foreground/80 uppercase tracking-wider font-medium">Statut</th>
                    <th className="text-center px-4 py-3 text-[10px] text-muted-foreground/80 uppercase tracking-wider font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {monthPayments.map(({ client, expected, received, status }) => {
                    const cfg = STATUS_CONFIG[status];
                    return (
                      <tr key={client.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: client.color ?? "#5682F2" }} />
                            <span className="font-medium text-foreground">{client.name}</span>
                            <span className="text-[10px] text-muted-foreground/80 uppercase">{client.billing}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-foreground">{fmt(expected)}&euro;</td>
                        <td className="px-4 py-3 text-right font-medium" style={{ color: cfg.color }}>{fmt(received)}&euro;</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", cfg.bg)}
                            style={{ color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {status !== "paid" && (
                              <button
                                onClick={() => handleStatusChange(client.id, selectedMonth, "paid")}
                                className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-[#4ade80]/12 text-[#4ade80] hover:bg-[#4ade80]/20 transition-colors"
                              >
                                Payé
                              </button>
                            )}
                            {status !== "late" && status !== "paid" && (
                              <button
                                onClick={() => handleStatusChange(client.id, selectedMonth, "late")}
                                className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-[#f87171]/12 text-[#f87171] hover:bg-[#f87171]/20 transition-colors"
                              >
                                Retard
                              </button>
                            )}
                            {status === "paid" && (
                              <button
                                onClick={() => handleStatusChange(client.id, selectedMonth, "pending")}
                                className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                              >
                                Annuler
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {monthPayments.map(({ client, expected, received, status }) => {
              const cfg = STATUS_CONFIG[status];
              return (
                <div key={client.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: client.color ?? "#5682F2" }} />
                      <span className="font-medium text-foreground truncate">{client.name}</span>
                      <span className="text-[10px] text-muted-foreground/80 uppercase shrink-0">{client.billing}</span>
                    </div>
                    <span
                      className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ml-2", cfg.bg)}
                      style={{ color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <div>
                      <div className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">Attendu</div>
                      <div className="text-sm font-bold text-foreground">{fmt(expected)}&euro;</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">Reçu</div>
                      <div className="text-sm font-bold" style={{ color: cfg.color }}>{fmt(received)}&euro;</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {status !== "paid" && (
                      <button
                        onClick={() => handleStatusChange(client.id, selectedMonth, "paid")}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold bg-[#4ade80]/12 text-[#4ade80] hover:bg-[#4ade80]/20 transition-colors"
                      >
                        Payé
                      </button>
                    )}
                    {status !== "late" && status !== "paid" && (
                      <button
                        onClick={() => handleStatusChange(client.id, selectedMonth, "late")}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold bg-[#f87171]/12 text-[#f87171] hover:bg-[#f87171]/20 transition-colors"
                      >
                        Retard
                      </button>
                    )}
                    {status === "paid" && (
                      <button
                        onClick={() => handleStatusChange(client.id, selectedMonth, "pending")}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Annual overview mini-grid */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-sm font-bold text-foreground mb-4">Vue annuelle {year}</h3>
        <div>
          <div className="grid grid-cols-6 md:grid-cols-12 gap-1">
            {MONTHS_SHORT.map((m, i) => {
              const monthTotal = clients.reduce((s, c) => s + (monthlyExpected[c.id]?.[i] ?? 0), 0);
              const monthPaid = payments
                .filter((p) => p.month === i && p.year === year && p.status === "paid")
                .reduce((s, p) => s + p.received, 0);
              const pct = monthTotal > 0 ? (monthPaid / monthTotal) * 100 : 0;
              const isCurrent = i === new Date().getMonth() && year === CURRENT_YEAR;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedMonth(i)}
                  className={cn(
                    "p-2 rounded-lg text-center transition-all",
                    selectedMonth === i ? "ring-1 ring-primary/30 bg-primary/5" : "hover:bg-muted/50",
                    isCurrent && "border border-primary/20"
                  )}
                >
                  <div className="text-[10px] text-muted-foreground/80 font-medium mb-1">{m}</div>
                  <div className="h-8 bg-muted/30 rounded-md relative overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-[#4ade80]/40 rounded-md transition-all"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-muted-foreground/80 mt-1">{fmt(monthTotal)}&euro;</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground/80 pb-8">
        Les montants attendus sont calcul&eacute;s automatiquement &agrave; partir de tes clients et leur mode de facturation.
      </div>
      </ProBlur>
    </div>
  );
}