"use client";

import { useState, useMemo, useCallback } from "react";
import type { InvoiceDocument, DocumentItem, DocumentType, DocumentStatus, ClientData, ClientSnapshot, IssuerSnapshot, ItemType } from "@/types";
import { fmt, cn } from "@/lib/utils";
import { Plus, X, Download, Check, FileText, Wand2, Copy } from "@/components/ui/icons";
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

const STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: "#8b8b9e",
  sent: "#5682F2",
  accepted: "#4ade80",
  refused: "#f87171",
  paid: "#4ade80",
  late: "#f87171",
  partial: "#f97316",
  canceled: "#8b8b9e",
};

const ITEM_TYPES: { value: ItemType; label: string; unit: string }[] = [
  { value: "prestation", label: "Prestation", unit: "unité" },
  { value: "tjm", label: "TJM", unit: "jour" },
  { value: "forfait", label: "Forfait", unit: "mois" },
  { value: "mission", label: "Mission", unit: "forfait" },
  { value: "produit", label: "Produit", unit: "unité" },
  { value: "abonnement", label: "Abonnement", unit: "mois" },
  { value: "licence", label: "Licence", unit: "licence" },
  { value: "formation", label: "Formation", unit: "jour" },
  { value: "acompte", label: "Acompte", unit: "forfait" },
  { value: "avoir", label: "Avoir", unit: "forfait" },
];

