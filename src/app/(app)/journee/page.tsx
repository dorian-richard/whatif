"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useProfileStore } from "@/stores/useProfileStore";
import { useWorkLogStore, type WorkEntry } from "@/stores/useWorkLogStore";
import { useInvoiceStore } from "@/stores/useInvoiceStore";
import { usePipelineStore } from "@/stores/usePipelineStore";
import { getClientMonthlyCA } from "@/lib/simulation-engine";
import { SEASONALITY } from "@/lib/constants";
import { getUpcomingDeadlines } from "@/lib/fiscal-deadlines";
import { fmt, cn } from "@/lib/utils";
import { ProBlur } from "@/components/ProBlur";
import {
  Clock,
  Timer,
  Zap,
  Flame,
  Target,
  Receipt,
  Kanban,
  CalendarDays,
  Plus,
  X,
  Check,
  CircleAlert,
  TrendingUp,
  TrendingDown,
  Banknote,
  Gauge,
} from "@/components/ui/icons";

const TODAY = new Date().toISOString().slice(0, 10);
const CURRENT_MONTH = new Date().getMonth();
const CURRENT_YEAR = new Date().getFullYear();

// Get weekday name in French
function getDayLabel(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
}

// Get monday of the week for a date
function getWeekStart(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
}

// Get 5 weekdays starting from monday
function getWeekDays(mondayStr: string) {
  const days: string[] = [];
  const d = new Date(mondayStr + "T12:00:00");
  for (let i = 0; i < 5; i++) {
    days.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

// Business days in current month
function getBusinessDaysInMonth(year: number, month: number) {
  let count = 0;
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

// Business days elapsed so far
function getBusinessDaysElapsed(year: number, month: number, today: string) {
  let count = 0;
  const d = new Date(year, month, 1);
  const todayDate = new Date(today + "T23:59:59");
  while (d.getMonth() === month && d <= todayDate) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export default function JourneePage() {
  const profile = useProfileStore();
  const clients = profile.clients ?? [];
  const isDbSynced = useProfileStore((s) => s.isDbSynced);

  const { entries, timerClientId, timerStartedAt, addEntry, removeEntry, startTimer, stopTimer, cancelTimer, currentStreak } = useWorkLogStore();
  const documents = useInvoiceStore((s) => s.documents);
  const prospects = usePipelineStore((s) => s.prospects);

  // Timer display
  const [timerDisplay, setTimerDisplay] = useState("00:00:00");
  const [manualHours, setManualHours] = useState("");
  const [manualClientId, setManualClientId] = useState("");
  const [manualDesc, setManualDesc] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);

  useEffect(() => {
    if (!timerStartedAt) { setTimerDisplay("00:00:00"); return; }
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000);
      const h = Math.floor(elapsed / 3600).toString().padStart(2, "0");
      const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, "0");
      const s = (elapsed % 60).toString().padStart(2, "0");
      setTimerDisplay(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerStartedAt]);

  // Today's revenue — sum of active clients' daily revenue
  const todayRevenue = useMemo(() => {
    const dow = new Date().getDay();
    if (dow === 0 || dow === 6) return 0; // weekend
    return clients
      .filter((c) => c.isActive !== false)
      .reduce((sum, c) => {
        if (c.billing === "tjm" && c.dailyRate) return sum + c.dailyRate;
        if (c.billing === "forfait" && c.monthlyAmount) return sum + c.monthlyAmount / 22;
        return sum;
      }, 0);
  }, [clients]);

  // Month progress
  const monthStats = useMemo(() => {
    const totalBizDays = getBusinessDaysInMonth(CURRENT_YEAR, CURRENT_MONTH);
    const elapsedBizDays = getBusinessDaysElapsed(CURRENT_YEAR, CURRENT_MONTH, TODAY);
    const monthCA = clients.reduce((sum, c) => {
      if (c.isActive === false) return sum;
      const vacDays = profile.vacationDaysPerMonth?.[CURRENT_MONTH] ?? 0;
      return sum + getClientMonthlyCA(c, CURRENT_MONTH, SEASONALITY[CURRENT_MONTH], vacDays);
    }, 0);
    // Worked days this month from work log
    const workedDays = new Set(
      entries
        .filter((e) => e.date.startsWith(`${CURRENT_YEAR}-${String(CURRENT_MONTH + 1).padStart(2, "0")}`))
        .map((e) => e.date)
    ).size;
    const totalHoursMonth = entries
      .filter((e) => e.date.startsWith(`${CURRENT_YEAR}-${String(CURRENT_MONTH + 1).padStart(2, "0")}`))
      .reduce((sum, e) => sum + e.hours, 0);
    return { totalBizDays, elapsedBizDays, monthCA, workedDays, totalHoursMonth };
  }, [clients, entries, profile]);

  // Week view
  const weekData = useMemo(() => {
    const mondayStr = getWeekStart(TODAY);
    const days = getWeekDays(mondayStr);
    const clientColors: Record<string, string> = {};
    clients.forEach((c) => { clientColors[c.id] = c.color ?? "#5682F2"; });

    const weekEntries = days.map((day) => ({
      day,
      label: getDayLabel(day),
      isToday: day === TODAY,
      entries: entries.filter((e) => e.date === day),
    }));
    const totalHours = weekEntries.reduce((sum, d) => sum + d.entries.reduce((s, e) => s + e.hours, 0), 0);
    return { weekEntries, totalHours, clientColors };
  }, [entries, clients]);

  // Today's entries
  const todayEntries = useMemo(() => entries.filter((e) => e.date === TODAY), [entries]);
  const todayHours = todayEntries.reduce((sum, e) => sum + e.hours, 0);

  // Profitability analysis — per client this month
  const profitability = useMemo(() => {
    const monthPrefix = `${CURRENT_YEAR}-${String(CURRENT_MONTH + 1).padStart(2, "0")}`;
    const monthEntries = entries.filter((e) => e.date.startsWith(monthPrefix));
    const totalMonthHours = monthEntries.reduce((sum, e) => sum + e.hours, 0);
    const availableHours = monthStats.totalBizDays * (profile.workDaysPerWeek >= 5 ? 8 : profile.workDaysPerWeek * 8 / 5);
    const utilizationRate = availableHours > 0 ? totalMonthHours / availableHours : 0;

    // Group by client
    const byClient: Record<string, number> = {};
    monthEntries.forEach((e) => {
      byClient[e.clientId] = (byClient[e.clientId] ?? 0) + e.hours;
    });

    const clientStats = Object.entries(byClient).map(([clientId, hours]) => {
      const client = clients.find((c) => c.id === clientId);
      const days = hours / 8; // convert to days
      const contractedTJM = client?.dailyRate ?? 0;
      // CA generated by this client this month
      const vacDays = profile.vacationDaysPerMonth?.[CURRENT_MONTH] ?? 0;
      const clientCA = client ? getClientMonthlyCA(client, CURRENT_MONTH, SEASONALITY[CURRENT_MONTH], vacDays) : 0;
      // Effective TJM = CA / days worked
      const effectiveTJM = days > 0 ? clientCA / days : 0;
      // Hourly rate
      const effectiveHourly = hours > 0 ? clientCA / hours : 0;
      // Is it profitable? Compare to contracted rate
      const isProfitable = contractedTJM > 0 ? effectiveTJM >= contractedTJM * 0.9 : true;

      return {
        clientId,
        name: client?.name ?? "Inconnu",
        color: client?.color ?? "#5682F2",
        hours,
        days,
        clientCA,
        contractedTJM,
        effectiveTJM,
        effectiveHourly,
        isProfitable,
        billing: client?.billing,
      };
    }).sort((a, b) => b.hours - a.hours);

    // Overall effective TJM
    const totalDays = totalMonthHours / 8;
    const overallTJM = totalDays > 0 ? monthStats.monthCA / totalDays : 0;
    const avgContractedTJM = clients.filter((c) => c.isActive !== false && c.dailyRate).reduce((sum, c) => sum + (c.dailyRate ?? 0), 0) / Math.max(1, clients.filter((c) => c.isActive !== false && c.dailyRate).length);

    return { clientStats, totalMonthHours, totalDays, utilizationRate, overallTJM, avgContractedTJM, availableHours };
  }, [entries, clients, monthStats, profile]);

  // Urgent actions
  const urgentActions = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Overdue invoices
    const overdueInvoices = documents.filter(
      (d) => d.type === "facture" && (d.status === "sent" || d.status === "late") && d.dueDate && d.dueDate < todayStr
    );
    const overdueAmount = overdueInvoices.reduce((sum, d) => sum + d.totalTTC, 0);

    // Pending devis > 7 days
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const pendingDevis = documents.filter(
      (d) => d.type === "devis" && d.status === "sent" && d.issueDate < sevenDaysAgo
    );

    // Upcoming fiscal deadlines
    const deadlines = getUpcomingDeadlines(profile.businessStatus ?? "micro", 7);

    // Prospects to follow up (in "lead" or "proposal" stage with no recent activity)
    const staleProspects = prospects.filter(
      (p) => (p.stage === "lead" || p.stage === "devis_envoye") && p.expectedClose && p.expectedClose < todayStr
    );

    return { overdueInvoices, overdueAmount, pendingDevis, deadlines, staleProspects };
  }, [documents, prospects, profile.businessStatus]);

  const totalUrgent = urgentActions.overdueInvoices.length + urgentActions.pendingDevis.length + urgentActions.deadlines.length + urgentActions.staleProspects.length;

  // Manual entry submit
  const handleManualSubmit = useCallback(() => {
    if (!manualClientId || !manualHours) return;
    addEntry({
      date: TODAY,
      clientId: manualClientId,
      hours: parseFloat(manualHours),
      description: manualDesc || undefined,
    });
    setManualHours("");
    setManualDesc("");
    setShowManualForm(false);
  }, [manualClientId, manualHours, manualDesc, addEntry]);

  // Client name helper
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "Client inconnu";
  const clientColor = (id: string) => clients.find((c) => c.id === id)?.color ?? "#5682F2";

  if (!isDbSynced) {
    return <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-pulse"><div className="h-8 bg-muted rounded w-48 mb-8" /><div className="grid gap-4 sm:grid-cols-3"><div className="h-32 bg-muted rounded-xl" /><div className="h-32 bg-muted rounded-xl" /><div className="h-32 bg-muted rounded-xl" /></div></div>;
  }

  const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
  const monthProgress = monthStats.totalBizDays > 0 ? (monthStats.elapsedBizDays / monthStats.totalBizDays) * 100 : 0;

  return (
    <ProBlur>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ma journ&eacute;e</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          {currentStreak > 1 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#fbbf24]/10 rounded-full">
              <Flame className="size-4 text-[#fbbf24]" />
              <span className="text-sm font-bold text-[#fbbf24]">{currentStreak}j</span>
            </div>
          )}
        </div>

        {/* Row 1: Briefing cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Today's revenue */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <Banknote className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Revenu du jour</span>
            </div>
            {isWeekend ? (
              <div className="text-lg font-bold text-muted-foreground/60">Jour off</div>
            ) : (
              <div className="text-2xl font-bold text-foreground">{fmt(todayRevenue)} &euro;</div>
            )}
            {todayHours > 0 && (
              <div className="text-xs text-muted-foreground mt-1">{todayHours}h logu&eacute;es aujourd&apos;hui</div>
            )}
          </div>

          {/* Month progress */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <Target className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Mois en cours</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{fmt(monthStats.monthCA)} &euro;</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-[#5682F2] rounded-full transition-all" style={{ width: `${Math.min(100, monthProgress)}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground">{monthStats.elapsedBizDays}/{monthStats.totalBizDays}j</span>
            </div>
            {monthStats.workedDays > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {monthStats.workedDays}j travaill&eacute;s &middot; {Math.round(monthStats.totalHoursMonth)}h
              </div>
            )}
          </div>

          {/* Urgent actions */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <Zap className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Actions urgentes</span>
            </div>
            {totalUrgent === 0 ? (
              <div className="text-lg font-bold text-[#4ade80]">Tout est en ordre</div>
            ) : (
              <div className="space-y-1.5">
                {urgentActions.overdueInvoices.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <CircleAlert className="size-3.5 text-[#f87171] shrink-0" />
                    <span className="text-muted-foreground">
                      {urgentActions.overdueInvoices.length} facture{urgentActions.overdueInvoices.length > 1 ? "s" : ""} en retard ({fmt(urgentActions.overdueAmount)}&euro;)
                    </span>
                  </div>
                )}
                {urgentActions.pendingDevis.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="size-3.5 text-[#fbbf24] shrink-0" />
                    <span className="text-muted-foreground">
                      {urgentActions.pendingDevis.length} devis en attente &gt;7j
                    </span>
                  </div>
                )}
                {urgentActions.deadlines.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDays className="size-3.5 text-[#5682F2] shrink-0" />
                    <span className="text-muted-foreground">
                      {urgentActions.deadlines.length} &eacute;ch&eacute;ance{urgentActions.deadlines.length > 1 ? "s" : ""} cette semaine
                    </span>
                  </div>
                )}
                {urgentActions.staleProspects.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Kanban className="size-3.5 text-[#a78bfa] shrink-0" />
                    <span className="text-muted-foreground">
                      {urgentActions.staleProspects.length} prospect{urgentActions.staleProspects.length > 1 ? "s" : ""} &agrave; relancer
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Timer + Manual log */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Timer */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Timer className="size-4 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Timer</span>
              </div>
              {timerStartedAt && (
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-[#f87171] animate-pulse" />
                  <span className="text-xs text-muted-foreground">En cours</span>
                </div>
              )}
            </div>

            {!timerStartedAt ? (
              <div className="space-y-3">
                <select
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  value={manualClientId}
                  onChange={(e) => setManualClientId(e.target.value)}
                >
                  <option value="">S&eacute;lectionner un client</option>
                  {clients.filter((c) => c.isActive !== false).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => manualClientId && startTimer(manualClientId)}
                  disabled={!manualClientId}
                  className="w-full py-2.5 bg-[#5682F2] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  D&eacute;marrer le timer
                </button>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="text-3xl font-mono font-bold text-foreground">{timerDisplay}</div>
                <div className="text-sm text-muted-foreground">
                  {clientName(timerClientId!)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={stopTimer}
                    className="flex-1 py-2 bg-[#4ade80] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                  >
                    <Check className="size-3.5" /> Enregistrer
                  </button>
                  <button
                    onClick={cancelTimer}
                    className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Manual entry */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Log manuel</span>
              </div>
              {!showManualForm && (
                <button
                  onClick={() => setShowManualForm(true)}
                  className="text-xs text-[#5682F2] font-medium hover:opacity-80 flex items-center gap-1"
                >
                  <Plus className="size-3" /> Ajouter
                </button>
              )}
            </div>

            {showManualForm ? (
              <div className="space-y-2.5">
                <select
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  value={manualClientId}
                  onChange={(e) => setManualClientId(e.target.value)}
                >
                  <option value="">Client</option>
                  {clients.filter((c) => c.isActive !== false).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    placeholder="Heures"
                    className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                    value={manualHours}
                    onChange={(e) => setManualHours(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Description (opt.)"
                    className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                    value={manualDesc}
                    onChange={(e) => setManualDesc(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleManualSubmit}
                    disabled={!manualClientId || !manualHours}
                    className="flex-1 py-2 bg-[#5682F2] text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-40"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setShowManualForm(false)}
                    className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : todayEntries.length > 0 ? (
              <div className="space-y-2">
                {todayEntries.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-sm">
                    <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: clientColor(e.clientId) }} />
                    <span className="font-medium text-foreground">{clientName(e.clientId)}</span>
                    <span className="text-muted-foreground">{e.hours}h</span>
                    {e.description && <span className="text-muted-foreground/60 truncate">&middot; {e.description}</span>}
                    <button onClick={() => removeEntry(e.id)} className="ml-auto text-muted-foreground/40 hover:text-[#f87171]">
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                <div className="pt-1 border-t border-border text-xs text-muted-foreground font-medium">
                  Total : {todayHours}h
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground/60 text-center py-4">
                Aucune entr&eacute;e aujourd&apos;hui
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Week view */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-muted-foreground" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Semaine</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">{Math.round(weekData.totalHours * 10) / 10}h total</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {weekData.weekEntries.map(({ day, label, isToday, entries: dayEntries }) => {
              const dayHours = dayEntries.reduce((sum, e) => sum + e.hours, 0);
              const maxH = 8; // 8h = full bar
              return (
                <div key={day} className="text-center">
                  <div className={cn("text-[10px] font-medium mb-1.5", isToday ? "text-[#5682F2]" : "text-muted-foreground")}>
                    {label}
                  </div>
                  <div className="h-20 bg-muted/30 rounded-lg overflow-hidden flex flex-col-reverse relative">
                    {dayEntries.map((e, i) => {
                      const pct = Math.min((e.hours / maxH) * 100, 100);
                      return (
                        <div
                          key={e.id}
                          className="w-full transition-all"
                          style={{
                            height: `${pct}%`,
                            backgroundColor: clientColor(e.clientId),
                            opacity: 0.8,
                          }}
                        />
                      );
                    })}
                    {isToday && dayHours === 0 && (
                      <div className="absolute inset-0 border-2 border-dashed border-[#5682F2]/30 rounded-lg" />
                    )}
                  </div>
                  <div className={cn("text-[10px] mt-1", dayHours > 0 ? "text-foreground font-medium" : "text-muted-foreground/40")}>
                    {dayHours > 0 ? `${dayHours}h` : "-"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Client legend */}
          {weekData.totalHours > 0 && (
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
              {[...new Set(entries.filter((e) => {
                const mondayStr = getWeekStart(TODAY);
                const days = getWeekDays(mondayStr);
                return days.includes(e.date);
              }).map((e) => e.clientId))].map((cId) => (
                <div key={cId} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="size-2 rounded-full" style={{ backgroundColor: clientColor(cId) }} />
                  {clientName(cId)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Row 4: Profitability */}
        {profitability.totalMonthHours > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gauge className="size-4 text-muted-foreground" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Rentabilit&eacute; du mois</span>
              </div>
            </div>

            {/* KPIs row */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">TJM effectif</div>
                <div className="text-lg font-bold text-foreground">{fmt(profitability.overallTJM)}&euro;</div>
                {profitability.avgContractedTJM > 0 && (
                  <div className={cn("text-[10px] font-medium", profitability.overallTJM >= profitability.avgContractedTJM * 0.9 ? "text-[#4ade80]" : "text-[#f87171]")}>
                    {profitability.overallTJM >= profitability.avgContractedTJM ? "+" : ""}{Math.round(((profitability.overallTJM / profitability.avgContractedTJM) - 1) * 100)}% vs contractuel
                  </div>
                )}
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Taux d&apos;utilisation</div>
                <div className="text-lg font-bold text-foreground">{Math.round(profitability.utilizationRate * 100)}%</div>
                <div className="text-[10px] text-muted-foreground">{Math.round(profitability.totalMonthHours)}h / {Math.round(profitability.availableHours)}h</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Taux horaire</div>
                <div className="text-lg font-bold text-foreground">{fmt(profitability.totalMonthHours > 0 ? monthStats.monthCA / profitability.totalMonthHours : 0)}&euro;/h</div>
              </div>
            </div>

            {/* Per-client breakdown */}
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_60px_70px_70px_50px] gap-2 text-[10px] text-muted-foreground uppercase tracking-wider pb-1 border-b border-border">
                <span>Client</span>
                <span className="text-right">Heures</span>
                <span className="text-right">CA</span>
                <span className="text-right">TJM eff.</span>
                <span className="text-right">Statut</span>
              </div>
              {profitability.clientStats.map((cs) => (
                <div key={cs.clientId} className="grid grid-cols-[1fr_60px_70px_70px_50px] gap-2 items-center text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: cs.color }} />
                    <span className="text-foreground font-medium truncate">{cs.name}</span>
                  </div>
                  <span className="text-right text-muted-foreground">{cs.hours}h</span>
                  <span className="text-right text-muted-foreground">{fmt(cs.clientCA)}&euro;</span>
                  <span className="text-right text-foreground font-medium">{fmt(cs.effectiveTJM)}&euro;</span>
                  <div className="flex justify-end">
                    {cs.isProfitable ? (
                      <div className="size-5 rounded-full bg-[#4ade80]/15 flex items-center justify-center">
                        <Check className="size-3 text-[#4ade80]" />
                      </div>
                    ) : (
                      <div className="size-5 rounded-full bg-[#f87171]/15 flex items-center justify-center">
                        <TrendingDown className="size-3 text-[#f87171]" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Row 5: Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Nouvelle facture", href: "/facturation", icon: Receipt, color: "#ec4899" },
            { label: "Nouveau devis", href: "/facturation", icon: Receipt, color: "#a78bfa" },
            { label: "Ajouter un prospect", href: "/pipeline", icon: Kanban, color: "#5682F2" },
            { label: "Calendrier fiscal", href: "/calendrier", icon: CalendarDays, color: "#fbbf24" },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="bg-card border border-border rounded-xl p-4 hover:bg-muted transition-colors text-center group"
            >
              <action.icon className="size-5 mx-auto mb-2 text-muted-foreground group-hover:text-foreground transition-colors" style={{ color: action.color }} />
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
            </a>
          ))}
        </div>
      </div>
    </ProBlur>
  );
}
