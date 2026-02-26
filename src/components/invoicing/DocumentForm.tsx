"use client";

import { useState, useMemo, useCallback } from "react";
import type { InvoiceDocument, DocumentItem, DocumentType, DocumentStatus, ClientData, ClientSnapshot, IssuerSnapshot } from "@/types";
import { fmt, cn } from "@/lib/utils";
import { Plus, X, Download, Check, FileText } from "@/components/ui/icons";
import { generateInvoicePDF } from "./DocumentPDF";

const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  accepted: "Accepté",
  refused: "Refusé",
  paid: "Payé",
  late: "En retard",
  partial: "Partiel",
  canceled: "Annulé",
};

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function makeClientSnapshot(client: ClientData): ClientSnapshot {
  return {
    name: client.name,
    companyName: client.companyName,
    siret: client.siret,
    address: client.clientAddress,
    city: client.clientCity,
    zip: client.clientZip,
    email: client.email,
  };
}

interface DocumentFormProps {
  doc: InvoiceDocument | null;
  clients: ClientData[];
  issuerSnapshot: IssuerSnapshot;
  businessStatus: string;
  onSave: (doc: InvoiceDocument) => void;
  onClose: () => void;
  onConvert?: (devisId: string) => void;
  onStatusChange?: (id: string, status: DocumentStatus) => void;
}

