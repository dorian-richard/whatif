"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSimulatorStore } from "@/stores/useSimulatorStore";
import { useProfileStore } from "@/stores/useProfileStore";
import { simulate, computeNetFromCA } from "@/lib/simulation-engine";
import { fmt, cn } from "@/lib/utils";
import {
  Icon,
  ClipboardList,
  Plus,
  Sparkles,
  Zap,
  Search,
  X,
} from "@/components/ui/icons";
import {
  PRESET_SCENARIOS,
  SCENARIO_CATEGORIES,
  DEFAULT_SIM,
  type ScenarioCategory,
} from "@/lib/constants";
import { Slider } from "@/components/ui/slider";
import type { SimulationParams } from "@/types";

/* ─── Types ─── */
interface SavedScenario {
  id: string;
  name: string;
  icon: string;
  description: string;
  params: SimulationParams;
  savedAt: string;
  annualCA: number;
  annualNet: number;
  annualDiff: number;
}

/* ─── Param labels for display ─── */
function getParamTags(params: SimulationParams, profileDays: number): string[] {
  const tags: string[] = [];
  if (params.vacationWeeks > 0) tags.push(`${params.vacationWeeks} sem. off`);
  if (params.rateChange !== 0) tags.push(`${params.rateChange > 0 ? "+" : ""}${params.rateChange}% tarifs`);
  if (params.rateChangeAfter > 0) tags.push(`+${params.rateChangeAfter}% après M3`);
  if (params.lostClientIndex >= 0) tags.push(`Perte client #${params.lostClientIndex + 1}`);
  if (params.newClients > 0) tags.push(`+${params.newClients} client${params.newClients > 1 ? "s" : ""}`);
  if (params.workDaysPerWeek !== profileDays) tags.push(`${params.workDaysPerWeek}j/sem`);
  if (params.expenseChange !== 0) tags.push(`${params.expenseChange > 0 ? "+" : ""}${params.expenseChange}\u20AC charges`);
  return tags;
}

function isDefaultParams(params: SimulationParams, profileDays: number): boolean {
  return (
    params.vacationWeeks === 0 &&
    params.rateChange === 0 &&
    params.rateChangeAfter === 0 &&
    params.lostClientIndex === -1 &&
    params.newClients === 0 &&
    params.workDaysPerWeek === profileDays &&
    params.expenseChange === 0
  );
}

/* ─── Icon picker options ─── */
const ICON_OPTIONS = [
  "sparkles", "palmtree", "trending-up", "heart-crack", "rocket",
  "clock", "book-open", "lightbulb", "target", "life-buoy",
  "shield", "sun", "zap", "flame", "trending-down",
];

/* ─── Preset category colors ─── */
const CAT_COLORS: Record<ScenarioCategory, { bg: string; text: string }> = {
  croissance: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  equilibre: { bg: "bg-[#5682F2]/15", text: "text-[#5682F2]" },
  risque: { bg: "bg-amber-500/15", text: "text-amber-400" },
};

