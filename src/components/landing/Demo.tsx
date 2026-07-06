"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Wallet,
  Kanban,
  CalendarDays,
  Check,
  Clock,
  AlertTriangle,
  TrendingUp,
} from "@/components/ui/icons";
import { AnimateOnScroll } from "./AnimateOnScroll";

type TabId = "dashboard" | "factures" | "tresorerie" | "pipeline" | "fiscal";

const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "factures", label: "Factures", icon: FileText },
  { id: "tresorerie", label: "Trésorerie", icon: Wallet },
  { id: "pipeline", label: "Pipeline", icon: Kanban },
  { id: "fiscal", label: "Calendrier fiscal", icon: CalendarDays },
];

export function Demo() {
  const [tab, setTab] = useState<TabId>("dashboard");

  return (
    <section id="demo" className="snap-section relative flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-[#5682F2]/6 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 w-full">
        <AnimateOnScroll>
          <div className="text-center mb-10">
            <span className="text-sm font-medium text-[#5682F2] uppercase tracking-widest mb-3 block">Le produit</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Tout ton business freelance,{" "}
              <span className="fn-gradient-text">sur un seul écran</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ton vrai net apr&egrave;s URSSAF et imp&ocirc;ts, tes factures, ta tr&eacute;sorerie et ton pipeline &mdash;
              au m&ecirc;me endroit, &agrave; jour en temps r&eacute;el. Ton poste de pilotage, pas un simulateur.
            </p>
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.15}>
          <div className="bg-card rounded-2xl border border-border max-w-3xl mx-auto overflow-hidden shadow-xl">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/20">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              <div className="ml-3 text-[11px] text-muted-foreground/70 font-mono">app.freelens.io</div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-2 sm:px-3 pt-3 overflow-x-auto border-b border-border">
              {TABS.map(({ id, label, icon: TabIcon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-t-lg border-b-2 transition-all ${
                    tab === id
                      ? "border-[#5682F2] text-foreground bg-muted/30"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <TabIcon className="size-4" /> {label}
                </button>
              ))}
            </div>

            {/* Panel */}
            <div className="p-4 sm:p-6 min-h-[340px]">
              {tab === "dashboard" && <DashboardPanel />}
              {tab === "factures" && <FacturesPanel />}
              {tab === "tresorerie" && <TresoreriePanel />}
              {tab === "pipeline" && <PipelinePanel />}
              {tab === "fiscal" && <FiscalPanel />}
            </div>
          </div>
        </AnimateOnScroll>

        <div className="text-center mt-8">
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity fn-glow"
          >
            Piloter mon activit&eacute; &rarr;
          </Link>
          <p className="text-[11px] text-muted-foreground/70 mt-3">Essai Pro 7 jours &middot; Sans carte bancaire</p>
        </div>
      </div>
    </section>
  );
}

/* ── Tableau de bord ── */
const NET_12M = [62, 66, 78, 82, 80, 72, 55, 42, 88, 95, 84, 60];
const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function DashboardPanel() {
  const kpis = [
    { label: "Net réel (juil.)", value: "5 420 €", accent: "#4ade80", sub: "+8% vs juin" },
    { label: "CA encaissé", value: "8 750 €", accent: "#5682F2", sub: "3 factures" },
    { label: "À encaisser", value: "3 200 €", accent: "#F4BE7E", sub: "2 en attente" },
    { label: "Trésorerie prévue", value: "14 300 €", accent: "#a78bfa", sub: "fin août" },
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-muted/30 rounded-xl p-3 border border-border">
            <div className="text-[10px] text-muted-foreground/80 uppercase tracking-wider mb-1">{k.label}</div>
            <div className="text-base sm:text-lg font-bold text-foreground">{k.value}</div>
            <div className="text-[10px] mt-0.5" style={{ color: k.accent }}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div className="bg-muted/20 rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-foreground">Net réel &middot; 12 mois</span>
          <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
            <TrendingUp className="size-3 text-[#4ade80]" /> 58 400 € cumulé
          </span>
        </div>
        <div className="flex items-end gap-1 sm:gap-1.5 h-24">
          {NET_12M.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-sm bg-gradient-to-t from-[#5682F2] to-[#7C5BF2]" style={{ height: `${h}%` }} />
              <span className="text-[9px] text-muted-foreground/60">{MONTHS[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs bg-[#fbbf24]/10 border border-[#fbbf24]/20 rounded-xl px-3 py-2.5">
        <Clock className="size-4 text-[#fbbf24] shrink-0" />
        <span className="text-muted-foreground">Prochaine &eacute;ch&eacute;ance : <span className="text-foreground font-medium">URSSAF 3 210 €</span> le 5 ao&ucirc;t</span>
      </div>
    </div>
  );
}

/* ── Factures ── */
function FacturesPanel() {
  const invoices = [
    { num: "#2026-016", client: "E-commerce", amount: "900 €", status: "retard" },
    { num: "#2026-015", client: "Agence Design", amount: "2 500 €", status: "attente" },
    { num: "#2026-014", client: "Startup Tech", amount: "2 750 €", status: "payee" },
    { num: "#2026-013", client: "Studio Cintra", amount: "4 200 €", status: "payee" },
  ];
  const badge = {
    payee: { label: "Payée", cls: "bg-[#4ade80]/15 text-[#4ade80]", Icon: Check },
    attente: { label: "En attente", cls: "bg-[#F4BE7E]/15 text-[#d99a3f]", Icon: Clock },
    retard: { label: "En retard", cls: "bg-[#f87171]/15 text-[#f87171]", Icon: AlertTriangle },
  } as const;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-foreground">Factures &amp; devis</span>
        <span className="text-[11px] text-muted-foreground/70">10 350 € ce mois</span>
      </div>
      {invoices.map((inv) => {
        const b = badge[inv.status as keyof typeof badge];
        return (
          <div key={inv.num} className="flex items-center justify-between bg-muted/20 border border-border rounded-xl px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="size-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{inv.client}</div>
                <div className="text-[11px] text-muted-foreground/70 font-mono">{inv.num}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-bold text-foreground">{inv.amount}</span>
              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${b.cls}`}>
                <b.Icon className="size-3" /> {b.label}
              </span>
            </div>
          </div>
        );
      })}
      <div className="flex flex-wrap gap-2 pt-1">
        {["Devis → Facture en 1 clic", "Relance automatique", "Export PDF"].map((t) => (
          <span key={t} className="text-[11px] bg-muted/40 text-muted-foreground px-2.5 py-1 rounded-full">{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Trésorerie ── */
function TresoreriePanel() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/30 rounded-xl p-3 border border-border">
          <div className="text-[10px] text-muted-foreground/80 uppercase tracking-wider mb-1">Solde prévu fin d&apos;année</div>
          <div className="text-lg font-bold text-[#4ade80]">18 900 €</div>
        </div>
        <div className="bg-muted/30 rounded-xl p-3 border border-border">
          <div className="text-[10px] text-muted-foreground/80 uppercase tracking-wider mb-1">Mois le plus bas</div>
          <div className="text-lg font-bold text-foreground">4 100 € <span className="text-xs font-normal text-muted-foreground/70">août</span></div>
        </div>
      </div>
      <div className="bg-muted/20 rounded-xl p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-foreground">Trésorerie prévisionnelle &middot; 12 mois</span>
          <span className="text-[10px] text-[#f87171] flex items-center gap-1"><span className="w-3 border-t border-dashed border-[#f87171]" /> seuil 3 000 €</span>
        </div>
        <svg viewBox="0 0 480 130" className="w-full h-auto">
          <defs>
            <linearGradient id="tresoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5682F2" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#5682F2" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[30, 65, 100].map((y) => (
            <line key={y} x1="0" y1={y} x2="480" y2={y} stroke="currentColor" opacity="0.06" />
          ))}
          {/* seuil d'alerte */}
          <line x1="0" y1="108" x2="480" y2="108" stroke="#f87171" strokeWidth="1" strokeDasharray="5 4" opacity="0.7" />
          <path d="M0,70 L44,60 L88,66 L132,48 L176,52 L220,72 L264,90 L308,98 L352,55 L396,40 L440,48 L480,35 V130 H0 Z" fill="url(#tresoGrad)" />
          <path d="M0,70 L44,60 L88,66 L132,48 L176,52 L220,72 L264,90 L308,98 L352,55 L396,40 L440,48 L480,35" fill="none" stroke="#5682F2" strokeWidth="2.5" />
        </svg>
      </div>
      <div className="flex items-center gap-2 text-xs bg-[#5682F2]/8 border border-[#5682F2]/20 rounded-xl px-3 py-2.5">
        <Wallet className="size-4 text-[#5682F2] shrink-0" />
        <span className="text-muted-foreground">Alerte automatique si ta tr&eacute;sorerie passe sous ton seuil &mdash; anticipe les mois creux.</span>
      </div>
    </div>
  );
}

/* ── Pipeline ── */
function PipelinePanel() {
  const columns = [
    { title: "Lead", color: "#94a3b8", cards: [{ name: "SaaS RH", amount: "6 000 €", prob: "30%" }, { name: "App mobile", amount: "12 000 €", prob: "20%" }] },
    { title: "Devis envoyé", color: "#F4BE7E", cards: [{ name: "Refonte site", amount: "8 000 €", prob: "60%" }] },
    { title: "Signé", color: "#4ade80", cards: [{ name: "Retainer SEO", amount: "2 500 €/mo", prob: "100%" }] },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Pipeline commercial</span>
        <span className="text-[11px] text-muted-foreground/70">CA pondéré à venir : <span className="text-foreground font-semibold">11 400 €</span></span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {columns.map((col) => (
          <div key={col.title} className="space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} /> {col.title}
            </div>
            {col.cards.map((c) => (
              <div key={c.name} className="bg-muted/25 border border-border rounded-lg p-2.5">
                <div className="text-xs font-semibold text-foreground truncate">{c.name}</div>
                <div className="text-[11px] text-foreground mt-1">{c.amount}</div>
                <div className="text-[10px] text-muted-foreground/70">{c.prob} de closing</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-xs bg-muted/20 border border-border rounded-xl px-3 py-2.5">
        <Kanban className="size-4 text-[#5682F2] shrink-0" />
        <span className="text-muted-foreground">Glisse tes opportunit&eacute;s d&apos;une colonne &agrave; l&apos;autre &mdash; Freelens pond&egrave;re ton CA &agrave; venir.</span>
      </div>
    </div>
  );
}

/* ── Calendrier fiscal ── */
function FiscalPanel() {
  const deadlines = [
    { date: "5 août", label: "Cotisations URSSAF", amount: "3 210 €", tone: "#f87171" },
    { date: "20 août", label: "Déclaration TVA", amount: "1 180 €", tone: "#F4BE7E" },
    { date: "15 sept.", label: "Acompte impôt sur le revenu", amount: "2 040 €", tone: "#5682F2" },
    { date: "30 sept.", label: "CFE", amount: "620 €", tone: "#a78bfa" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-foreground">Prochaines échéances</span>
        <span className="text-[11px] text-muted-foreground/70">selon ton statut</span>
      </div>
      {deadlines.map((d) => (
        <div key={d.label} className="flex items-center gap-3 bg-muted/20 border border-border rounded-xl px-4 py-3">
          <div className="flex flex-col items-center justify-center w-14 shrink-0 rounded-lg py-1.5" style={{ backgroundColor: `${d.tone}15` }}>
            <span className="text-[10px] uppercase font-semibold" style={{ color: d.tone }}>{d.date.split(" ")[1]}</span>
            <span className="text-sm font-bold" style={{ color: d.tone }}>{d.date.split(" ")[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{d.label}</div>
            <div className="text-[11px] text-muted-foreground/70">Provisionné automatiquement</div>
          </div>
          <span className="text-sm font-bold text-foreground shrink-0">{d.amount}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 text-xs bg-[#4ade80]/8 border border-[#4ade80]/20 rounded-xl px-3 py-2.5">
        <CalendarDays className="size-4 text-[#4ade80] shrink-0" />
        <span className="text-muted-foreground">Synchronis&eacute; avec ton statut &mdash; plus jamais de retard ni de mauvaise surprise.</span>
      </div>
    </div>
  );
}
