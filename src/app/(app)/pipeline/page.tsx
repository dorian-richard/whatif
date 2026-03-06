"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { usePipelineStore, type ProspectStage, type Prospect } from "@/stores/usePipelineStore";
import { fmt, cn } from "@/lib/utils";
import { Target, Plus, Users, TrendingUp, BarChart3, X } from "@/components/ui/icons";
import { ProBlur } from "@/components/ProBlur";

const STAGES: ProspectStage[] = ["lead", "devis_envoye", "signe", "actif"];

const STAGE_CONFIG: Record<ProspectStage, { label: string; color: string; bg: string; defaultProba: number }> = {
  lead: { label: "Lead", color: "#F4BE7E", bg: "bg-[#F4BE7E]/12", defaultProba: 20 },
  devis_envoye: { label: "Devis envoyé", color: "#5682F2", bg: "bg-[#5682F2]/12", defaultProba: 50 },
  signe: { label: "Signé", color: "#a78bfa", bg: "bg-[#a78bfa]/12", defaultProba: 80 },
  actif: { label: "Actif", color: "#4ade80", bg: "bg-[#4ade80]/12", defaultProba: 100 },
};

const BILLING_OPTIONS = [
  { value: "", label: "Non défini" },
  { value: "tjm", label: "TJM" },
  { value: "forfait", label: "Forfait" },
  { value: "mission", label: "Mission" },
];

const SOURCE_OPTIONS = ["LinkedIn", "Bouche-à-oreille", "Site web", "Malt", "Crème de la crème", "Événement", "Ancien client", "Autre"];