const UNIT_OPTIONS = ["jour", "heure", "mois", "unité", "forfait", "licence", "session", "lot"];

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function makeClientSnapshot(client: ClientData): ClientSnapshot {
  return {
    name: client.name,
    companyName: client.companyName,
    siret: client.siret,
    tvaNumber: client.tvaNumber,
    address: client.clientAddress,
    city: client.clientCity,
    zip: client.clientZip,
    country: client.clientCountry,
    email: client.email,
    phone: client.phone,
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
  onDuplicate?: (doc: InvoiceDocument) => void;
  existingDocuments?: InvoiceDocument[];
}

export function DocumentForm({ doc, clients, issuerSnapshot, businessStatus, onSave, onClose, onConvert, onStatusChange, onDuplicate, existingDocuments = [] }: DocumentFormProps) {
  const isNew = !doc?.id || doc.id === "new";

  const [type, setType] = useState<DocumentType>(doc?.type ?? "devis");
  const [clientId, setClientId] = useState(doc?.clientId ?? clients[0]?.id ?? "");
  const [issueDate, setIssueDate] = useState(doc?.issueDate ? toISODate(new Date(doc.issueDate)) : toISODate(new Date()));
  const [dueDate, setDueDate] = useState(doc?.dueDate ? toISODate(new Date(doc.dueDate)) : toISODate(new Date(Date.now() + 30 * 86400000)));
  const [validUntil, setValidUntil] = useState(doc?.validUntil ? toISODate(new Date(doc.validUntil)) : toISODate(new Date(Date.now() + 30 * 86400000)));
  const [tvaRate, setTvaRate] = useState(doc?.tvaRate ?? (businessStatus === "micro" ? 0 : 20));
  const [notes, setNotes] = useState(doc?.notes ?? (isNew && businessStatus === "micro" ? "TVA non applicable, art. 293 B du CGI" : ""));
  const [items, setItems] = useState<DocumentItem[]>(
    doc?.items?.length ? doc.items : [{ id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, totalHT: 0, sortOrder: 0, itemType: "prestation", unit: "unité" }]
  );

  // Preview number for new docs
  const previewNumber = useMemo(() => {
    if (!isNew) return doc?.number;
    const prefix = type === "devis" ? `D-${new Date().getFullYear()}-` : `F-${new Date().getFullYear()}-`;
    const existing = existingDocuments.filter(d => d.number?.startsWith(prefix));
    return `${prefix}${String(existing.length + 1).padStart(3, "0")}`;
  }, [isNew, type, doc?.number, existingDocuments]);

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

  const addItem = useCallback((itemType: ItemType = "prestation") => {
    const typeCfg = ITEM_TYPES.find(t => t.value === itemType);
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, totalHT: 0, sortOrder: prev.length, itemType, unit: typeCfg?.unit ?? "unité" },
    ]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // Pre-fill from client billing config
  const handlePrefillFromClient = useCallback(() => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const newItems: DocumentItem[] = [];
    switch (client.billing) {
      case "tjm":
        newItems.push({
          id: crypto.randomUUID(),
          description: `Prestation de conseil — ${client.name}`,
          quantity: client.daysPerMonth ?? (client.daysPerWeek ?? 5) * 4.33,
          unitPrice: client.dailyRate ?? 0,
          totalHT: 0,
          sortOrder: 0,
          itemType: "tjm",
          unit: "jour",
        });
        break;
      case "forfait":
        newItems.push({
          id: crypto.randomUUID(),
          description: `Forfait mensuel — ${client.name}`,
          quantity: 1,
          unitPrice: client.monthlyAmount ?? 0,
          totalHT: 0,
          sortOrder: 0,
          itemType: "forfait",
          unit: "mois",
        });
        break;
      case "mission":
        newItems.push({
          id: crypto.randomUUID(),
          description: `Mission — ${client.name}`,
          quantity: 1,
          unitPrice: client.totalAmount ?? 0,
          totalHT: 0,
          sortOrder: 0,
          itemType: "mission",
          unit: "forfait",
        });
        break;
    }

    // Recalc totalHT
    newItems.forEach(item => { item.totalHT = item.quantity * item.unitPrice; });

    // Only replace if current items are empty
    const hasContent = items.some(i => i.description.trim() || i.unitPrice > 0);
    if (hasContent) {
      setItems(prev => [...prev, ...newItems]);
    } else {
      setItems(newItems);
    }
  }, [clientId, clients, items]);

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
      prospectId: doc?.prospectId,
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
      number: doc?.number ?? previewNumber ?? "BROUILLON",
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

  function handleDuplicate() {
    if (!doc || !onDuplicate) return;
    onDuplicate({
      ...doc,
      id: "new",
      number: "",
      status: "draft",
      issueDate: new Date().toISOString(),
      dueDate: type === "facture" ? toISODate(new Date(Date.now() + 30 * 86400000)) : undefined,
      items: items.map((item, i) => ({ ...item, id: crypto.randomUUID(), sortOrder: i })),
    });
  }

  const inputCls = "w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40";

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-foreground">
            {isNew ? (previewNumber ?? (type === "devis" ? "Nouveau devis" : "Nouvelle facture")) : doc?.number}
          </h3>
          {!isNew && doc?.status && (
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ color: STATUS_COLORS[doc.status], backgroundColor: `${STATUS_COLORS[doc.status]}15` }}
            >
              {STATUS_LABELS[doc.status]}
            </span>
          )}
        </div>
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
          <div className="flex gap-2">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className={cn(inputCls, "flex-1")}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.companyName ? ` (${c.companyName})` : ""}</option>
              ))}
            </select>
            <button
              onClick={handlePrefillFromClient}
              title="Pré-remplir depuis le client"
              className="px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Wand2 className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground/70 mb-1 block">Date d&apos;émission</label>
          <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)}
            className={inputCls} />
        </div>
        {type === "facture" && (
          <div>
            <label className="text-xs text-muted-foreground/70 mb-1 block">Date d&apos;échéance</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className={inputCls} />
          </div>
        )}
        {type === "devis" && (
          <div>
            <label className="text-xs text-muted-foreground/70 mb-1 block">Valable jusqu&apos;au</label>
            <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
              className={inputCls} />
          </div>
        )}
        <div>
          <label className="text-xs text-muted-foreground/70 mb-1 block">Taux TVA (%)</label>
          <input type="number" min={0} max={100} step={0.1} value={tvaRate}
            onChange={(e) => setTvaRate(Number(e.target.value) || 0)}
            className={cn(inputCls, "text-right")} />
        </div>
      </div>

      {/* Line items */}
      <div>
        <label className="text-xs text-muted-foreground/70 mb-2 block">Prestations & produits</label>
        <div className="space-y-2">
          {/* Header - desktop */}
          <div className="hidden sm:grid grid-cols-[100px_1fr_70px_90px_90px_32px] gap-2 text-[10px] text-muted-foreground/60 uppercase tracking-wider px-1">
            <span>Type</span>
            <span>Description</span>
            <span className="text-right">Qté</span>
            <span className="text-right">PU HT</span>
            <span className="text-right">Total HT</span>
            <span />
          </div>
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[100px_1fr_70px_90px_90px_32px] gap-2 items-center">
              <select
                value={item.itemType ?? "prestation"}
                onChange={(e) => {
                  const newType = e.target.value as ItemType;
                  const typeCfg = ITEM_TYPES.find(t => t.value === newType);
                  updateItem(item.id, { itemType: newType, unit: typeCfg?.unit ?? item.unit });
                }}
                className="px-2 py-2 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40"
              >
                {ITEM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <input
                value={item.description}
                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                placeholder="Description"
                className={inputCls}
              />
              <div className="flex items-center gap-1">
                <input
                  type="number" min={0} step={0.5}
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) || 0 })}
                  className={cn(inputCls, "text-right")}
                />
              </div>
              <input
                type="number" min={0} step={1}
                value={item.unitPrice}
                onChange={(e) => updateItem(item.id, { unitPrice: Number(e.target.value) || 0 })}
                className={cn(inputCls, "text-right")}
              />
              <div className="px-2 py-2 text-sm font-medium text-foreground text-right">
                {fmt(item.quantity * item.unitPrice)}&nbsp;&euro;
              </div>
              {items.length > 1 && (
                <button onClick={() => removeItem(item.id)} className="text-muted-foreground/40 hover:text-red-400 transition-colors justify-self-center">
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}

          {/* Add item buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={() => addItem("prestation")} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
              <Plus className="size-3.5" /> Prestation
            </button>
            <button onClick={() => addItem("tjm")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="size-3.5" /> TJM
            </button>
            <button onClick={() => addItem("produit")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="size-3.5" /> Produit
            </button>
            <button onClick={() => addItem("forfait")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="size-3.5" /> Forfait
            </button>
            <button onClick={() => addItem("abonnement")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="size-3.5" /> Abonnement
            </button>
            <button onClick={() => addItem("formation")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="size-3.5" /> Formation
            </button>
          </div>
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
          className={cn(inputCls, "resize-none")}
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
        {!isNew && onDuplicate && (
          <button
            onClick={handleDuplicate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Copy className="size-4" /> Dupliquer
          </button>
        )}
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
