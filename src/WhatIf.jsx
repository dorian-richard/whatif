import { useState, useMemo } from "react";

// ─── DATA & CONSTANTS ───
const MONTHS_SHORT = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const SEASONALITY = [0.88,0.92,1.05,1.08,1.06,0.98,0.78,0.58,1.12,1.18,1.08,0.82];

const PRESET_SCENARIOS = [
  { id: "vacation", icon: "🏖️", title: "Prendre des vacances", desc: "Combien me coûtent vraiment 3 semaines off ?", changes: { vacationWeeks: 3 } },
  { id: "raise", icon: "📈", title: "Augmenter mes tarifs de 20%", desc: "Impact si j'augmente sur les nouveaux devis", changes: { rateChange: 20 } },
  { id: "lose_big", icon: "💔", title: "Perdre mon plus gros client", desc: "Worst case : mon client #1 part demain", changes: { lostClientIndex: 0 } },
  { id: "scale", icon: "🚀", title: "Prendre 2 clients de plus", desc: "J'accepte 2 nouvelles missions", changes: { newClients: 2 } },
  { id: "parttime", icon: "⏰", title: "Passer à 4j/semaine", desc: "Travailler moins pour vivre mieux ?", changes: { workDaysPerWeek: 4 } },
  { id: "invest", icon: "📚", title: "1 mois de formation", desc: "Arrêter 1 mois pour monter en compétence", changes: { vacationWeeks: 4, rateChangeAfter: 15 } },
];

const DEFAULT_PROFILE = {
  clients: [
    { name: "Client A", tjm: 450, daysPerMonth: 6 },
    { name: "Client B", tjm: 400, daysPerMonth: 5 },
    { name: "Client C", tjm: 500, daysPerMonth: 4 },
    { name: "Client D", tjm: 350, daysPerMonth: 3.5 },
    { name: "Client E", tjm: 380, daysPerMonth: 2.5 },
    { name: "Client F", tjm: 300, daysPerMonth: 2 },
  ],
  monthlyExpenses: 1800,
  savings: 10000,
  adminHoursPerWeek: 6,
  workDaysPerWeek: 5,
};

const clientCA = (c) => c.tjm * c.daysPerMonth;
const clientsCA = (clients) => clients.reduce((s, c) => s + clientCA(c), 0);
const clientsDays = (clients) => clients.reduce((s, c) => s + c.daysPerMonth, 0);

const DEFAULT_SIM = {
  vacationWeeks: 0,
  rateChange: 0,
  rateChangeAfter: 0,
  lostClientIndex: -1,
  newClients: 0,
  workDaysPerWeek: 5,
  expenseChange: 0,
  savingsInjection: 0,
};

// ─── HELPERS ───
const fmt = (n) => Math.round(n).toLocaleString("fr-FR");
const pct = (n) => (n >= 0 ? "+" : "") + n.toFixed(0) + "%";

// ─── COMPONENTS ───

