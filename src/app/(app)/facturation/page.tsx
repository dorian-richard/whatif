"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useProfileStore } from "@/stores/useProfileStore";
import { useInvoiceStore } from "@/stores/useInvoiceStore";
import { fmt, cn } from "@/lib/utils";
import { Receipt, FileText, AlertTriangle, Banknote, Check } from "@/components/ui/icons";
import { ProBlur } from "@/components/ProBlur";
import { DocumentList } from "@/components/invoicing/DocumentList";
import { DocumentForm } from "@/components/invoicing/DocumentForm";
import type { InvoiceDocument, DocumentItem, DocumentType, DocumentStatus, IssuerSnapshot } from "@/types";

const CURRENT_YEAR = new Date().getFullYear();

export default function FacturationPage() {
  const { clients, businessStatus, companyName, siret, tvaNumber, invoiceAddress, invoiceCity, invoiceZip, iban, bic, invoiceNotes, setProfile } = useProfileStore();
  const { documents, setDocuments, addDocument, updateDocument, removeDocument, loaded, setLoaded } = useInvoiceStore();

  const [year, setYear] = useState(CURRENT_YEAR);
  const [filter, setFilter] = useState<DocumentType | "all">("all");
  const [editing, setEditing] = useState<InvoiceDocument | null>(null);

  // Pick up prefilled devis from pipeline
  useEffect(() => {
    try {
      const prefill = sessionStorage.getItem("freelens-prefill-devis");
      if (prefill) {
        sessionStorage.removeItem("freelens-prefill-devis");
        const devis = JSON.parse(prefill) as InvoiceDocument;
        setEditing(devis);
      }
    } catch { /* ignore */ }
  }, []);

  // Load from API
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/invoices?year=${year}`);
        if (!res.ok) return;
        const data = await res.json();
        const docs: InvoiceDocument[] = data.map((d: Record<string, unknown>) => ({
          id: d.id,
          clientId: d.clientId,
          type: (d.type as string).toLowerCase(),
          number: d.number,
          status: (d.status as string).toLowerCase(),
          issueDate: d.issueDate ? String(d.issueDate) : new Date().toISOString(),
          dueDate: d.dueDate ? String(d.dueDate) : undefined,
          validUntil: d.validUntil ? String(d.validUntil) : undefined,
          sentAt: d.sentAt ? String(d.sentAt) : undefined,
          paidAt: d.paidAt ? String(d.paidAt) : undefined,
          totalHT: Number(d.totalHT) || 0,
          totalTVA: Number(d.totalTVA) || 0,
          totalTTC: Number(d.totalTTC) || 0,
          tvaRate: Number(d.tvaRate) ?? 20,
          clientSnapshot: d.clientSnapshot as InvoiceDocument["clientSnapshot"],
          issuerSnapshot: d.issuerSnapshot as InvoiceDocument["issuerSnapshot"],
          notes: d.notes as string | undefined,
          sourceDevisId: d.sourceDevisId as string | undefined,
          prospectId: d.prospectId as string | undefined,
          items: ((d.items as Record<string, unknown>[]) ?? []).map((item) => ({
            id: item.id as string,
            description: item.description as string,
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
            totalHT: Number(item.totalHT) || 0,
            sortOrder: Number(item.sortOrder) || 0,
            itemType: (item.itemType as string) || undefined,
            unit: (item.unit as string) || undefined,
          })),
        }));
        setDocuments(docs);

        // Auto-detect late invoices
        const today = new Date().toISOString().slice(0, 10);
        for (const doc of docs) {
          if (doc.type === "facture" && doc.status === "sent" && doc.dueDate && doc.dueDate.slice(0, 10) < today) {
            // Mark as late via API
            try {
              const r = await fetch("/api/invoices", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: doc.id, status: "LATE" }),
              });
              if (r.ok) {
                updateDocument(doc.id, { status: "late" });
              }
            } catch { /* ignore */ }
          }
        }
      } catch { /* silently fail */ }
      setLoaded(true);
    }
    load();
  }, [year, setDocuments, setLoaded, updateDocument]);

  const issuerSnapshot: IssuerSnapshot = useMemo(() => ({
    companyName, siret, tvaNumber,
    address: invoiceAddress, city: invoiceCity, zip: invoiceZip,
    iban, bic,
  }), [companyName, siret, tvaNumber, invoiceAddress, invoiceCity, invoiceZip, iban, bic]);

  // KPIs
  const kpis = useMemo(() => {
    const devisEnAttente = documents.filter((d) => d.type === "devis" && d.status === "sent").length;
    const facturesImpayees = documents.filter((d) => d.type === "facture" && (d.status === "sent" || d.status === "late"))
      .reduce((s, d) => s + d.totalTTC, 0);
    const caFacture = documents.filter((d) => d.type === "facture" && d.status === "paid")
      .reduce((s, d) => s + d.totalTTC, 0);
    const totalFactures = documents.filter((d) => d.type === "facture" && d.status !== "draft" && d.status !== "canceled").length;
    const facturesPayees = documents.filter((d) => d.type === "facture" && d.status === "paid").length;
    const tauxEncaissement = totalFactures > 0 ? Math.round((facturesPayees / totalFactures) * 100) : 0;
    return { devisEnAttente, facturesImpayees, caFacture, tauxEncaissement };
  }, [documents]);

  // Save document (create or update)
  const handleSave = useCallback(async (doc: InvoiceDocument) => {
    const isNew = doc.id === "new";
    try {
      if (isNew) {
        const res = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(doc),
        });
        if (res.ok) {
          const saved = await res.json();
          const mapped = mapApiDoc(saved);
          addDocument(mapped);
          setEditing(mapped);
        }
      } else {
        const res = await fetch("/api/invoices", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(doc),
        });
        if (res.ok) {
          const saved = await res.json();
          const mapped = mapApiDoc(saved);
          updateDocument(doc.id, mapped);
          setEditing(mapped);
        }
      }
    } catch { /* silently fail */ }
  }, [addDocument, updateDocument]);

  // Delete document
  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`/api/invoices?id=${id}`, { method: "DELETE" });
      removeDocument(id);
      if (editing?.id === id) setEditing(null);
    } catch { /* silently fail */ }
  }, [removeDocument, editing]);

  // Convert devis to facture
  const handleConvert = useCallback(async (devisId: string) => {
    try {
      const res = await fetch("/api/invoices/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ devisId }),
      });
      if (res.ok) {
        const facture = await res.json();
        const mapped = mapApiDoc(facture);
        updateDocument(devisId, { status: "accepted" });
        addDocument(mapped);
        setEditing(mapped);
      }
    } catch { /* silently fail */ }
  }, [addDocument, updateDocument]);

  // Change status
  const handleStatusChange = useCallback(async (id: string, status: DocumentStatus) => {
    const updates: Record<string, unknown> = { id, status };
    if (status === "sent") updates.sentAt = new Date().toISOString();
    if (status === "paid") updates.paidAt = new Date().toISOString();
    try {
      const res = await fetch("/api/invoices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const saved = await res.json();
        const mapped = mapApiDoc(saved);
        updateDocument(id, mapped);
        setEditing(mapped);
      }
    } catch { /* silently fail */ }
  }, [updateDocument]);

  // Save default notes
  const handleSaveDefaultNotes = useCallback((notes: string) => {
    setProfile({ invoiceNotes: notes });
  }, [setProfile]);

  // Duplicate document
  const handleDuplicate = useCallback((doc: InvoiceDocument) => {
    setEditing({
      ...doc,
      id: "new",
      number: "",
      status: "draft",
      issueDate: new Date().toISOString(),
      dueDate: doc.type === "facture" ? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) : undefined,
      sentAt: undefined,
      paidAt: undefined,
      items: doc.items.map((item) => ({ ...item, id: crypto.randomUUID() })),
    });
  }, []);

  // New document
  function handleNew(type: DocumentType) {
    setEditing({
      id: "new",
      clientId: clients[0]?.id ?? "",
      type,
      number: "",
      status: "draft",
      issueDate: new Date().toISOString(),
      totalHT: 0,
      totalTVA: 0,
      totalTTC: 0,
      tvaRate: businessStatus === "micro" ? 0 : 20,
      issuerSnapshot,
      items: [],
    });
  }

  const activeClients = clients.filter((c) => c.isActive !== false);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Devis et factures</h1>
          <p className="text-muted-foreground">
            Cr&eacute;e tes devis et factures, exporte en PDF et suis les paiements.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleNew("devis")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <FileText className="size-4" /> Nouveau devis
          </button>
          <button
            onClick={() => handleNew("facture")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Receipt className="size-4" /> Nouvelle facture
          </button>
        </div>
      </div>

      <ProBlur label="Les devis et factures sont réservés au plan Pro">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard icon={FileText} label="Devis en attente" value={String(kpis.devisEnAttente)} color="#5682F2" />
          <KPICard icon={AlertTriangle} label="Factures impayées" value={`${fmt(kpis.facturesImpayees)} €`} color="#f87171" />
          <KPICard icon={Banknote} label="CA facturé" value={`${fmt(kpis.caFacture)} €`} color="#4ade80" />
          <KPICard icon={Check} label="Taux encaissement" value={`${kpis.tauxEncaissement}%`} color="#f97316" />
        </div>

        {/* Year selector + Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            {(["all", "devis", "facture"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  filter === t
                    ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {t === "all" ? "Tous" : t === "devis" ? "Devis" : "Factures"}
              </button>
            ))}
          </div>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-1.5 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40"
          >
            {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Edit form */}
        {editing && (
          <DocumentForm
            doc={editing}
            clients={activeClients}
            issuerSnapshot={issuerSnapshot}
            businessStatus={businessStatus}
            onSave={handleSave}
            onClose={() => setEditing(null)}
            onConvert={handleConvert}
            onStatusChange={handleStatusChange}
            onDuplicate={handleDuplicate}
            existingDocuments={documents}
            defaultNotes={invoiceNotes}
            onSaveDefaultNotes={handleSaveDefaultNotes}
          />
        )}

        {/* Document list */}
        {loaded && (
          <DocumentList
            documents={documents}
            filter={filter}
            onSelect={setEditing}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        )}
      </ProBlur>
    </div>
  );
}

/* ── KPI Card ── */
function KPICard({ icon: Icon, label, value, color }: { icon: typeof Check; label: string; value: string; color: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="size-4" style={{ color }} />
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}

/* ── API mapper ── */
function mapApiDoc(d: Record<string, unknown>): InvoiceDocument {
  return {
    id: d.id as string,
    clientId: d.clientId as string,
    type: (d.type as string).toLowerCase() as DocumentType,
    number: d.number as string,
    status: (d.status as string).toLowerCase() as DocumentStatus,
    issueDate: d.issueDate ? String(d.issueDate) : new Date().toISOString(),
    dueDate: d.dueDate ? String(d.dueDate) : undefined,
    validUntil: d.validUntil ? String(d.validUntil) : undefined,
    sentAt: d.sentAt ? String(d.sentAt) : undefined,
    paidAt: d.paidAt ? String(d.paidAt) : undefined,
    totalHT: Number(d.totalHT) || 0,
    totalTVA: Number(d.totalTVA) || 0,
    totalTTC: Number(d.totalTTC) || 0,
    tvaRate: Number(d.tvaRate) ?? 20,
    clientSnapshot: d.clientSnapshot as InvoiceDocument["clientSnapshot"],
    issuerSnapshot: d.issuerSnapshot as InvoiceDocument["issuerSnapshot"],
    notes: d.notes as string | undefined,
    sourceDevisId: d.sourceDevisId as string | undefined,
    prospectId: d.prospectId as string | undefined,
    items: ((d.items as Record<string, unknown>[]) ?? []).map((item) => ({
      id: item.id as string,
      description: item.description as string,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      totalHT: Number(item.totalHT) || 0,
      sortOrder: Number(item.sortOrder) || 0,
      itemType: (item.itemType as DocumentItem["itemType"]) || undefined,
      unit: (item.unit as string) || undefined,
    })),
  };
}
