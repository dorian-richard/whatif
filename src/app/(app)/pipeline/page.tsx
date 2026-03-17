"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePipelineStore, type ProspectStage, type Prospect } from "@/stores/usePipelineStore";
import { useProfileStore } from "@/stores/useProfileStore";
import { useInvoiceStore } from "@/stores/useInvoiceStore";
import { fmt, cn } from "@/lib/utils";
import { Target, Plus, Users, TrendingUp, BarChart3, X, UserPlus, FileText } from "@/components/ui/icons";
import { ProBlur } from "@/components/ProBlur";
import { MONTHS_SHORT } from "@/lib/constants";
import { JOURS_OUVRES } from "@/lib/simulation-engine";
import type { BillingType, IssuerSnapshot } from "@/types";

const STAGES: ProspectStage[] = ["lead", "devis_envoye", "signe", "actif", "perdu"];

const STAGE_CONFIG: Record<ProspectStage, { label: string; color: string; bg: string; defaultProba: number }> = {
  lead: { label: "Lead", color: "#F4BE7E", bg: "bg-[#F4BE7E]/12", defaultProba: 20 },
  devis_envoye: { label: "Devis envoyé", color: "#5682F2", bg: "bg-[#5682F2]/12", defaultProba: 50 },
  signe: { label: "Signé", color: "#a78bfa", bg: "bg-[#a78bfa]/12", defaultProba: 80 },
  actif: { label: "Actif", color: "#4ade80", bg: "bg-[#4ade80]/12", defaultProba: 100 },
  perdu: { label: "Perdu", color: "#f87171", bg: "bg-[#f87171]/12", defaultProba: 0 },
};

const BILLING_OPTIONS = [
  { value: "", label: "Non défini" },
  { value: "tjm", label: "TJM" },
  { value: "forfait", label: "Forfait" },
  { value: "mission", label: "Mission" },
];

const SOURCE_OPTIONS = ["LinkedIn", "Bouche-à-oreille", "Site web", "Malt", "Crème de la crème", "Événement", "Ancien client", "Autre"];

const AVG_BUSINESS_DAYS = 20;

function computeCAFromForm(form: FormState): number {
  switch (form.billing) {
    case "tjm": {
      const rate = parseFloat(form.dailyRate) || 0;
      const dpw = parseFloat(form.daysPerWeek) || 0;
      return rate * (dpw / 5) * AVG_BUSINESS_DAYS;
    }
    case "forfait":
      return parseFloat(form.monthlyAmount) || 0;
    case "mission": {
      const total = parseFloat(form.totalAmount) || 0;
      const start = parseInt(form.startMonth);
      const end = parseInt(form.endMonth);
      const duration = Math.max(1, (isNaN(end) ? 0 : end) - (isNaN(start) ? 0 : start) + 1);
      return total / duration;
    }
    default:
      return parseFloat(form.estimatedCA) || 0;
  }
}

interface FormState {
  name: string; company: string; contactName: string; contactEmail: string; contactPhone: string;
  estimatedCA: string; billing: string; dailyRate: string; daysPerWeek: string;
  monthlyAmount: string; totalAmount: string; startMonth: string; endMonth: string;
  stage: ProspectStage; expectedClose: string; source: string; notes: string;
}

const EMPTY_FORM: FormState = {
  name: "", company: "", contactName: "", contactEmail: "", contactPhone: "",
  estimatedCA: "", billing: "", dailyRate: "", daysPerWeek: "",
  monthlyAmount: "", totalAmount: "", startMonth: "", endMonth: "",
  stage: "lead", expectedClose: "", source: "", notes: "",
};

