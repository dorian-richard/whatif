"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSimulatorStore } from "@/stores/useSimulatorStore";
import { useProfileStore } from "@/stores/useProfileStore";
import { simulate } from "@/lib/simulation-engine";
import { fmt } from "@/lib/utils";
import type { SimulationParams } from "@/types";

interface SavedScenario {
  id: string;
  name: string;
  icon: string;
  description: string;
  params: SimulationParams;
  savedAt: string;
  annualDiff: number;
}

export default function ScenariosPage() {
  const router = useRouter();
  const sim = useSimulatorStore();
  const profile = useProfileStore();

  const [scenarios, setScenarios] = useState<SavedScenario[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("whatif_scenarios") || "[]");
    } catch {
      return [];
    }
  });

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("🔮");
  const [newDesc, setNewDesc] = useState("");

  const saveScenario = () => {
    const params: SimulationParams = {
      vacationWeeks: sim.vacationWeeks,
      rateChange: sim.rateChange,
      rateChangeAfter: sim.rateChangeAfter,
      lostClientIndex: sim.lostClientIndex,
      newClients: sim.newClients,
      workDaysPerWeek: sim.workDaysPerWeek,
      expenseChange: sim.expenseChange,
    };

    const projection = simulate(profile.clients, params, profile);
    const beforeTotal = projection.before.reduce((a, b) => a + b, 0);
    const afterTotal = projection.after.reduce((a, b) => a + b, 0);

    const scenario: SavedScenario = {
      id: crypto.randomUUID(),
      name: newName || "Sans nom",
      icon: newIcon,
      description: newDesc,
      params,
      savedAt: new Date().toISOString(),
      annualDiff: afterTotal - beforeTotal,
    };

    const updated = [scenario, ...scenarios];
    setScenarios(updated);
    localStorage.setItem("whatif_scenarios", JSON.stringify(updated));
    setShowSaveModal(false);
    setNewName("");
    setNewDesc("");
  };

  const loadScenario = (scenario: SavedScenario) => {
    const p = scenario.params;
    sim.setParam("vacationWeeks", p.vacationWeeks);
    sim.setParam("rateChange", p.rateChange);
    sim.setParam("rateChangeAfter", p.rateChangeAfter);
    sim.setParam("lostClientIndex", p.lostClientIndex);
    sim.setParam("newClients", p.newClients);
    sim.setParam("workDaysPerWeek", p.workDaysPerWeek);
    sim.setParam("expenseChange", p.expenseChange);
    router.push("/simulator");
  };

  const deleteScenario = (id: string) => {
    const updated = scenarios.filter((s) => s.id !== id);
    setScenarios(updated);
    localStorage.setItem("whatif_scenarios", JSON.stringify(updated));
  };

  const ICON_OPTIONS = ["🔮", "🏖️", "📈", "💔", "🚀", "⏰", "📚", "💡", "🎯", "🛟"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/simulator")} className="text-gray-400 hover:text-gray-600">&larr;</button>
            <h1 className="text-lg font-bold text-gray-900">Scenarios sauvegardes</h1>
          </div>
          <button
            onClick={() => setShowSaveModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            + Sauvegarder le scenario actuel
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {scenarios.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun scenario sauvegarde</h2>
            <p className="text-sm text-gray-400 mb-6">Configure le simulateur puis sauvegarde ton scenario ici.</p>
            <button onClick={() => router.push("/simulator")} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
              Aller au simulateur
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {scenarios.map((s) => (
              <div key={s.id} className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-4">
                <span className="text-3xl">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{s.name}</h3>
                  {s.description && <p className="text-xs text-gray-400 truncate">{s.description}</p>}
                  <p className="text-xs text-gray-300 mt-0.5">{new Date(s.savedAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <span className={`text-sm font-bold px-3 py-1 rounded-full shrink-0 ${s.annualDiff >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                  {s.annualDiff >= 0 ? "+" : ""}{fmt(s.annualDiff)}&euro;/an
                </span>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => loadScenario(s)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100">Charger</button>
                  <button onClick={() => deleteScenario(s.id)} className="px-3 py-1.5 text-gray-400 hover:text-red-500 rounded-lg text-xs font-medium hover:bg-red-50">Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Sauvegarder le scenario</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Icone</label>
                <div className="flex gap-2 flex-wrap">
                  {ICON_OPTIONS.map((icon) => (
                    <button key={icon} onClick={() => setNewIcon(icon)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${newIcon === icon ? "bg-indigo-100 ring-2 ring-indigo-600" : "bg-gray-50 hover:bg-gray-100"}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nom</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Scenario vacances ete"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Description (optionnel)</label>
                <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Ex: Impact de 3 semaines off en aout"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Annuler</button>
              <button onClick={saveScenario} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Sauvegarder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