export default function PipelinePage() {
  const { prospects, setProspects, addProspect, updateProspect, removeProspect, setLoaded } = usePipelineStore();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "", company: "", contactEmail: "", contactPhone: "",
    estimatedCA: "", dailyRate: "", billing: "", stage: "lead" as ProspectStage,
    expectedClose: "", source: "", notes: "",
  });

  const resetForm = () => setForm({
    name: "", company: "", contactEmail: "", contactPhone: "",
    estimatedCA: "", dailyRate: "", billing: "", stage: "lead",
    expectedClose: "", source: "", notes: "",
  });

  // Load from API
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/prospects");
        if (!res.ok) return;
        const data = await res.json();
        if (data.length > 0) {
          setProspects(
            data.map((p: Record<string, unknown>) => ({
              id: p.id as string,
              name: p.name as string,
              estimatedCA: p.estimatedCA as number,
              probability: p.probability as number,
              stage: (p.stage as string).toLowerCase() as ProspectStage,
              notes: p.notes as string | undefined,
              expectedClose: p.expectedClose ? String(p.expectedClose).slice(0, 10) : undefined,
              contactEmail: p.contactEmail as string | undefined,
              company: p.company as string | undefined,
              contactPhone: p.contactPhone as string | undefined,
              billing: p.billing as string | undefined,
              dailyRate: p.dailyRate as number | undefined,
              source: p.source as string | undefined,
            }))
          );
        }
      } catch { /* ignore */ }
      setLoaded(true);
    }
    load();
  }, [setProspects, setLoaded]);

  // Sync to API
  const syncProspect = useCallback(async (action: "create" | "update" | "delete", p?: Partial<Prospect> & { id?: string }) => {
    try {
      if (action === "create" && p) {
        await fetch("/api/prospects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...p, stage: p.stage?.toUpperCase() }),
        });
      } else if (action === "update" && p?.id) {
        await fetch("/api/prospects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...p, stage: p.stage?.toUpperCase() }),
        });
      } else if (action === "delete" && p?.id) {
        await fetch(`/api/prospects?id=${p.id}`, { method: "DELETE" });
      }
    } catch { /* ignore */ }
  }, []);

  const handleSubmit = () => {
    if (!form.name.trim() || !form.estimatedCA) return;
    const ca = parseFloat(form.estimatedCA);
    const proba = STAGE_CONFIG[form.stage].defaultProba;
    const prospect: Omit<Prospect, "id"> = {
      name: form.name.trim(),
      estimatedCA: ca,
      stage: form.stage,
      probability: proba,
      expectedClose: form.expectedClose || undefined,
      notes: form.notes || undefined,
      contactEmail: form.contactEmail || undefined,
      company: form.company || undefined,
      contactPhone: form.contactPhone || undefined,
      billing: form.billing || undefined,
      dailyRate: form.dailyRate ? parseFloat(form.dailyRate) : undefined,
      source: form.source || undefined,
    };

    if (editId) {
      updateProspect(editId, prospect);
      syncProspect("update", { id: editId, ...prospect });
    } else {
      addProspect(prospect);
      syncProspect("create", prospect);
    }

    resetForm();
    setShowModal(false);
    setEditId(null);
  };

  const handleEdit = (p: Prospect) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      company: p.company ?? "",
      contactEmail: p.contactEmail ?? "",
      contactPhone: p.contactPhone ?? "",
      estimatedCA: String(p.estimatedCA),
      dailyRate: p.dailyRate ? String(p.dailyRate) : "",
      billing: p.billing ?? "",
      stage: p.stage,
      expectedClose: p.expectedClose ?? "",
      source: p.source ?? "",
      notes: p.notes ?? "",
    });
    setShowModal(true);
  };

  const handleNew = () => {
    resetForm();
    setEditId(null);
    setShowModal(true);
  };

  const handleStageChange = (id: string, newStage: ProspectStage) => {
    const proba = STAGE_CONFIG[newStage].defaultProba;
    updateProspect(id, { stage: newStage, probability: proba });
    syncProspect("update", { id, stage: newStage, probability: proba });
  };

  const handleDelete = (id: string) => {
    removeProspect(id);
    syncProspect("delete", { id });
    if (editId === id) {
      setShowModal(false);
      setEditId(null);
    }
  };

  // Summary
  const totalPipeline = prospects.reduce((s, p) => s + p.estimatedCA, 0);
  const weightedPipeline = prospects.filter((p) => p.stage !== "actif").reduce((s, p) => s + p.estimatedCA * (p.probability / 100), 0);
  const activeCount = prospects.filter((p) => p.stage !== "actif").length;
  const totalCount = prospects.length;
  const conversionRate = totalCount > 0 ? (prospects.filter((p) => p.stage === "actif").length / totalCount) * 100 : 0;

  // Group by stage
  const byStage = useMemo(() => {
    const grouped: Record<ProspectStage, Prospect[]> = { lead: [], devis_envoye: [], signe: [], actif: [] };
    for (const p of prospects) grouped[p.stage].push(p);
    return grouped;
  }, [prospects]);

  const inputCls = "px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 w-full";

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Leads</h1>
          <p className="text-muted-foreground">Suis tes prospects de la prise de contact au closing.</p>
        </div>
        <button
          onClick={handleNew}
          className="px-4 py-2.5 bg-gradient-to-r from-[#5682F2] to-[#7C5BF2] text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0"
        >
          <Plus className="size-4" /> Prospect
        </button>
      </div>

      <ProBlur label="La gestion des leads est réservée au plan Pro">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Target className="size-4 text-[#5682F2]" />
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Pipeline total</span>
            </div>
            <div className="text-xl font-bold text-foreground">{fmt(Math.round(totalPipeline))}&euro;</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="size-4 text-[#a78bfa]" />
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Pondéré</span>
            </div>
            <div className="text-xl font-bold text-[#a78bfa]">{fmt(Math.round(weightedPipeline))}&euro;</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Users className="size-4 text-[#F4BE7E]" />
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">En cours</span>
            </div>
            <div className="text-xl font-bold text-foreground">{activeCount}</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="size-4 text-[#4ade80]" />
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Conversion</span>
            </div>
            <div className="text-xl font-bold text-foreground">{conversionRate.toFixed(0)}%</div>
          </div>
        </div>

        {prospects.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <Target className="size-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucun prospect pour l&apos;instant.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Clique sur &quot;Prospect&quot; pour en ajouter un.</p>
          </div>
        ) : (
          <>
            {/* Desktop Kanban */}
            <div className="hidden md:grid grid-cols-4 gap-3">
              {STAGES.map((stage) => {
                const cfg = STAGE_CONFIG[stage];
                const stageProspects = byStage[stage];
                const stageTotal = stageProspects.reduce((s, p) => s + p.estimatedCA, 0);

                return (
                  <div
                    key={stage}
                    className="bg-muted/30 rounded-2xl border border-border p-3"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const id = e.dataTransfer.getData("prospectId");
                      if (id) handleStageChange(id, stage);
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div className="size-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                      <span className="text-xs font-bold text-foreground">{cfg.label}</span>
                      <span className="text-[10px] text-muted-foreground/60 ml-auto">{stageProspects.length}</span>
                    </div>
                    {stageTotal > 0 && (
                      <div className="text-[10px] text-muted-foreground/60 px-1 mb-2">
                        {fmt(Math.round(stageTotal))}&euro;/mois
                      </div>
                    )}
                    <div className="space-y-2 min-h-[80px]">
                      {stageProspects.map((p) => (
                        <div
                          key={p.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("prospectId", p.id)}
                          onDoubleClick={() => handleEdit(p)}
                          className="bg-card rounded-xl border border-border p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-foreground truncate block">{p.name}</span>
                              {p.company && (
                                <span className="text-[10px] text-muted-foreground/60 truncate block">{p.company}</span>
                              )}
                            </div>
                            <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0", cfg.bg)} style={{ color: cfg.color }}>
                              {p.probability}%
                            </span>
                          </div>
                          <div className="text-xs font-semibold" style={{ color: cfg.color }}>
                            {fmt(Math.round(p.estimatedCA))}&euro;/mois
                          </div>
                          {p.dailyRate && (
                            <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                              TJM : {fmt(Math.round(p.dailyRate))}&euro;
                            </div>
                          )}
                          {p.source && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted/60 text-muted-foreground">
                              {p.source}
                            </span>
                          )}
                          {p.expectedClose && (
                            <div className="text-[10px] text-muted-foreground/60 mt-1">
                              Closing : {new Date(p.expectedClose).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </div>
                          )}
                          {p.notes && (
                            <div className="text-[10px] text-muted-foreground/60 mt-1 truncate">{p.notes}</div>
                          )}
                          <div className="flex items-center gap-1 mt-2">
                            <button
                              onClick={() => handleEdit(p)}
                              className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Modifier
                            </button>
                            <span className="text-muted-foreground/30">&middot;</span>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="text-[10px] font-medium text-muted-foreground hover:text-[#f87171] transition-colors"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile list */}
            <div className="md:hidden space-y-3">
              {STAGES.map((stage) => {
                const cfg = STAGE_CONFIG[stage];
                const stageProspects = byStage[stage];
                if (stageProspects.length === 0) return null;

                return (
                  <div key={stage}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <div className="size-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                      <span className="text-xs font-bold text-foreground">{cfg.label}</span>
                      <span className="text-[10px] text-muted-foreground/60 ml-auto">{stageProspects.length}</span>
                    </div>
                    <div className="space-y-2">
                      {stageProspects.map((p) => {
                        const nextStageIdx = STAGES.indexOf(p.stage) + 1;
                        const nextStage = nextStageIdx < STAGES.length ? STAGES[nextStageIdx] : null;

                        return (
                          <div
                            key={p.id}
                            onDoubleClick={() => handleEdit(p)}
                            className="bg-card rounded-xl border border-border p-4"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="min-w-0">
                                <span className="text-sm font-medium text-foreground block">{p.name}</span>
                                {p.company && (
                                  <span className="text-[11px] text-muted-foreground/60 block">{p.company}</span>
                                )}
                              </div>
                              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", cfg.bg)} style={{ color: cfg.color }}>
                                {p.probability}%
                              </span>
                            </div>
                            <div className="text-sm font-bold mb-1" style={{ color: cfg.color }}>
                              {fmt(Math.round(p.estimatedCA))}&euro;/mois
                            </div>
                            {p.dailyRate && (
                              <div className="text-[11px] text-muted-foreground/60 mb-1">
                                TJM : {fmt(Math.round(p.dailyRate))}&euro;
                              </div>
                            )}
                            {p.source && (
                              <span className="inline-block mb-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/60 text-muted-foreground">
                                {p.source}
                              </span>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              {nextStage && (
                                <button
                                  onClick={() => handleStageChange(p.id, nextStage)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                  style={{ backgroundColor: `${STAGE_CONFIG[nextStage].color}20`, color: STAGE_CONFIG[nextStage].color }}
                                >
                                  &rarr; {STAGE_CONFIG[nextStage].label}
                                </button>
                              )}
                              <button
                                onClick={() => handleEdit(p)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#f87171]/10 text-[#f87171] hover:bg-[#f87171]/20 transition-colors"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </ProBlur>

      {/* Modal fiche client */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowModal(false); setEditId(null); }} />
          <div className="relative bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">{editId ? "Fiche prospect" : "Nouveau prospect"}</h2>
              <button onClick={() => { setShowModal(false); setEditId(null); }} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="size-5" />
              </button>
            </div>

            {/* Section: Infos générales */}
            <div className="mb-5">
              <h3 className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium mb-2">Informations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Nom du prospect *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
                <input type="text" placeholder="Entreprise" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputCls} />
              </div>
            </div>

            {/* Section: Contact */}
            <div className="mb-5">
              <h3 className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium mb-2">Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="email" placeholder="Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className={inputCls} />
                <input type="tel" placeholder="Téléphone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className={inputCls} />
              </div>
            </div>

            {/* Section: Commercial */}
            <div className="mb-5">
              <h3 className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium mb-2">Commercial</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="number" placeholder="CA mensuel estimé (€) *" value={form.estimatedCA} onChange={(e) => setForm({ ...form, estimatedCA: e.target.value })} className={inputCls} />
                <input type="number" placeholder="TJM estimé (€)" value={form.dailyRate} onChange={(e) => setForm({ ...form, dailyRate: e.target.value })} className={inputCls} />
                <select value={form.billing} onChange={(e) => setForm({ ...form, billing: e.target.value })} className={inputCls}>
                  {BILLING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value as ProspectStage })} className={inputCls}>
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>
                  ))}
                </select>
                <input type="date" value={form.expectedClose} onChange={(e) => setForm({ ...form, expectedClose: e.target.value })} className={inputCls} />
                <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={inputCls}>
                  <option value="">Source (optionnel)</option>
                  {SOURCE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section: Notes */}
            <div className="mb-5">
              <h3 className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium mb-2">Notes</h3>
              <textarea
                placeholder="Notes, contexte, besoins..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className={cn(inputCls, "resize-none")}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={!form.name.trim() || !form.estimatedCA}
                className="px-5 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {editId ? "Enregistrer" : "Ajouter"}
              </button>
              {editId && (
                <button
                  onClick={() => { handleDelete(editId); }}
                  className="px-4 py-2.5 rounded-full text-sm font-medium text-[#f87171] bg-[#f87171]/10 hover:bg-[#f87171]/20 transition-colors"
                >
                  Supprimer
                </button>
              )}
              <button
                onClick={() => { setShowModal(false); setEditId(null); }}
                className="px-4 py-2.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