export default function PipelinePage() {
  const { prospects, setProspects, addProspect, updateProspect, removeProspect, setLoaded } = usePipelineStore();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const resetForm = () => setForm(EMPTY_FORM);

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
              contactName: p.contactName as string | undefined,
              contactEmail: p.contactEmail as string | undefined,
              company: p.company as string | undefined,
              contactPhone: p.contactPhone as string | undefined,
              billing: p.billing as string | undefined,
              dailyRate: p.dailyRate as number | undefined,
              daysPerWeek: p.daysPerWeek as number | undefined,
              monthlyAmount: p.monthlyAmount as number | undefined,
              totalAmount: p.totalAmount as number | undefined,
              startMonth: p.startMonth as number | undefined,
              endMonth: p.endMonth as number | undefined,
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
    if (!form.name.trim()) return;
    const ca = form.billing ? computeCAFromForm(form) : parseFloat(form.estimatedCA) || 0;
    if (ca <= 0 && !form.billing) return;
    const proba = STAGE_CONFIG[form.stage].defaultProba;
    const prospect: Omit<Prospect, "id"> = {
      name: form.name.trim(),
      estimatedCA: ca,
      stage: form.stage,
      probability: proba,
      expectedClose: form.expectedClose || undefined,
      notes: form.notes || undefined,
      contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined,
      company: form.company || undefined,
      contactPhone: form.contactPhone || undefined,
      billing: form.billing || undefined,
      dailyRate: form.dailyRate ? parseFloat(form.dailyRate) : undefined,
      daysPerWeek: form.daysPerWeek ? parseFloat(form.daysPerWeek) : undefined,
      monthlyAmount: form.monthlyAmount ? parseFloat(form.monthlyAmount) : undefined,
      totalAmount: form.totalAmount ? parseFloat(form.totalAmount) : undefined,
      startMonth: form.startMonth !== "" ? parseInt(form.startMonth) : undefined,
      endMonth: form.endMonth !== "" ? parseInt(form.endMonth) : undefined,
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
      contactName: p.contactName ?? "",
      contactEmail: p.contactEmail ?? "",
      contactPhone: p.contactPhone ?? "",
      estimatedCA: String(p.estimatedCA),
      billing: p.billing ?? "",
      dailyRate: p.dailyRate ? String(p.dailyRate) : "",
      daysPerWeek: p.daysPerWeek ? String(p.daysPerWeek) : "",
      monthlyAmount: p.monthlyAmount ? String(p.monthlyAmount) : "",
      totalAmount: p.totalAmount ? String(p.totalAmount) : "",
      startMonth: p.startMonth != null ? String(p.startMonth) : "",
      endMonth: p.endMonth != null ? String(p.endMonth) : "",
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

  // Convert prospect to client
  const { addClient, clients: existingClients, businessStatus, companyName, siret, tvaNumber, invoiceAddress, invoiceCity, invoiceZip, iban, bic } = useProfileStore();
  const { addDocument } = useInvoiceStore();
  const router = useRouter();

  const handleConvertToClient = useCallback((prospect: Prospect) => {
    // Check if already converted
    if (prospect.clientId) {
      alert("Ce prospect a déjà été converti en client.");
      return;
    }

    const billing: BillingType = (prospect.billing as BillingType) || "tjm";
    addClient({
      name: prospect.name,
      billing,
      dailyRate: prospect.dailyRate,
      daysPerWeek: prospect.daysPerWeek,
      monthlyAmount: prospect.monthlyAmount,
      totalAmount: prospect.totalAmount,
      startMonth: prospect.startMonth,
      endMonth: prospect.endMonth,
      email: prospect.contactEmail,
      companyName: prospect.company,
      isActive: true,
    });

    // Get the newly created client ID (last in list)
    const newClients = useProfileStore.getState().clients;
    const newClient = newClients[newClients.length - 1];

    // Link prospect to client
    updateProspect(prospect.id, { clientId: newClient.id, stage: "actif", probability: 100 });
    syncProspect("update", { id: prospect.id, clientId: newClient.id, stage: "actif", probability: 100 });
  }, [addClient, updateProspect, syncProspect]);

  // Create devis from prospect
  const handleCreateDevis = useCallback((prospect: Prospect) => {
    const billing: BillingType = (prospect.billing as BillingType) || "tjm";
    const issuerSnapshot: IssuerSnapshot = { companyName, siret, tvaNumber, address: invoiceAddress, city: invoiceCity, zip: invoiceZip, iban, bic };

    // Build items from prospect billing config
    const items = [];
    switch (billing) {
      case "tjm":
        items.push({
          id: crypto.randomUUID(),
          description: `Prestation de conseil — ${prospect.name}`,
          quantity: (prospect.daysPerWeek ?? 5) * 4.33,
          unitPrice: prospect.dailyRate ?? 0,
          totalHT: 0,
          sortOrder: 0,
          itemType: "tjm" as const,
          unit: "jour",
        });
        break;
      case "forfait":
        items.push({
          id: crypto.randomUUID(),
          description: `Forfait mensuel — ${prospect.name}`,
          quantity: 1,
          unitPrice: prospect.monthlyAmount ?? 0,
          totalHT: 0,
          sortOrder: 0,
          itemType: "forfait" as const,
          unit: "mois",
        });
        break;
      case "mission":
        items.push({
          id: crypto.randomUUID(),
          description: `Mission — ${prospect.name}`,
          quantity: 1,
          unitPrice: prospect.totalAmount ?? 0,
          totalHT: 0,
          sortOrder: 0,
          itemType: "mission" as const,
          unit: "forfait",
        });
        break;
    }
    items.forEach(i => { i.totalHT = i.quantity * i.unitPrice; });

    const totalHT = items.reduce((s, i) => s + i.totalHT, 0);
    const tvaRate = businessStatus === "micro" ? 0 : 20;
    const totalTVA = totalHT * (tvaRate / 100);

    // Find or create client
    let clientId = prospect.clientId;
    if (!clientId) {
      // Auto-convert to client first
      handleConvertToClient(prospect);
      clientId = useProfileStore.getState().clients[useProfileStore.getState().clients.length - 1]?.id;
    }

    // Create the devis document in the store for immediate editing
    const devis = {
      id: "new" as string,
      clientId: clientId ?? "",
      type: "devis" as const,
      number: "",
      status: "draft" as const,
      issueDate: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      totalHT,
      totalTVA,
      totalTTC: totalHT + totalTVA,
      tvaRate,
      issuerSnapshot,
      clientSnapshot: { name: prospect.name, companyName: prospect.company },
      notes: businessStatus === "micro" ? "TVA non applicable, art. 293 B du CGI" : undefined,
      prospectId: prospect.id,
      items,
    };

    // Store the devis data in session storage for the facturation page to pick up
    sessionStorage.setItem("freelens-prefill-devis", JSON.stringify(devis));

    // Update prospect stage
    if (prospect.stage === "lead") {
      updateProspect(prospect.id, { stage: "devis_envoye", probability: 50 });
      syncProspect("update", { id: prospect.id, stage: "devis_envoye", probability: 50 });
    }

    // Navigate to facturation
    router.push("/facturation");
  }, [handleConvertToClient, businessStatus, companyName, siret, tvaNumber, invoiceAddress, invoiceCity, invoiceZip, iban, bic, updateProspect, syncProspect, router]);

  // Summary
  const activeProspects = prospects.filter((p) => p.stage !== "perdu");
  const totalPipeline = activeProspects.reduce((s, p) => s + p.estimatedCA, 0);
  const weightedPipeline = activeProspects.filter((p) => p.stage !== "actif").reduce((s, p) => s + p.estimatedCA * (p.probability / 100), 0);
  const activeCount = activeProspects.filter((p) => p.stage !== "actif").length;
  const totalCount = prospects.length;
  const lostCount = prospects.filter((p) => p.stage === "perdu").length;
  const conversionRate = totalCount > 0 ? (prospects.filter((p) => p.stage === "actif").length / totalCount) * 100 : 0;

  // Group by stage
  const byStage = useMemo(() => {
    const grouped: Record<ProspectStage, Prospect[]> = { lead: [], devis_envoye: [], signe: [], actif: [], perdu: [] };
    for (const p of prospects) grouped[p.stage].push(p);
    return grouped;
  }, [prospects]);

  // Auto-compute CA from billing fields
  const computedCA = form.billing ? computeCAFromForm(form) : 0;

  const inputCls = "px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/30 w-full";

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
              <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">Pipeline total</span>
            </div>
            <div className="text-xl font-bold text-foreground">{fmt(Math.round(totalPipeline))}&euro;</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="size-4 text-[#a78bfa]" />
              <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">Pondéré</span>
            </div>
            <div className="text-xl font-bold text-[#a78bfa]">{fmt(Math.round(weightedPipeline))}&euro;</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Users className="size-4 text-[#F4BE7E]" />
              <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">En cours</span>
            </div>
            <div className="text-xl font-bold text-foreground">{activeCount}</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="size-4 text-[#4ade80]" />
              <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">Conversion</span>
            </div>
            <div className="text-xl font-bold text-foreground">{conversionRate.toFixed(0)}%</div>
          </div>
        </div>

        {prospects.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <Target className="size-8 text-muted-foreground/80 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucun prospect pour l&apos;instant.</p>
            <p className="text-xs text-muted-foreground/80 mt-1">Clique sur &quot;Prospect&quot; pour en ajouter un.</p>
          </div>
        ) : (
          <>
            {/* Desktop Kanban */}
            <div className="hidden md:grid grid-cols-4 gap-3">
              {STAGES.filter(s => s !== "perdu").map((stage) => {
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
                      <span className="text-[10px] text-muted-foreground/80 ml-auto">{stageProspects.length}</span>
                    </div>
                    {stageTotal > 0 && (
                      <div className="text-[10px] text-muted-foreground/80 px-1 mb-2">
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
                                <span className="text-[10px] text-muted-foreground/80 truncate block">{p.company}</span>
                              )}
                              {p.contactName && (
                                <span className="text-[10px] text-muted-foreground/80 truncate block">{p.contactName}</span>
                              )}
                            </div>
                            <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0", cfg.bg)} style={{ color: cfg.color }}>
                              {p.probability}%
                            </span>
                          </div>
                          <div className="text-xs font-semibold" style={{ color: cfg.color }}>
                            {fmt(Math.round(p.estimatedCA))}&euro;/mois
                          </div>
                          {p.billing && (
                            <div className="text-[10px] text-muted-foreground/80 mt-0.5">
                              {p.billing === "tjm" && p.dailyRate ? `TJM : ${fmt(Math.round(p.dailyRate))}\u20AC` + (p.daysPerWeek ? ` \u00B7 ${p.daysPerWeek}j/sem` : "") : null}
                              {p.billing === "forfait" ? "Forfait" : null}
                              {p.billing === "mission" ? `Mission${p.startMonth != null && p.endMonth != null ? ` (${MONTHS_SHORT[p.startMonth]}\u2013${MONTHS_SHORT[p.endMonth]})` : ""}` : null}
                            </div>
                          )}
                          {p.source && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted/60 text-muted-foreground">
                              {p.source}
                            </span>
                          )}
                          {p.expectedClose && (
                            <div className="text-[10px] text-muted-foreground/80 mt-1">
                              Closing : {new Date(p.expectedClose).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </div>
                          )}
                          {p.notes && (
                            <div className="text-[10px] text-muted-foreground/80 mt-1 truncate">{p.notes}</div>
                          )}
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            <button
                              onClick={() => handleEdit(p)}
                              className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Modifier
                            </button>
                            <span className="text-muted-foreground/30">&middot;</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCreateDevis(p); }}
                              className="text-[10px] font-medium text-[#5682F2] hover:text-[#5682F2]/80 transition-colors flex items-center gap-0.5"
                            >
                              <FileText className="size-3" /> Devis
                            </button>
                            {(stage === "signe" || stage === "actif") && !p.clientId && (
                              <>
                                <span className="text-muted-foreground/30">&middot;</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleConvertToClient(p); }}
                                  className="text-[10px] font-medium text-[#4ade80] hover:text-[#4ade80]/80 transition-colors flex items-center gap-0.5"
                                >
                                  <UserPlus className="size-3" /> Client
                                </button>
                              </>
                            )}
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
              {STAGES.filter(s => s !== "perdu").map((stage) => {
                const cfg = STAGE_CONFIG[stage];
                const stageProspects = byStage[stage];
                if (stageProspects.length === 0) return null;

                return (
                  <div key={stage}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <div className="size-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                      <span className="text-xs font-bold text-foreground">{cfg.label}</span>
                      <span className="text-[10px] text-muted-foreground/80 ml-auto">{stageProspects.length}</span>
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
                                  <span className="text-[11px] text-muted-foreground/80 block">{p.company}</span>
                                )}
                                {p.contactName && (
                                  <span className="text-[11px] text-muted-foreground/80 block">{p.contactName}</span>
                                )}
                              </div>
                              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", cfg.bg)} style={{ color: cfg.color }}>
                                {p.probability}%
                              </span>
                            </div>
                            <div className="text-sm font-bold mb-1" style={{ color: cfg.color }}>
                              {fmt(Math.round(p.estimatedCA))}&euro;/mois
                            </div>
                            {p.billing && (
                              <div className="text-[11px] text-muted-foreground/80 mb-1">
                                {p.billing === "tjm" && p.dailyRate ? `TJM : ${fmt(Math.round(p.dailyRate))}\u20AC` + (p.daysPerWeek ? ` \u00B7 ${p.daysPerWeek}j/sem` : "") : null}
                                {p.billing === "forfait" ? "Forfait" : null}
                                {p.billing === "mission" ? `Mission${p.startMonth != null && p.endMonth != null ? ` (${MONTHS_SHORT[p.startMonth]}\u2013${MONTHS_SHORT[p.endMonth]})` : ""}` : null}
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
                                onClick={() => handleCreateDevis(p)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#5682F2]/10 text-[#5682F2] hover:bg-[#5682F2]/20 transition-colors flex items-center gap-1"
                              >
                                <FileText className="size-3" /> Devis
                              </button>
                              {(p.stage === "signe" || p.stage === "actif") && !p.clientId && (
                                <button
                                  onClick={() => handleConvertToClient(p)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#4ade80]/10 text-[#4ade80] hover:bg-[#4ade80]/20 transition-colors flex items-center gap-1"
                                >
                                  <UserPlus className="size-3" /> Client
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

            {/* Lost deals section */}
            {byStage.perdu.length > 0 && (
              <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <div className="size-2.5 rounded-full bg-[#f87171]" />
                  <span className="font-medium">Perdu</span>
                  <span className="text-xs text-muted-foreground/80">{byStage.perdu.length}</span>
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                  {byStage.perdu.map((p) => (
                    <div key={p.id} className="bg-card rounded-xl border border-border p-3 opacity-60 hover:opacity-100 transition-opacity">
                      <div className="flex items-center justify-between mb-1">
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-foreground truncate block">{p.name}</span>
                          {p.company && <span className="text-[10px] text-muted-foreground/80 block">{p.company}</span>}
                          {p.contactName && <span className="text-[10px] text-muted-foreground/80 block">{p.contactName}</span>}
                        </div>
                        <span className="text-xs text-muted-foreground/80">{fmt(Math.round(p.estimatedCA))}&euro;/mois</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <button onClick={() => handleStageChange(p.id, "lead")} className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors">Relancer</button>
                        <span className="text-muted-foreground/30">&middot;</span>
                        <button onClick={() => handleEdit(p)} className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors">Modifier</button>
                        <span className="text-muted-foreground/30">&middot;</span>
                        <button onClick={() => handleDelete(p.id)} className="text-[10px] font-medium text-muted-foreground hover:text-[#f87171] transition-colors">Supprimer</button>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
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
              <h3 className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-medium mb-2">Informations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Nom du prospect *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
                <input type="text" placeholder="Entreprise" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputCls} />
              </div>
            </div>

            {/* Section: Contact */}
            <div className="mb-5">
              <h3 className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-medium mb-2">Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Nom du contact" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className={inputCls} />
                <input type="email" placeholder="Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className={inputCls} />
                <input type="tel" placeholder="Telephone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className={inputCls} />
              </div>
            </div>

            {/* Section: Facturation */}
            <div className="mb-5">
              <h3 className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-medium mb-2">Facturation</h3>
              <div className="space-y-3">
                {/* Billing type picker */}
                <div className="flex gap-2">
                  {BILLING_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setForm({ ...form, billing: o.value })}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-medium transition-all border",
                        form.billing === o.value
                          ? "border-[#5682F2] bg-[#5682F2]/10 text-[#5682F2]"
                          : "border-border bg-muted/50 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>

                {/* TJM fields */}
                {form.billing === "tjm" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground/70 mb-1 block">TJM HT</label>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="500"
                            value={form.dailyRate}
                            onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
                            className={cn(inputCls, "text-right pr-10")}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">&euro;/j</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground/70 mb-1 block">Jours / semaine</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            max="5"
                            placeholder="5"
                            value={form.daysPerWeek}
                            onChange={(e) => setForm({ ...form, daysPerWeek: e.target.value })}
                            className={cn(inputCls, "text-right pr-12")}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">j/sem</span>
                        </div>
                      </div>
                    </div>
                    {computedCA > 0 && (
                      <div className="text-[11px] text-muted-foreground bg-muted/50 border border-border px-3 py-1.5 rounded-lg">
                        &asymp; {fmt(Math.round(computedCA))}&euro; HT/mois ({AVG_BUSINESS_DAYS} jours ouvrés moy.)
                      </div>
                    )}
                  </div>
                )}

                {/* Forfait fields */}
                {form.billing === "forfait" && (
                  <div>
                    <label className="text-xs text-muted-foreground/70 mb-1 block">Montant mensuel HT</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="3000"
                        value={form.monthlyAmount}
                        onChange={(e) => setForm({ ...form, monthlyAmount: e.target.value })}
                        className={cn(inputCls, "text-right pr-12")}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">&euro;/mois</span>
                    </div>
                  </div>
                )}

                {/* Mission fields */}
                {form.billing === "mission" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground/70 mb-1 block">Montant total HT</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="15000"
                          value={form.totalAmount}
                          onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                          className={cn(inputCls, "text-right pr-6")}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">&euro;</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground/70 mb-1 block">Début</label>
                        <select
                          value={form.startMonth}
                          onChange={(e) => setForm({ ...form, startMonth: e.target.value })}
                          className={inputCls}
                        >
                          <option value="">—</option>
                          {MONTHS_SHORT.map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground/70 mb-1 block">Fin</label>
                        <select
                          value={form.endMonth}
                          onChange={(e) => setForm({ ...form, endMonth: e.target.value })}
                          className={inputCls}
                        >
                          <option value="">—</option>
                          {MONTHS_SHORT.map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {computedCA > 0 && (
                      <div className="text-[11px] text-muted-foreground bg-muted/50 border border-border px-3 py-1.5 rounded-lg">
                        &asymp; {fmt(Math.round(computedCA))}&euro; HT/mois
                      </div>
                    )}
                  </div>
                )}

                {/* No billing type: manual CA */}
                {!form.billing && (
                  <div>
                    <label className="text-xs text-muted-foreground/70 mb-1 block">CA mensuel estimé</label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="5000"
                        value={form.estimatedCA}
                        onChange={(e) => setForm({ ...form, estimatedCA: e.target.value })}
                        className={cn(inputCls, "text-right pr-12")}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">&euro;/mois</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section: Pipeline */}
            <div className="mb-5">
              <h3 className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-medium mb-2">Pipeline</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <h3 className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-medium mb-2">Notes</h3>
              <textarea
                placeholder="Notes, contexte, besoins..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className={cn(inputCls, "resize-none")}
              />
            </div>

            {/* CA résumé */}
            {form.billing && computedCA > 0 && (
              <div className="mb-5 p-3 rounded-xl bg-[#5682F2]/10 border border-[#5682F2]/20">
                <span className="text-sm font-bold text-[#5682F2]">{fmt(Math.round(computedCA))}&euro; HT/mois</span>
                <span className="text-xs text-muted-foreground ml-2">estimé</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={!form.name.trim() || (form.billing ? computedCA <= 0 : !form.estimatedCA)}
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