function StepIndicator({ step, total }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            i < step ? "bg-indigo-600 text-white" : i === step ? "bg-indigo-100 text-indigo-600 ring-2 ring-indigo-600" : "bg-gray-100 text-gray-400"
          }`}>{i + 1}</div>
          {i < total - 1 && <div className={`w-8 h-0.5 ${i < step ? "bg-indigo-600" : "bg-gray-200"}`} />}
        </div>
      ))}
    </div>
  );
}

function ClientInput({ clients, onChange }) {
  const update = (idx, field, val) => {
    const c = [...clients];
    c[idx] = { ...c[idx], [field]: field === "name" ? val : Number(val) || 0 };
    onChange(c);
  };
  const add = () => onChange([...clients, { name: `Client ${String.fromCharCode(65 + clients.length)}`, tjm: 400, daysPerMonth: 3 }]);
  const remove = (idx) => onChange(clients.filter((_, i) => i !== idx));
  const total = clientsCA(clients);
  const totalDays = clientsDays(clients);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 font-medium px-1">
        <div className="col-span-4">Nom</div>
        <div className="col-span-2">TJM (€)</div>
        <div className="col-span-2">Jours/mois</div>
        <div className="col-span-3 text-right">= CA/mois</div>
        <div className="col-span-1"></div>
      </div>
      {clients.map((c, i) => {
        const ca = clientCA(c);
        return (
          <div key={i} className="grid grid-cols-12 gap-2 items-center group">
            <input className="col-span-4 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              value={c.name} onChange={(e) => update(i, "name", e.target.value)} />
            <div className="col-span-2 relative">
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-200"
                type="number" value={c.tjm} onChange={(e) => update(i, "tjm", e.target.value)} />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-300 pointer-events-none">€/j</span>
            </div>
            <div className="col-span-2 relative">
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-200"
                type="number" step="0.5" value={c.daysPerMonth} onChange={(e) => update(i, "daysPerMonth", e.target.value)} />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-300 pointer-events-none">j</span>
            </div>
            <div className="col-span-3 text-right">
              <span className="inline-block bg-indigo-50 text-indigo-700 font-bold text-sm px-3 py-2 rounded-lg w-full text-right">
                {fmt(ca)}€
              </span>
            </div>
            <button onClick={() => remove(i)} className="col-span-1 text-gray-300 hover:text-red-500 transition-colors text-lg opacity-0 group-hover:opacity-100">×</button>
          </div>
        );
      })}
      <button onClick={add} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all">
        + Ajouter un client
      </button>
      <div className="grid grid-cols-12 gap-2 mt-2 pt-3 border-t border-gray-100">
        <div className="col-span-4 text-sm font-medium text-gray-500">Total</div>
        <div className="col-span-2"></div>
        <div className="col-span-2 text-right text-sm font-semibold text-gray-600">{totalDays.toFixed(1)}j</div>
        <div className="col-span-3 text-right">
          <span className="inline-block bg-indigo-600 text-white font-bold text-sm px-3 py-2 rounded-lg w-full text-right">
            {fmt(total)}€/mois
          </span>
        </div>
        <div className="col-span-1"></div>
      </div>
      <div className="text-center">
        <span className="text-xs text-gray-400">TJM moyen pondéré : <strong className="text-indigo-600">{totalDays > 0 ? fmt(total / totalDays) : 0}€/j</strong> · Taux de remplissage : <strong className="text-indigo-600">{Math.round((totalDays / 20) * 100)}%</strong></span>
      </div>
    </div>
  );
}

function Slider({ label, value, onChange, min, max, step, unit, accent, icon }) {
  const range = max - min;
  const position = ((value - min) / range) * 100;
  return (
    <div className="group">
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          {icon && <span className="text-base">{icon}</span>}{label}
        </label>
        <span className={`text-sm font-bold ${accent || "text-indigo-600"} bg-indigo-50 px-2 py-0.5 rounded-md`}>
          {value}{unit}
        </span>
      </div>
      <div className="relative">
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
        <div className="absolute -bottom-4 left-0 right-0 flex justify-between text-xs text-gray-300 pointer-events-none">
          <span>{min}{unit}</span><span>{max}{unit}</span>
        </div>
      </div>
    </div>
  );
}

function ImpactCard({ label, before, after, unit, icon, reverse }) {
  const diff = after - before;
  const pctChange = before !== 0 ? (diff / before) * 100 : 0;
  const isPositive = reverse ? diff < 0 : diff > 0;
  const isNeutral = Math.abs(diff) < 0.5;
  return (
    <div className={`rounded-2xl p-4 border transition-all ${isNeutral ? "bg-gray-50 border-gray-100" : isPositive ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-xs text-gray-400 line-through">{fmt(before)}{unit}</span>
        <span className="text-xl font-bold text-gray-900">{fmt(after)}{unit}</span>
      </div>
      {!isNeutral && (
        <div className={`text-xs font-bold mt-1 ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
          {diff > 0 ? "+" : ""}{fmt(diff)}{unit} ({pctChange > 0 ? "+" : ""}{pctChange.toFixed(1)}%)
        </div>
      )}
    </div>
  );
}

function TimelineChart({ before, after }) {
  const allVals = [...before, ...after];
  const max = Math.max(...allVals) * 1.12;
  const min = Math.min(...allVals, 0);
  const range = max - min;
  const H = 180;
  const W = 520;
  const padL = 45;
  const padR = 10;
  const chartW = W - padL - padR;

  const toY = (v) => H - ((v - min) / range) * (H - 30) - 15;
  const toX = (i) => padL + (i / 11) * chartW;

  const pathBefore = before.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" ");
  const pathAfter = after.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" ");
  const areaBefore = pathBefore + ` L${toX(11)},${H - 10} L${toX(0)},${H - 10} Z`;
  const areaAfter = pathAfter + ` L${toX(11)},${H - 10} L${toX(0)},${H - 10} Z`;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-800">Projection mois par mois</h3>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-indigo-500 inline-block rounded"></span>Actuel</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-orange-500 inline-block rounded"></span>Simulé</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((p) => {
          const val = min + p * range;
          const y = toY(val);
          return (
            <g key={p}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#f3f4f6" strokeWidth="1" />
              <text x={padL - 5} y={y + 4} textAnchor="end" fill="#c0c0c0" fontSize="9">{(val / 1000).toFixed(1)}k</text>
            </g>
          );
        })}
        <path d={areaBefore} fill="rgba(99,102,241,0.08)" />
        <path d={areaAfter} fill="rgba(251,146,60,0.08)" />
        <path d={pathBefore} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={pathAfter} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,4" />
        {before.map((v, i) => (
          <g key={`b${i}`}>
            <circle cx={toX(i)} cy={toY(v)} r="3.5" fill="#6366f1" />
            <circle cx={toX(i)} cy={toY(after[i])} r="3.5" fill="#f97316" />
            <text x={toX(i)} y={H + 14} textAnchor="middle" fill="#b0b0b0" fontSize="9">{MONTHS_SHORT[i]}</text>
          </g>
        ))}
        {after.map((v, i) => {
          const diff = v - before[i];
          if (Math.abs(diff) > 200) {
            return (
              <text key={`d${i}`} x={toX(i)} y={toY(v) - 10} textAnchor="middle" fill={diff > 0 ? "#10b981" : "#ef4444"} fontSize="8" fontWeight="bold">
                {diff > 0 ? "+" : ""}{(diff / 1000).toFixed(1)}k
              </text>
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
}

function EmotionalMetrics({ before, after, profile, sim }) {
  const beforeAnnual = before.reduce((a, b) => a + b, 0);
  const afterAnnual = after.reduce((a, b) => a + b, 0);

  const totalHoursBefore = clientsDays(profile.clients) * 7.5;
  const weeklyBefore = (totalHoursBefore / 4.33) + profile.adminHoursPerWeek;
  const workDaysAfter = sim.workDaysPerWeek;
  const maxWeeklyAfter = workDaysAfter * 8;

  const freedomDaysBefore = Math.round((profile.workDaysPerWeek === 5 ? 0 : (5 - profile.workDaysPerWeek) * 52) + 0);
  const freedomDaysAfter = Math.round((5 - workDaysAfter) * 52 + sim.vacationWeeks * 5);

  const savingsEndBefore = profile.savings + (beforeAnnual - profile.monthlyExpenses * 12);
  const savingsEndAfter = profile.savings + sim.savingsInjection + (afterAnnual - (profile.monthlyExpenses + sim.expenseChange) * 12);

  const runwayBefore = profile.monthlyExpenses > 0 ? profile.savings / profile.monthlyExpenses : 99;
  const runwayAfter = (profile.monthlyExpenses + sim.expenseChange) > 0 ? (profile.savings + sim.savingsInjection) / (profile.monthlyExpenses + sim.expenseChange) : 99;

  const stressBefore = Math.min(100, Math.max(0, Math.round(
    (weeklyBefore > 40 ? (weeklyBefore - 40) * 3 : 0) + (runwayBefore < 3 ? (3 - runwayBefore) * 15 : 0) + 20
  )));
  const stressAfter = Math.min(100, Math.max(0, Math.round(
    (maxWeeklyAfter > 40 ? (maxWeeklyAfter - 40) * 2 : 0) + (runwayAfter < 3 ? (3 - runwayAfter) * 15 : 0) +
    (sim.lostClientIndex >= 0 ? 20 : 0) + (sim.vacationWeeks > 0 ? -sim.vacationWeeks * 2 : 0) + 20
  )));

  const metrics = [
    { icon: "🗓️", label: "Jours de liberté/an", before: freedomDaysBefore, after: freedomDaysAfter, unit: "j", reverse: false },
    { icon: "💰", label: "Épargne fin d'année", before: Math.round(savingsEndBefore), after: Math.round(savingsEndAfter), unit: "€", reverse: false },
    { icon: "🛟", label: "Runway de sécurité", before: parseFloat(runwayBefore.toFixed(1)), after: parseFloat(runwayAfter.toFixed(1)), unit: " mois", reverse: false },
    { icon: "😰", label: "Indice de stress", before: stressBefore, after: stressAfter, unit: "/100", reverse: true },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-bold text-gray-800 mb-4">Ce que ça change dans ta vie</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m, i) => {
          const diff = m.after - m.before;
          const isPositive = m.reverse ? diff < 0 : diff > 0;
          const isNeutral = Math.abs(diff) < 0.5;
          return (
            <div key={i} className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="text-2xl mb-1">{m.icon}</div>
              <div className="text-xs text-gray-500 mb-1">{m.label}</div>
              <div className="text-lg font-bold text-gray-800">{typeof m.after === 'number' && m.after > 999 ? fmt(m.after) : m.after}{m.unit}</div>
              {!isNeutral && (
                <div className={`text-xs font-bold ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                  {diff > 0 ? "+" : ""}{typeof diff === 'number' && Math.abs(diff) > 999 ? fmt(diff) : diff.toFixed?.(1) ?? diff}{m.unit}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Verdict({ before, after, sim }) {
  const beforeAnnual = before.reduce((a, b) => a + b, 0);
  const afterAnnual = after.reduce((a, b) => a + b, 0);
  const diff = afterAnnual - beforeAnnual;
  const pctDiff = beforeAnnual > 0 ? (diff / beforeAnnual) * 100 : 0;

  const messages = [];
  if (sim.vacationWeeks > 0) messages.push(`${sim.vacationWeeks} semaines de repos te coûtent ${fmt(Math.abs(diff))}€ sur l'année — soit ${fmt(Math.abs(diff / sim.vacationWeeks))}/semaine.`);
  if (sim.rateChange > 0) messages.push(`+${sim.rateChange}% de tarifs génèrent +${fmt(Math.max(0, diff))}€/an, même en perdant quelques clients.`);
  if (sim.rateChange < 0) messages.push(`Baisser tes tarifs de ${Math.abs(sim.rateChange)}% te coûte ${fmt(Math.abs(diff))}€/an.`);
  if (sim.lostClientIndex >= 0) messages.push(`Perdre ce client = ${fmt(Math.abs(diff))}€ de manque à gagner annuel. Commence à prospecter maintenant.`);
  if (sim.newClients > 0) messages.push(`${sim.newClients} nouveau(x) client(s) ajoutent ~${fmt(Math.max(0, diff))}€/an après montée en charge.`);
  if (sim.workDaysPerWeek < 5) messages.push(`Passer à ${sim.workDaysPerWeek}j/sem = ${5 - sim.workDaysPerWeek} jour(s) de liberté/sem, mais ${fmt(Math.abs(diff))}€ de moins/an.`);
  if (messages.length === 0) messages.push("Ajuste les paramètres pour voir l'impact de tes décisions.");

  const emoji = pctDiff > 5 ? "🟢" : pctDiff > -5 ? "🟡" : pctDiff > -15 ? "🟠" : "🔴";
  const tone = pctDiff > 5 ? "bg-emerald-50 border-emerald-200" : pctDiff > -5 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  return (
    <div className={`rounded-2xl p-5 border ${tone}`}>
      <div className="flex items-start gap-3">
        <span className="text-3xl">{emoji}</span>
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-1">
            {pctDiff > 5 ? "Ce scénario te profite" : pctDiff > -5 ? "Impact modéré" : "Attention, impact significatif"}
          </h3>
          {messages.map((m, i) => <p key={i} className="text-sm text-gray-600 mb-1">→ {m}</p>)}
          <p className="text-xs text-gray-400 mt-2">
            Variation annuelle : <strong className={pctDiff >= 0 ? "text-emerald-600" : "text-red-600"}>{pctDiff >= 0 ? "+" : ""}{pctDiff.toFixed(1)}%</strong> soit <strong>{diff >= 0 ? "+" : ""}{fmt(diff)}€</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ───

export default function WhatIf() {
  const [view, setView] = useState("onboarding"); // onboarding | simulator
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [sim, setSim] = useState(DEFAULT_SIM);
  const [activePreset, setActivePreset] = useState(null);

  // Calculations
  const totalCA = clientsCA(profile.clients);
  const totalDays = clientsDays(profile.clients);
  const totalHours = totalDays * 7.5;

  const projection = useMemo(() => {
    const before = [];
    const after = [];
    for (let i = 0; i < 12; i++) {
      const season = SEASONALITY[i];
      const base = totalCA * season;
      before.push(base);

      let s = base;
      // Lost client
      if (sim.lostClientIndex >= 0 && sim.lostClientIndex < profile.clients.length) {
        s -= clientCA(profile.clients[sim.lostClientIndex]) * season;
      }
      // Rate change
      s *= (1 + sim.rateChange / 100);
      // Rate change after (e.g. post-formation)
      if (sim.rateChangeAfter > 0 && i >= 2) {
        s *= (1 + sim.rateChangeAfter / 100);
      }
      // New clients (progressive ramp-up over 3 months)
      const avgNewClientCA = totalCA / Math.max(1, profile.clients.length);
      s += sim.newClients * avgNewClientCA * Math.min(1, (i + 1) / 3) * season;
      // Work days reduction
      if (sim.workDaysPerWeek < 5) {
        s *= sim.workDaysPerWeek / 5;
      }
      // Vacation (block off months proportionally)
      if (sim.vacationWeeks > 0) {
        const vacMonths = sim.vacationWeeks / 4.33;
        if (i < Math.floor(vacMonths)) {
          s *= 0.05; // Almost nothing during full vacation months
        } else if (i < Math.ceil(vacMonths)) {
          s *= 1 - (vacMonths % 1) * 0.95;
        }
      }
      // Expense change affects net (but we show gross CA)
      after.push(Math.max(0, s));
    }
    return { before, after };
  }, [totalCA, profile.clients, sim]);

  const applyPreset = (preset) => {
    if (activePreset === preset.id) {
      setSim(DEFAULT_SIM);
      setActivePreset(null);
    } else {
      setSim({ ...DEFAULT_SIM, ...preset.changes });
      setActivePreset(preset.id);
    }
  };

  const resetSim = () => {
    setSim(DEFAULT_SIM);
    setActivePreset(null);
  };

  // ─── ONBOARDING ───
  if (view === "onboarding") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-200">🔮</div>
              <h1 className="text-3xl font-bold text-gray-900">WhatIf</h1>
            </div>
            <p className="text-gray-500">Simule chaque décision avant de la prendre.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
            <StepIndicator step={onboardingStep} total={3} />

            {onboardingStep === 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Tes clients actuels</h2>
                <p className="text-sm text-gray-400 mb-5">Ajoute tes clients et leur CA mensuel. On peut ajuster après.</p>
                <ClientInput clients={profile.clients} onChange={(c) => setProfile({ ...profile, clients: c })} />
                <div className="mt-4 p-3 bg-indigo-50 rounded-xl text-center">
                  <span className="text-sm text-indigo-600 font-medium">CA total : <strong>{fmt(clientsCA(profile.clients))}€/mois</strong> · {clientsDays(profile.clients).toFixed(1)}j facturés/mois</span>
                </div>
              </div>
            )}

            {onboardingStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Ton rythme de travail</h2>
                  <p className="text-sm text-gray-400 mb-5">On a besoin de ces infos pour des simulations réalistes.</p>
                </div>
                <Slider label="Jours de travail / semaine" value={profile.workDaysPerWeek} onChange={(v) => setProfile({ ...profile, workDaysPerWeek: v })}
                  min={3} max={6} step={1} unit="j" icon="📅" />
                <Slider label="Heures admin / semaine" value={profile.adminHoursPerWeek} onChange={(v) => setProfile({ ...profile, adminHoursPerWeek: v })}
                  min={0} max={20} step={1} unit="h" icon="📋" />
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Ta situation financière</h2>
                  <p className="text-sm text-gray-400 mb-5">Pour calculer ton runway et tes marges de manœuvre.</p>
                </div>
                <Slider label="Charges mensuelles fixes" value={profile.monthlyExpenses} onChange={(v) => setProfile({ ...profile, monthlyExpenses: v })}
                  min={500} max={6000} step={100} unit="€" icon="🧾" />
                <Slider label="Épargne de sécurité" value={profile.savings} onChange={(v) => setProfile({ ...profile, savings: v })}
                  min={0} max={60000} step={1000} unit="€" icon="🏦" />
              </div>
            )}

            <div className="flex justify-between mt-8">
              {onboardingStep > 0 ? (
                <button onClick={() => setOnboardingStep(onboardingStep - 1)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                  ← Retour
                </button>
              ) : <div />}
              {onboardingStep < 2 ? (
                <button onClick={() => setOnboardingStep(onboardingStep + 1)}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                  Continuer →
                </button>
              ) : (
                <button onClick={() => setView("simulator")}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                  🔮 Lancer le simulateur
                </button>
              )}
            </div>
          </div>

          <button onClick={() => setView("simulator")} className="w-full text-center mt-4 text-xs text-gray-400 hover:text-indigo-500 transition-colors">
            Passer avec les données de démo →
          </button>
        </div>
      </div>
    );
  }

  // ─── SIMULATOR ───
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg">🔮</div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">WhatIf</h1>
              <p className="text-xs text-gray-400">{fmt(totalCA)}€/mois · {profile.clients.length} clients · {totalDays.toFixed(1)}j facturés</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={resetSim}
              className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
              Réinitialiser
            </button>
            <button onClick={() => { setView("onboarding"); setOnboardingStep(0); }}
              className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
              ✏️ Modifier profil
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">
        {/* Presets */}
        <div>
          <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400 mb-3">Scénarios rapides</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {PRESET_SCENARIOS.map((p) => (
              <button key={p.id} onClick={() => applyPreset(p)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  activePreset === p.id
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "bg-white border-gray-100 hover:border-indigo-200 hover:shadow-md"
                }`}>
                <span className="text-xl">{p.icon}</span>
                <div className={`text-xs font-semibold mt-1 ${activePreset === p.id ? "text-white" : "text-gray-800"}`}>{p.title}</div>
                <div className={`text-xs mt-0.5 ${activePreset === p.id ? "text-indigo-200" : "text-gray-400"}`}>{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom sliders */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">Ajustement fin</h3>
            {activePreset && (
              <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">
                Scénario "{PRESET_SCENARIOS.find(p => p.id === activePreset)?.title}" actif
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <Slider icon="🏖️" label="Semaines de vacances" value={sim.vacationWeeks} onChange={(v) => { setSim({ ...sim, vacationWeeks: v }); setActivePreset(null); }}
              min={0} max={12} step={1} unit=" sem" />
            <Slider icon="📈" label="Variation de tarifs" value={sim.rateChange} onChange={(v) => { setSim({ ...sim, rateChange: v }); setActivePreset(null); }}
              min={-30} max={50} step={5} unit="%" />
            <Slider icon="🆕" label="Nouveaux clients" value={sim.newClients} onChange={(v) => { setSim({ ...sim, newClients: v }); setActivePreset(null); }}
              min={0} max={5} step={1} unit="" />
            <Slider icon="⏰" label="Jours de travail / semaine" value={sim.workDaysPerWeek} onChange={(v) => { setSim({ ...sim, workDaysPerWeek: v }); setActivePreset(null); }}
              min={3} max={6} step={1} unit="j" />
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
                <span className="text-base">💔</span>Perte d'un client
              </label>
              <select value={sim.lostClientIndex} onChange={(e) => { setSim({ ...sim, lostClientIndex: Number(e.target.value) }); setActivePreset(null); }}
                className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                <option value={-1}>— Aucune perte —</option>
                {profile.clients.map((c, i) => (
                  <option key={i} value={i}>{c.name} · {c.tjm}€/j × {c.daysPerMonth}j = {fmt(clientCA(c))}€/mois ({((clientCA(c) / totalCA) * 100).toFixed(0)}%)</option>
                ))}
              </select>
            </div>
            <Slider icon="🧾" label="Variation charges mensuelles" value={sim.expenseChange} onChange={(v) => { setSim({ ...sim, expenseChange: v }); setActivePreset(null); }}
              min={-500} max={1000} step={50} unit="€" />
          </div>
        </div>

        {/* Verdict */}
        <Verdict before={projection.before} after={projection.after} sim={sim} />

        {/* Impact cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <ImpactCard icon="💰" label="CA annuel" before={projection.before.reduce((a, b) => a + b, 0)} after={projection.after.reduce((a, b) => a + b, 0)} unit="€" />
          <ImpactCard icon="📅" label="CA mensuel moy." before={projection.before.reduce((a, b) => a + b, 0) / 12} after={projection.after.reduce((a, b) => a + b, 0) / 12} unit="€" />
          <ImpactCard icon="📉" label="Mois le plus faible" before={Math.min(...projection.before)} after={Math.min(...projection.after)} unit="€" />
          <ImpactCard icon="📈" label="Mois le plus fort" before={Math.max(...projection.before)} after={Math.max(...projection.after)} unit="€" />
          <ImpactCard icon="🎯" label="TJM moyen pondéré"
            before={totalDays > 0 ? Math.round(totalCA / totalDays) : 0}
            after={(() => {
              const afterAnnual = projection.after.reduce((a, b) => a + b, 0);
              let simDays = totalDays;
              if (sim.lostClientIndex >= 0 && sim.lostClientIndex < profile.clients.length) simDays -= profile.clients[sim.lostClientIndex].daysPerMonth;
              simDays += sim.newClients * (totalDays / Math.max(1, profile.clients.length));
              if (sim.workDaysPerWeek < 5) simDays *= sim.workDaysPerWeek / 5;
              const workingMonths = 12 - (sim.vacationWeeks / 4.33);
              return simDays > 0 ? Math.round((afterAnnual / workingMonths) / simDays) : 0;
            })()}
            unit="€/j" />
        </div>

        {/* Timeline */}
        <TimelineChart before={projection.before} after={projection.after} />

        {/* Emotional metrics */}
        <EmotionalMetrics before={projection.before} after={projection.after} profile={profile} sim={sim} />

        {/* Month detail table */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 overflow-x-auto">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Détail mois par mois</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="text-left py-2 pr-4">Mois</th>
                <th className="text-right py-2 px-3">Actuel</th>
                <th className="text-right py-2 px-3">Simulé</th>
                <th className="text-right py-2 px-3">Diff.</th>
                <th className="text-right py-2 pl-3">Net estimé</th>
              </tr>
            </thead>
            <tbody>
              {MONTHS_SHORT.map((m, i) => {
                const diff = projection.after[i] - projection.before[i];
                const net = projection.after[i] - profile.monthlyExpenses - sim.expenseChange;
                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2 pr-4 font-medium text-gray-700">{m}</td>
                    <td className="text-right py-2 px-3 text-gray-500">{fmt(projection.before[i])}€</td>
                    <td className="text-right py-2 px-3 font-semibold text-gray-800">{fmt(projection.after[i])}€</td>
                    <td className={`text-right py-2 px-3 font-bold ${diff >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {diff >= 0 ? "+" : ""}{fmt(diff)}€
                    </td>
                    <td className={`text-right py-2 pl-3 ${net >= 0 ? "text-gray-700" : "text-red-600 font-bold"}`}>
                      {fmt(net)}€ {net < 0 && "⚠️"}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-gray-200 font-bold">
                <td className="py-3 pr-4 text-gray-900">TOTAL</td>
                <td className="text-right py-3 px-3 text-gray-600">{fmt(projection.before.reduce((a, b) => a + b, 0))}€</td>
                <td className="text-right py-3 px-3 text-gray-900">{fmt(projection.after.reduce((a, b) => a + b, 0))}€</td>
                <td className={`text-right py-3 px-3 ${projection.after.reduce((a, b) => a + b, 0) - projection.before.reduce((a, b) => a + b, 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {(projection.after.reduce((a, b) => a + b, 0) - projection.before.reduce((a, b) => a + b, 0)) >= 0 ? "+" : ""}
                  {fmt(projection.after.reduce((a, b) => a + b, 0) - projection.before.reduce((a, b) => a + b, 0))}€
                </td>
                <td className="text-right py-3 pl-3 text-gray-900">
                  {fmt(projection.after.reduce((a, b) => a + b, 0) - (profile.monthlyExpenses + sim.expenseChange) * 12)}€
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-center text-white">
          <h3 className="text-lg font-bold mb-2">Prêt à prendre des décisions éclairées ?</h3>
          <p className="text-sm text-indigo-200 mb-4">Connecte tes vrais revenus pour des simulations encore plus précises.</p>
          <div className="flex justify-center gap-3">
            <button className="px-5 py-2.5 bg-white text-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors">
              Connecter Stripe
            </button>
            <button className="px-5 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-400 transition-colors border border-indigo-400">
              Importer des factures
            </button>
          </div>
        </div>
      </div>

      <div className="text-center py-6 text-xs text-gray-300">WhatIf — Simulateur de décisions freelance · Prototype MVP</div>
    </div>
  );
}