/* ─── Main page ─── */
export default function ScenariosPage() {
  const router = useRouter();
  const sim = useSimulatorStore();
  const profile = useProfileStore();

  /* ─── Saved scenarios from localStorage ─── */
  const [scenarios, setScenarios] = useState<SavedScenario[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("freelens_scenarios") || "[]");
    } catch {
      return [];
    }
  });

  /* ─── Modal state ─── */
  const [modal, setModal] = useState<"save" | "create" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("sparkles");
  const [newDesc, setNewDesc] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  /* ─── Create-from-scratch params ─── */
  const [createParams, setCreateParams] = useState<SimulationParams>({
    ...DEFAULT_SIM,
    workDaysPerWeek: profile.workDaysPerWeek,
  });

  /* ─── Current simulator params (for save modal) ─── */
  const currentParams: SimulationParams = {
    vacationWeeks: sim.vacationWeeks,
    rateChange: sim.rateChange,
    rateChangeAfter: sim.rateChangeAfter,
    lostClientIndex: sim.lostClientIndex,
    newClients: sim.newClients,
    workDaysPerWeek: sim.workDaysPerWeek,
    expenseChange: sim.expenseChange,
  };

  const hasCurrentChanges = !isDefaultParams(currentParams, profile.workDaysPerWeek);

  /* ─── Compute impact for given params ─── */
  function computeImpact(params: SimulationParams) {
    const projection = simulate(profile.clients, params, profile);
    const beforeCA = projection.before.reduce((a, b) => a + b, 0);
    const afterCA = projection.after.reduce((a, b) => a + b, 0);
    const beforeNet = computeNetFromCA(beforeCA, profile) - profile.monthlyExpenses * 12;
    const afterNet = computeNetFromCA(afterCA, profile) - (profile.monthlyExpenses + params.expenseChange) * 12;
    return { annualCA: afterCA, annualNet: afterNet, annualDiff: afterCA - beforeCA, netDiff: afterNet - beforeNet };
  }

  /* ─── Save scenario ─── */
  function saveScenario(params: SimulationParams) {
    const impact = computeImpact(params);
    const scenario: SavedScenario = {
      id: editId ?? crypto.randomUUID(),
      name: newName || "Sans nom",
      icon: newIcon,
      description: newDesc,
      params,
      savedAt: new Date().toISOString(),
      annualCA: impact.annualCA,
      annualNet: impact.annualNet,
      annualDiff: impact.annualDiff,
    };

    let updated: SavedScenario[];
    if (editId) {
      updated = scenarios.map((s) => (s.id === editId ? scenario : s));
    } else {
      updated = [scenario, ...scenarios];
    }
    setScenarios(updated);
    localStorage.setItem("freelens_scenarios", JSON.stringify(updated));
    closeModal();
  }

  /* ─── Save preset as personal scenario ─── */
  function savePreset(presetId: string) {
    const preset = PRESET_SCENARIOS.find((p) => p.id === presetId);
    if (!preset) return;
    const params: SimulationParams = { ...DEFAULT_SIM, workDaysPerWeek: profile.workDaysPerWeek, ...preset.changes };
    const impact = computeImpact(params);
    const scenario: SavedScenario = {
      id: crypto.randomUUID(),
      name: preset.title,
      icon: preset.icon,
      description: `Scénario preset : ${preset.title}`,
      params,
      savedAt: new Date().toISOString(),
      annualCA: impact.annualCA,
      annualNet: impact.annualNet,
      annualDiff: impact.annualDiff,
    };
    const updated = [scenario, ...scenarios];
    setScenarios(updated);
    localStorage.setItem("freelens_scenarios", JSON.stringify(updated));
  }

  /* ─── Load scenario into simulator ─── */
  function loadScenario(s: SavedScenario) {
    const p = s.params;
    sim.setParam("vacationWeeks", p.vacationWeeks);
    sim.setParam("rateChange", p.rateChange);
    sim.setParam("rateChangeAfter", p.rateChangeAfter);
    sim.setParam("lostClientIndex", p.lostClientIndex);
    sim.setParam("newClients", p.newClients);
    sim.setParam("workDaysPerWeek", p.workDaysPerWeek);
    sim.setParam("expenseChange", p.expenseChange);
    router.push("/simulator");
  }

  /* ─── Delete scenario ─── */
  function deleteScenario(id: string) {
    const updated = scenarios.filter((s) => s.id !== id);
    setScenarios(updated);
    localStorage.setItem("freelens_scenarios", JSON.stringify(updated));
  }

  /* ─── Open edit modal ─── */
  function openEdit(s: SavedScenario) {
    setEditId(s.id);
    setNewName(s.name);
    setNewIcon(s.icon);
    setNewDesc(s.description);
    setModal("edit");
  }

  /* ─── Close modal ─── */
  function closeModal() {
    setModal(null);
    setEditId(null);
    setNewName("");
    setNewIcon("sparkles");
    setNewDesc("");
    setCreateParams({ ...DEFAULT_SIM, workDaysPerWeek: profile.workDaysPerWeek });
  }

  /* ─── Filter scenarios ─── */
  const filteredScenarios = searchQuery
    ? scenarios.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : scenarios;

  /* ─── Create preview impact ─── */
  const createPreview = useMemo(
    () => computeImpact(createParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [createParams, profile.clients, profile.businessStatus, profile.monthlyExpenses]
  );

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Mes scénarios</h1>
          <p className="text-xs text-[#5a5a6e]">
            {scenarios.length} scénario{scenarios.length !== 1 ? "s" : ""} sauvegardé{scenarios.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setModal("create")}
            className="px-4 py-2 bg-white/[0.04] border border-white/[0.08] text-[#8b8b9e] rounded-full text-sm font-medium hover:bg-white/[0.06] transition-colors flex items-center gap-1.5"
          >
            <Plus className="size-3.5" />
            Créer
          </button>
          {hasCurrentChanges && (
            <button
              onClick={() => setModal("save")}
              className="px-4 py-2 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <Sparkles className="size-3.5" />
              Sauvegarder
            </button>
          )}
        </div>
      </div>

      {/* Preset quick-save section */}
      <div className="bg-[#12121c] rounded-2xl p-5 border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="size-4 text-[#F4BE7E]" />
          <h2 className="text-sm font-bold text-white">Scénarios rapides</h2>
        </div>

        {(["croissance", "equilibre", "risque"] as ScenarioCategory[]).map((cat) => (
          <div key={cat} className="mb-3 last:mb-0">
            <div className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider mb-1.5">
              {SCENARIO_CATEGORIES[cat]}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SCENARIOS.filter((p) => p.cat === cat).map((preset) => {
                const isActive = sim.activePreset === preset.id;
                return (
                  <div key={preset.id} className="flex items-center gap-0.5">
                    <button
                      onClick={() => {
                        sim.applyPreset(preset.id, preset.changes);
                        router.push("/simulator");
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-l-full text-xs font-medium transition-all duration-150 border border-r-0",
                        isActive
                          ? "bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] border-transparent text-white shadow-md shadow-[#5682F2]/20"
                          : cn("border-white/[0.08]", CAT_COLORS[cat].bg, CAT_COLORS[cat].text, "hover:border-white/[0.15]")
                      )}
                    >
                      <Icon name={preset.icon} className="size-3.5" />
                      {preset.title}
                    </button>
                    <button
                      onClick={() => savePreset(preset.id)}
                      title="Sauvegarder ce scénario"
                      className={cn(
                        "px-1.5 py-1.5 rounded-r-full text-xs transition-all duration-150 border border-l-0",
                        isActive
                          ? "bg-gradient-to-r from-[#7C5BF2] to-[#7C5BF2] border-transparent text-white/70 hover:text-white"
                          : "border-white/[0.08] bg-white/[0.03] text-[#5a5a6e] hover:text-[#8b8b9e] hover:bg-white/[0.06]"
                      )}
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Search bar (if many scenarios) */}
      {scenarios.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#5a5a6e]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un scénario..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#12121c] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-[#5a5a6e] focus:outline-none focus:ring-2 focus:ring-[#5682F2]/30"
          />
        </div>
      )}

      {/* Saved scenarios list */}
      {filteredScenarios.length === 0 && scenarios.length === 0 ? (
        <div className="text-center py-16">
          <div className="mb-4 flex justify-center">
            <div className="size-16 rounded-2xl bg-[#5682F2]/10 flex items-center justify-center">
              <ClipboardList className="size-8 text-[#5682F2]" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Aucun scénario sauvegardé</h2>
          <p className="text-sm text-[#5a5a6e] mb-6 max-w-xs mx-auto">
            Crée un scénario personnalisé ou sauvegarde la config actuelle du simulateur.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setModal("create")}
              className="px-5 py-2.5 bg-white/[0.04] border border-white/[0.08] text-white rounded-full text-sm font-medium hover:bg-white/[0.06] transition-colors"
            >
              Créer un scénario
            </button>
            <button
              onClick={() => router.push("/simulator")}
              className="px-5 py-2.5 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Aller au simulateur
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredScenarios.map((s) => {
            const tags = getParamTags(s.params, profile.workDaysPerWeek);
            const impact = computeImpact(s.params);
            return (
              <div
                key={s.id}
                className="bg-[#12121c] rounded-2xl p-5 border border-white/[0.06] hover:border-white/[0.1] transition-colors group"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="size-11 rounded-xl bg-[#5682F2]/10 flex items-center justify-center shrink-0">
                    <Icon name={s.icon} className="size-5 text-[#5682F2]" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">{s.name}</h3>
                      <span className="text-[10px] text-[#5a5a6e] shrink-0">
                        {new Date(s.savedAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    {s.description && (
                      <p className="text-xs text-[#8b8b9e] mb-2 line-clamp-1">{s.description}</p>
                    )}

                    {/* Param tags */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-[#8b8b9e] font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Impact metrics */}
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-[9px] text-[#5a5a6e] uppercase tracking-wider">CA annuel</div>
                        <div className="text-sm font-bold text-white">{fmt(impact.annualCA)}&euro;</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-[#5a5a6e] uppercase tracking-wider">Net annuel</div>
                        <div className="text-sm font-bold text-white">{fmt(impact.annualNet)}&euro;</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-[#5a5a6e] uppercase tracking-wider">Impact CA</div>
                        <div
                          className={cn(
                            "text-sm font-bold",
                            impact.annualDiff >= 0 ? "text-emerald-400" : "text-red-400"
                          )}
                        >
                          {impact.annualDiff >= 0 ? "+" : ""}
                          {fmt(impact.annualDiff)}&euro;
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => loadScenario(s)}
                      className="px-3 py-1.5 bg-[#5682F2]/15 text-[#5682F2] rounded-lg text-[11px] font-medium hover:bg-[#5682F2]/25 transition-colors"
                    >
                      Charger
                    </button>
                    <button
                      onClick={() => openEdit(s)}
                      className="px-3 py-1.5 bg-white/[0.04] text-[#8b8b9e] rounded-lg text-[11px] font-medium hover:bg-white/[0.08] transition-colors"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => deleteScenario(s.id)}
                      className="px-3 py-1.5 text-[#5a5a6e] rounded-lg text-[11px] font-medium hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── SAVE MODAL (from current simulator state) ─── */}
      {modal === "save" && (
        <ModalWrapper title="Sauvegarder la simulation" onClose={closeModal}>
          {/* Current params preview */}
          <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4 mb-4">
            <div className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider mb-2">Paramètres actuels</div>
            <div className="flex flex-wrap gap-1.5">
              {getParamTags(currentParams, profile.workDaysPerWeek).map((tag) => (
                <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-[#5682F2]/15 text-[#5682F2] font-medium">
                  {tag}
                </span>
              ))}
            </div>
            {(() => {
              const impact = computeImpact(currentParams);
              return (
                <div className="flex gap-4 mt-3 pt-3 border-t border-white/[0.06]">
                  <div>
                    <div className="text-[9px] text-[#5a5a6e] uppercase">Impact CA</div>
                    <div className={cn("text-sm font-bold", impact.annualDiff >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {impact.annualDiff >= 0 ? "+" : ""}{fmt(impact.annualDiff)}&euro;/an
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#5a5a6e] uppercase">Net annuel</div>
                    <div className="text-sm font-bold text-white">{fmt(impact.annualNet)}&euro;</div>
                  </div>
                </div>
              );
            })()}
          </div>

          <ScenarioForm
            name={newName}
            icon={newIcon}
            desc={newDesc}
            onNameChange={setNewName}
            onIconChange={setNewIcon}
            onDescChange={setNewDesc}
          />
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={closeModal} className="px-4 py-2 text-sm text-[#8b8b9e] hover:text-white transition-colors">
              Annuler
            </button>
            <button
              onClick={() => saveScenario(currentParams)}
              className="px-5 py-2 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Sauvegarder
            </button>
          </div>
        </ModalWrapper>
      )}

      {/* ─── CREATE MODAL (from scratch) ─── */}
      {modal === "create" && (
        <ModalWrapper title="Créer un scénario" onClose={closeModal}>
          <ScenarioForm
            name={newName}
            icon={newIcon}
            desc={newDesc}
            onNameChange={setNewName}
            onIconChange={setNewIcon}
            onDescChange={setNewDesc}
          />

          {/* Inline sliders */}
          <div className="mt-4 space-y-4 bg-white/[0.03] rounded-xl border border-white/[0.06] p-4">
            <div className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider mb-1">Paramètres du scénario</div>

            <SliderRow
              label="Semaines de vacances"
              value={createParams.vacationWeeks}
              onChange={(v) => setCreateParams((p) => ({ ...p, vacationWeeks: v }))}
              min={0} max={12} step={1}
              format={(v) => `${v} sem`}
            />
            <SliderRow
              label="Variation tarifs"
              value={createParams.rateChange}
              onChange={(v) => setCreateParams((p) => ({ ...p, rateChange: v }))}
              min={-30} max={50} step={5}
              format={(v) => `${v > 0 ? "+" : ""}${v}%`}
            />
            <SliderRow
              label="Hausse tarifs après M3"
              value={createParams.rateChangeAfter}
              onChange={(v) => setCreateParams((p) => ({ ...p, rateChangeAfter: v }))}
              min={0} max={50} step={5}
              format={(v) => `+${v}%`}
            />
            <SliderRow
              label="Nouveaux clients"
              value={createParams.newClients}
              onChange={(v) => setCreateParams((p) => ({ ...p, newClients: v }))}
              min={0} max={5} step={1}
              format={(v) => `+${v}`}
            />
            <SliderRow
              label="Jours / semaine"
              value={createParams.workDaysPerWeek}
              onChange={(v) => setCreateParams((p) => ({ ...p, workDaysPerWeek: v }))}
              min={3} max={6} step={1}
              format={(v) => `${v}j`}
            />
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-[#8b8b9e]">Perte client principal</span>
                <button
                  onClick={() =>
                    setCreateParams((p) => ({
                      ...p,
                      lostClientIndex: p.lostClientIndex === -1 ? 0 : -1,
                    }))
                  }
                  className={cn(
                    "text-xs font-medium px-3 py-1 rounded-full border transition-all",
                    createParams.lostClientIndex >= 0
                      ? "bg-red-500/15 text-red-400 border-red-500/30"
                      : "bg-white/[0.03] text-[#5a5a6e] border-white/[0.08] hover:border-white/[0.15]"
                  )}
                >
                  {createParams.lostClientIndex >= 0 ? "Oui" : "Non"}
                </button>
              </div>
            </div>
            <SliderRow
              label="Variation charges mensuelles"
              value={createParams.expenseChange}
              onChange={(v) => setCreateParams((p) => ({ ...p, expenseChange: v }))}
              min={-500} max={1000} step={50}
              format={(v) => `${v > 0 ? "+" : ""}${v}\u20AC`}
            />
          </div>

          {/* Impact preview */}
          <div className="mt-4 p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
            <div className="text-[10px] font-semibold text-[#5a5a6e] uppercase tracking-wider mb-2">Impact estimé</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-white">{fmt(createPreview.annualCA)}&euro;</div>
                <div className="text-[9px] text-[#5a5a6e]">CA annuel</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">{fmt(createPreview.annualNet)}&euro;</div>
                <div className="text-[9px] text-[#5a5a6e]">Net annuel</div>
              </div>
              <div className="text-center">
                <div className={cn("text-lg font-bold", createPreview.annualDiff >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {createPreview.annualDiff >= 0 ? "+" : ""}{fmt(createPreview.annualDiff)}&euro;
                </div>
                <div className="text-[9px] text-[#5a5a6e]">Diff. CA</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={closeModal} className="px-4 py-2 text-sm text-[#8b8b9e] hover:text-white transition-colors">
              Annuler
            </button>
            <button
              onClick={() => saveScenario(createParams)}
              className="px-5 py-2 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Créer le scénario
            </button>
          </div>
        </ModalWrapper>
      )}

      {/* ─── EDIT MODAL ─── */}
      {modal === "edit" && editId && (
        <ModalWrapper title="Modifier le scénario" onClose={closeModal}>
          <ScenarioForm
            name={newName}
            icon={newIcon}
            desc={newDesc}
            onNameChange={setNewName}
            onIconChange={setNewIcon}
            onDescChange={setNewDesc}
          />
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={closeModal} className="px-4 py-2 text-sm text-[#8b8b9e] hover:text-white transition-colors">
              Annuler
            </button>
            <button
              onClick={() => {
                const existing = scenarios.find((s) => s.id === editId);
                if (existing) saveScenario(existing.params);
              }}
              className="px-5 py-2 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Enregistrer
            </button>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}

/* ─── Reusable Modal wrapper ─── */
function ModalWrapper({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#12121c] rounded-2xl border border-white/[0.06] p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-[#5a5a6e] hover:text-white transition-colors">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Scenario name/icon/desc form ─── */
function ScenarioForm({
  name,
  icon,
  desc,
  onNameChange,
  onIconChange,
  onDescChange,
}: {
  name: string;
  icon: string;
  desc: string;
  onNameChange: (v: string) => void;
  onIconChange: (v: string) => void;
  onDescChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-[#8b8b9e] block mb-2">Icône</label>
        <div className="flex gap-1.5 flex-wrap">
          {ICON_OPTIONS.map((ic) => (
            <button
              key={ic}
              onClick={() => onIconChange(ic)}
              className={cn(
                "size-9 rounded-xl flex items-center justify-center transition-all",
                icon === ic
                  ? "bg-[#5682F2]/15 ring-2 ring-[#5682F2] text-[#5682F2]"
                  : "bg-white/[0.03] hover:bg-white/[0.06] text-[#5a5a6e]"
              )}
            >
              <Icon name={ic} className="size-4" />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-[#8b8b9e] block mb-1">Nom</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ex: Vacances été + hausse tarifs"
          className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.1] text-white placeholder:text-[#5a5a6e] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-[#8b8b9e] block mb-1">Description (optionnel)</label>
        <input
          type="text"
          value={desc}
          onChange={(e) => onDescChange(e.target.value)}
          placeholder="Ex: Impact de 3 semaines off + augmentation TJM"
          className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.1] text-white placeholder:text-[#5a5a6e] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40"
        />
      </div>
    </div>
  );
}

/* ─── Compact slider row for create modal ─── */
function SliderRow({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-[#8b8b9e]">{label}</span>
        <span className="text-xs font-bold text-[#5682F2]">{format(value)}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} />
    </div>
  );
}