export function DocumentForm({ doc, clients, issuerSnapshot, businessStatus, onSave, onClose, onConvert, onStatusChange }: DocumentFormProps) {
  const isNew = !doc?.id || doc.id === "new";

  const [type, setType] = useState<DocumentType>(doc?.type ?? "devis");
  const [clientId, setClientId] = useState(doc?.clientId ?? clients[0]?.id ?? "");
  const [issueDate, setIssueDate] = useState(doc?.issueDate ? toISODate(new Date(doc.issueDate)) : toISODate(new Date()));
  const [dueDate, setDueDate] = useState(doc?.dueDate ? toISODate(new Date(doc.dueDate)) : toISODate(new Date(Date.now() + 30 * 86400000)));
  const [validUntil, setValidUntil] = useState(doc?.validUntil ? toISODate(new Date(doc.validUntil)) : toISODate(new Date(Date.now() + 30 * 86400000)));
  const [tvaRate, setTvaRate] = useState(doc?.tvaRate ?? (businessStatus === "micro" ? 0 : 20));
  const [notes, setNotes] = useState(doc?.notes ?? "");
  const [items, setItems] = useState<DocumentItem[]>(
    doc?.items?.length ? doc.items : [{ id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, totalHT: 0, sortOrder: 0 }]
  );

  const updateItem = useCallback((id: string, updates: Partial<DocumentItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        updated.totalHT = updated.quantity * updated.unitPrice;
        return updated;
      })
    );
  }, []);

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, totalHT: 0, sortOrder: prev.length },
    ]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const totalHT = useMemo(() => items.reduce((s, i) => s + i.quantity * i.unitPrice, 0), [items]);
  const totalTVA = useMemo(() => totalHT * (tvaRate / 100), [totalHT, tvaRate]);
  const totalTTC = useMemo(() => totalHT + totalTVA, [totalHT, totalTVA]);

  const selectedClient = clients.find((c) => c.id === clientId);

  function handleSave() {
    const clientSnap = selectedClient ? makeClientSnapshot(selectedClient) : { name: "Client" };
    const result: InvoiceDocument = {
      id: doc?.id ?? "new",
      clientId,
      type,
      number: doc?.number ?? "",
      status: doc?.status ?? "draft",
      issueDate,
      dueDate: type === "facture" ? dueDate : undefined,
      validUntil: type === "devis" ? validUntil : undefined,
      totalHT,
      totalTVA,
      totalTTC,
      tvaRate,
      clientSnapshot: clientSnap,
      issuerSnapshot,
      notes: notes || undefined,
      sourceDevisId: doc?.sourceDevisId,
      items: items.map((item, i) => ({ ...item, totalHT: item.quantity * item.unitPrice, sortOrder: i })),
    };
    onSave(result);
  }

  function handleDownloadPDF() {
    const clientSnap = selectedClient ? makeClientSnapshot(selectedClient) : { name: "Client" };
    const pdfDoc: InvoiceDocument = {
      id: doc?.id ?? "new",
      clientId,
      type,
      number: doc?.number ?? "BROUILLON",
      status: doc?.status ?? "draft",
      issueDate,
      dueDate: type === "facture" ? dueDate : undefined,
      validUntil: type === "devis" ? validUntil : undefined,
      totalHT,
      totalTVA,
      totalTTC,
      tvaRate,
      clientSnapshot: clientSnap,
      issuerSnapshot,
      notes: notes || undefined,
      items: items.map((item, i) => ({ ...item, totalHT: item.quantity * item.unitPrice, sortOrder: i })),
    };
    const pdf = generateInvoicePDF(pdfDoc);
    pdf.save(`${pdfDoc.number || "document"}.pdf`);
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">
          {isNew ? (type === "devis" ? "Nouveau devis" : "Nouvelle facture") : doc?.number}
        </h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="size-5" />
        </button>
      </div>

      {/* Type + Client */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {isNew && (
          <div>
            <label className="text-xs text-muted-foreground/70 mb-1 block">Type</label>
            <div className="flex gap-2">
              {(["devis", "facture"] as DocumentType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                    type === t
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {t === "devis" ? "Devis" : "Facture"}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-xs text-muted-foreground/70 mb-1 block">Client</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground/70 mb-1 block">Date d&apos;émission</label>
          <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)}
            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40" />
        </div>
        {type === "facture" && (
          <div>
            <label className="text-xs text-muted-foreground/70 mb-1 block">Date d&apos;échéance</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40" />
          </div>
        )}
        {type === "devis" && (
          <div>
            <label className="text-xs text-muted-foreground/70 mb-1 block">Valable jusqu&apos;au</label>
            <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40" />
          </div>
        )}
        <div>
          <label className="text-xs text-muted-foreground/70 mb-1 block">Taux TVA (%)</label>
          <input type="number" min={0} max={100} step={0.1} value={tvaRate}
            onChange={(e) => setTvaRate(Number(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40" />
        </div>
      </div>

      {/* Line items */}
      <div>
        <label className="text-xs text-muted-foreground/70 mb-2 block">Prestations</label>
        <div className="space-y-2">
          {/* Header - desktop */}
          <div className="hidden sm:grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 text-[10px] text-muted-foreground/60 uppercase tracking-wider px-1">
            <span>Description</span>
            <span className="text-right">Qté</span>
            <span className="text-right">PU HT</span>
            <span className="text-right">Total HT</span>
            <span />
          </div>
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_80px_100px_100px_32px] gap-2 items-center">
              <input
                value={item.description}
                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                placeholder="Description"
                className="px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40"
              />
              <input
                type="number" min={0} step={0.5}
                value={item.quantity}
                onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) || 0 })}
                className="px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40"
              />
              <input
                type="number" min={0} step={1}
                value={item.unitPrice}
                onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) || 0 })}
                className="px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40"
              />
              <div className="px-3 py-2 text-sm font-medium text-foreground text-right">
                {fmt(item.quantity * item.unitPrice)}&nbsp;&euro;
              </div>
              {items.length > 1 && (
                <button onClick={() => removeItem(item.id)} className="text-muted-foreground/40 hover:text-red-400 transition-colors justify-self-center">
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
          <button onClick={addItem} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors pt-1">
            <Plus className="size-3.5" /> Ajouter une ligne
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="flex flex-col items-end gap-1 pt-2 border-t border-border">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">Total HT</span>
          <span className="font-medium text-foreground w-28 text-right">{fmt(totalHT)} &euro;</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">TVA ({tvaRate}%)</span>
          <span className="font-medium text-foreground w-28 text-right">{fmt(totalTVA)} &euro;</span>
        </div>
        <div className="flex items-center gap-4 text-base font-bold">
          <span className="text-foreground">Total TTC</span>
          <span className="text-primary w-28 text-right">{fmt(totalTTC)} &euro;</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-muted-foreground/70 mb-1 block">Notes / conditions</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder={businessStatus === "micro" ? "TVA non applicable, art. 293 B du CGI" : "Conditions de paiement..."}
          className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Check className="size-4" /> Sauvegarder
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <Download className="size-4" /> PDF
        </button>
        {!isNew && doc?.status === "draft" && onStatusChange && (
          <button
            onClick={() => onStatusChange(doc.id, "sent")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5682F2]/10 text-[#5682F2] text-sm font-medium hover:bg-[#5682F2]/20 transition-colors"
          >
            <FileText className="size-4" /> Marquer envoyé
          </button>
        )}
        {!isNew && doc?.type === "devis" && doc?.status === "sent" && onConvert && (
          <button
            onClick={() => onConvert(doc.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4ade80]/10 text-[#4ade80] text-sm font-medium hover:bg-[#4ade80]/20 transition-colors"
          >
            <Check className="size-4" /> Convertir en facture
          </button>
        )}
        {!isNew && doc?.type === "facture" && (doc?.status === "sent" || doc?.status === "late") && onStatusChange && (
          <button
            onClick={() => onStatusChange(doc.id, "paid")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4ade80]/10 text-[#4ade80] text-sm font-medium hover:bg-[#4ade80]/20 transition-colors"
          >
            <Check className="size-4" /> Marquer payé
          </button>
        )}
      </div>
    </div>
  );
}
