"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { InvoiceDocument, DocumentItem, DocumentType, DocumentStatus, ClientData, ClientSnapshot, IssuerSnapshot, ItemType, PDFOptions } from "@/types";
import { fmt, cn } from "@/lib/utils";
import { Plus, X, Download, Check, FileText, Wand2, Copy, ChevronDown, Upload, Lock, Search, Building2, UserPlus, Settings } from "@/components/ui/icons";
import type jsPDF from "jspdf";
import { generateInvoicePDF } from "./DocumentPDF";

interface CompanyLookupResult {
  siren: string;
  siret: string;
  companyName: string;
  legalForm: string;
  nafCode: string;
  address: string;
  zip: string;
  city: string;
}

// Conditions de paiement prédéfinies
const PAYMENT_CONDITIONS = [
  { id: "30j", label: "30 jours", text: "Paiement à 30 jours à compter de la date de facturation, par virement bancaire." },
  { id: "45j", label: "45 jours", text: "Paiement à 45 jours fin de mois à compter de la date de facturation, par virement bancaire." },
  { id: "60j", label: "60 jours", text: "Paiement à 60 jours à compter de la date de facturation, par virement bancaire." },
  { id: "reception", label: "À réception", text: "Paiement à réception de la facture, par virement bancaire." },
  { id: "50_50", label: "50% / 50%", text: "Acompte de 50% à la commande, solde de 50% à la livraison. Paiement par virement bancaire." },
  { id: "30_70", label: "30% / 70%", text: "Acompte de 30% à la commande, solde de 70% à la livraison. Paiement par virement bancaire." },
  { id: "tiers", label: "3 × 1/3", text: "Paiement en 3 versements égaux : 1/3 à la commande, 1/3 à mi-parcours, 1/3 à la livraison." },
  { id: "micro_tva", label: "Micro (TVA)", text: "TVA non applicable, art. 293 B du CGI." },
  { id: "penalites", label: "+ Pénalités", text: "En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée, ainsi qu'une indemnité forfaitaire de 40€ pour frais de recouvrement (art. L441-10 du Code de commerce)." },
];

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

async function uploadPDFToBlob(pdf: jsPDF, documentId: string): Promise<string | null> {
  try {
    const pdfBlob = pdf.output("blob");
    const formData = new FormData();
    formData.append("file", pdfBlob, "document.pdf");
    formData.append("documentId", documentId);
    const res = await fetch("/api/invoices/pdf", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      return data.url as string;
    }
  } catch { /* silently fail */ }
  return null;
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
  defaultNotes?: string;
  onSaveDefaultNotes?: (notes: string) => void;
  onLogoChange?: (logo: string | undefined) => void;
  onIssuerChange?: (updates: Partial<IssuerSnapshot & { invoiceAddress?: string; invoiceCity?: string; invoiceZip?: string }>) => void;
  onAddClient?: (client: Omit<ClientData, "id" | "color">) => void;
  pdfOptions?: Partial<PDFOptions>;
  onPdfOptionsChange?: (updates: Partial<PDFOptions>) => void;
}

export function DocumentForm({ doc, clients, issuerSnapshot, businessStatus, onSave, onClose, onConvert, onStatusChange, onDuplicate, existingDocuments = [], defaultNotes, onSaveDefaultNotes, onLogoChange, onIssuerChange, onAddClient, pdfOptions, onPdfOptionsChange }: DocumentFormProps) {
  const isNew = !doc?.id || doc.id === "new";
  const isLocked = !isNew && doc?.status !== "draft";

  const [type, setType] = useState<DocumentType>(doc?.type ?? "devis");
  const [clientId, setClientId] = useState(doc?.clientId ?? clients[0]?.id ?? "");
  const [issueDate, setIssueDate] = useState(doc?.issueDate ? toISODate(new Date(doc.issueDate)) : toISODate(new Date()));
  const [dueDate, setDueDate] = useState(doc?.dueDate ? toISODate(new Date(doc.dueDate)) : toISODate(new Date(Date.now() + 30 * 86400000)));
  const [validUntil, setValidUntil] = useState(doc?.validUntil ? toISODate(new Date(doc.validUntil)) : toISODate(new Date(Date.now() + 30 * 86400000)));
  const [tvaRate, setTvaRate] = useState(doc?.tvaRate ?? (businessStatus === "micro" ? 0 : 20));
  const [notes, setNotes] = useState(doc?.notes ?? (isNew ? (defaultNotes || (businessStatus === "micro" ? "TVA non applicable, art. 293 B du CGI" : "")) : ""));
  const [showConditions, setShowConditions] = useState(false);
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

  function buildPdfDoc(): InvoiceDocument {
    const clientSnap = selectedClient ? makeClientSnapshot(selectedClient) : { name: "Client" };
    return {
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
  }

  function handleDownloadPDF() {
    const pdf = generateInvoicePDF(buildPdfDoc(), pdfOptions);
    pdf.save(`${doc?.number || previewNumber || "document"}.pdf`);
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

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      alert("Le logo ne doit pas dépasser 500 Ko.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onLogoChange?.(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [onLogoChange]);

  // ─── SIRET search state ───
  const [siretQuery, setSiretQuery] = useState("");
  const [siretResults, setSiretResults] = useState<CompanyLookupResult[]>([]);
  const [siretLoading, setSiretLoading] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const siretTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showIssuerEdit, setShowIssuerEdit] = useState(false);

  const handleSiretSearch = useCallback((q: string) => {
    setSiretQuery(q);
    if (siretTimeout.current) clearTimeout(siretTimeout.current);
    if (q.length < 3) { setSiretResults([]); return; }
    setSiretLoading(true);
    siretTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/company-lookup?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data: CompanyLookupResult[] = await res.json();
          setSiretResults(data);
        }
      } catch { /* ignore */ }
      setSiretLoading(false);
    }, 400);
  }, []);

  const [pendingClientName, setPendingClientName] = useState<string | null>(null);

  const handleSelectCompany = useCallback((company: CompanyLookupResult) => {
    if (!onAddClient) return;
    onAddClient({
      name: company.companyName,
      billing: "tjm",
      companyName: company.companyName,
      siret: company.siret,
      siren: company.siren,
      nafCode: company.nafCode,
      legalForm: company.legalForm,
      clientAddress: company.address,
      clientCity: company.city,
      clientZip: company.zip,
      isActive: true,
    });
    setSiretQuery("");
    setSiretResults([]);
    setShowNewClient(false);
    setPendingClientName(company.companyName);
  }, [onAddClient]);

  // Auto-select newly added client when it appears in the list
  useEffect(() => {
    if (!pendingClientName) return;
    const match = clients.find(c => c.companyName === pendingClientName || c.name === pendingClientName);
    if (match) {
      setClientId(match.id);
      setPendingClientName(null);
    }
  }, [clients, pendingClientName]);

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

      {/* Locked banner */}
      {isLocked && (
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[#fbbf24]/10 border border-[#fbbf24]/20 rounded-xl text-sm text-[#b45309]">
          <div className="flex items-center gap-2">
            <Lock className="size-4 shrink-0" />
            <span>Document valid&eacute; &mdash; modification impossible. Dupliquer ou &eacute;mettre un avoir.</span>
          </div>
          {doc?.pdfUrl && (
            <a
              href={doc.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-xs font-medium text-[#5682F2] hover:underline"
            >
              Voir PDF archiv&eacute;
            </a>
          )}
        </div>
      )}

      {/* Logo upload */}
      {onLogoChange && !isLocked && (
        <div>
          <label className="text-xs text-muted-foreground/70 mb-1.5 block">Logo (apparaît sur le PDF)</label>
          <div className="flex items-center gap-3">
            {issuerSnapshot.logo ? (
              <div className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={issuerSnapshot.logo} alt="Logo" className="h-12 w-auto max-w-[120px] object-contain rounded-lg border border-border bg-white p-1" />
                <button
                  onClick={() => onLogoChange(undefined)}
                  className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border bg-muted/30 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer">
                <Upload className="size-4" />
                <span>Ajouter un logo</span>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
              </label>
            )}
            {issuerSnapshot.logo && (
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <Upload className="size-3.5" />
                <span>Changer</span>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>
      )}

      {/* Type */}
      {isNew && !isLocked && (
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

      {/* Issuer + Client info blocks */}
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3", isLocked && "opacity-60 pointer-events-none")}>
        {/* Émetteur */}
        <div className="bg-muted/30 rounded-xl border border-border p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Émetteur</span>
            {onIssuerChange && !isLocked && (
              <button
                onClick={() => setShowIssuerEdit(!showIssuerEdit)}
                className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {showIssuerEdit ? "Fermer" : "Modifier"}
              </button>
            )}
          </div>
          {!showIssuerEdit ? (
            <>
              <p className="text-sm font-medium text-foreground">{issuerSnapshot.companyName || <span className="text-muted-foreground/40 italic">Nom entreprise non renseigné</span>}</p>
              {issuerSnapshot.siret && <p className="text-xs text-muted-foreground">SIRET : {issuerSnapshot.siret}</p>}
              {issuerSnapshot.tvaNumber && <p className="text-xs text-muted-foreground">TVA : {issuerSnapshot.tvaNumber}</p>}
              {(issuerSnapshot.address || issuerSnapshot.zip || issuerSnapshot.city) && (
                <p className="text-xs text-muted-foreground">
                  {[issuerSnapshot.address, `${issuerSnapshot.zip ?? ""} ${issuerSnapshot.city ?? ""}`.trim()].filter(Boolean).join(", ")}
                </p>
              )}
              {issuerSnapshot.iban && <p className="text-xs text-muted-foreground">IBAN : {issuerSnapshot.iban}</p>}
              {!issuerSnapshot.companyName && !issuerSnapshot.siret && (
                <p className="text-[11px] text-amber-500">Renseigne tes informations pour qu&apos;elles apparaissent sur tes documents.</p>
              )}
            </>
          ) : (
            <div className="space-y-2 pt-1">
              <input placeholder="Nom de l'entreprise" value={issuerSnapshot.companyName ?? ""} onChange={(e) => onIssuerChange?.({ companyName: e.target.value })} className={cn(inputCls, "text-xs")} />
              <input placeholder="SIRET" value={issuerSnapshot.siret ?? ""} onChange={(e) => onIssuerChange?.({ siret: e.target.value })} className={cn(inputCls, "text-xs")} />
              <input placeholder="N° TVA intracommunautaire" value={issuerSnapshot.tvaNumber ?? ""} onChange={(e) => onIssuerChange?.({ tvaNumber: e.target.value })} className={cn(inputCls, "text-xs")} />
              <input placeholder="Adresse" value={issuerSnapshot.address ?? ""} onChange={(e) => onIssuerChange?.({ invoiceAddress: e.target.value, address: e.target.value })} className={cn(inputCls, "text-xs")} />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Code postal" value={issuerSnapshot.zip ?? ""} onChange={(e) => onIssuerChange?.({ invoiceZip: e.target.value, zip: e.target.value })} className={cn(inputCls, "text-xs")} />
                <input placeholder="Ville" value={issuerSnapshot.city ?? ""} onChange={(e) => onIssuerChange?.({ invoiceCity: e.target.value, city: e.target.value })} className={cn(inputCls, "text-xs")} />
              </div>
              <input placeholder="IBAN" value={issuerSnapshot.iban ?? ""} onChange={(e) => onIssuerChange?.({ iban: e.target.value })} className={cn(inputCls, "text-xs")} />
              <input placeholder="BIC" value={issuerSnapshot.bic ?? ""} onChange={(e) => onIssuerChange?.({ bic: e.target.value })} className={cn(inputCls, "text-xs")} />
            </div>
          )}
        </div>

        {/* Destinataire */}
        <div className="bg-muted/30 rounded-xl border border-border p-3 space-y-1.5">
          <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Destinataire</span>

          {/* Client selector */}
          <div className="flex gap-2">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className={cn(inputCls, "flex-1 text-xs")}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.companyName ? ` (${c.companyName})` : ""}</option>
              ))}
            </select>
            <button
              onClick={handlePrefillFromClient}
              title="Pré-remplir les lignes depuis le client"
              className="px-2 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Wand2 className="size-3.5" />
            </button>
            {onAddClient && (
              <button
                onClick={() => setShowNewClient(!showNewClient)}
                title="Ajouter un nouveau client"
                className={cn("px-2 py-1.5 rounded-xl transition-colors", showNewClient ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground hover:text-foreground")}
              >
                <UserPlus className="size-3.5" />
              </button>
            )}
          </div>

          {/* SIRET search for new client */}
          {showNewClient && onAddClient && (
            <div className="space-y-2 pt-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/40" />
                <input
                  value={siretQuery}
                  onChange={(e) => handleSiretSearch(e.target.value)}
                  placeholder="Rechercher par SIRET, SIREN ou nom..."
                  className={cn(inputCls, "text-xs pl-8")}
                  autoFocus
                />
                {siretLoading && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                )}
              </div>
              {siretResults.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-border bg-card p-1.5">
                  {siretResults.map((r) => (
                    <button
                      key={r.siret}
                      onClick={() => handleSelectCompany(r)}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="size-3.5 text-muted-foreground/40 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{r.companyName}</p>
                          <p className="text-[10px] text-muted-foreground">SIRET {r.siret} · {r.zip} {r.city}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {siretQuery.length >= 3 && !siretLoading && siretResults.length === 0 && (
                <p className="text-[11px] text-muted-foreground/60 px-1">Aucun résultat trouvé.</p>
              )}
            </div>
          )}

          {/* Selected client details */}
          {selectedClient && !showNewClient && (
            <>
              <p className="text-sm font-medium text-foreground">{selectedClient.companyName || selectedClient.name}</p>
              {selectedClient.companyName && selectedClient.name !== selectedClient.companyName && (
                <p className="text-xs text-muted-foreground">{selectedClient.name}</p>
              )}
              {selectedClient.siret && <p className="text-xs text-muted-foreground">SIRET : {selectedClient.siret}</p>}
              {selectedClient.tvaNumber && <p className="text-xs text-muted-foreground">TVA : {selectedClient.tvaNumber}</p>}
              {(selectedClient.clientAddress || selectedClient.clientZip || selectedClient.clientCity) && (
                <p className="text-xs text-muted-foreground">
                  {[selectedClient.clientAddress, `${selectedClient.clientZip ?? ""} ${selectedClient.clientCity ?? ""}`.trim()].filter(Boolean).join(", ")}
                </p>
              )}
              {selectedClient.email && <p className="text-xs text-muted-foreground">{selectedClient.email}</p>}
            </>
          )}
          {!selectedClient && !showNewClient && (
            <p className="text-[11px] text-amber-500">Sélectionne ou ajoute un client.</p>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className={cn("grid grid-cols-2 sm:grid-cols-3 gap-3", isLocked && "opacity-60 pointer-events-none")}>
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
      <div className={cn(isLocked && "opacity-60 pointer-events-none")}>
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

      {/* Notes & conditions de paiement */}
      <div className={cn("space-y-2", isLocked && "opacity-60 pointer-events-none")}>
        <div className="flex items-center justify-between">
          <label className="text-xs text-muted-foreground/70">Notes / conditions de paiement</label>
          <div className="flex items-center gap-2">
            {onSaveDefaultNotes && notes && notes !== defaultNotes && (
              <button
                onClick={() => onSaveDefaultNotes(notes)}
                className="text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Sauvegarder par d&eacute;faut
              </button>
            )}
            <button
              onClick={() => setShowConditions(!showConditions)}
              className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={cn("size-3 transition-transform", showConditions && "rotate-180")} />
              Suggestions
            </button>
          </div>
        </div>

        {/* Condition templates */}
        {showConditions && (
          <div className="flex flex-wrap gap-1.5">
            {PAYMENT_CONDITIONS.map((cond) => (
              <button
                key={cond.id}
                onClick={() => {
                  // Append if notes exist, replace if empty
                  setNotes((prev) => {
                    if (!prev.trim()) return cond.text;
                    // Don't add duplicate
                    if (prev.includes(cond.text)) return prev;
                    return prev + "\n" + cond.text;
                  });
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border",
                  notes.includes(cond.text)
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {cond.label}
              </button>
            ))}
          </div>
        )}

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder={businessStatus === "micro" ? "TVA non applicable, art. 293 B du CGI" : "Conditions de paiement..."}
          className={cn(inputCls, "resize-none")}
        />

        {defaultNotes && !notes && (
          <button
            onClick={() => setNotes(defaultNotes)}
            className="text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            Utiliser les conditions par d&eacute;faut sauvegard&eacute;es
          </button>
        )}
      </div>

      {/* PDF Customization */}
      {onPdfOptionsChange && (
        <PDFCustomization options={pdfOptions ?? {}} onChange={onPdfOptionsChange} />
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2">
        {!isLocked && (
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Check className="size-4" /> {isNew ? "Sauvegarder brouillon" : "Sauvegarder"}
          </button>
        )}
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
            onClick={async () => {
              if (!window.confirm("Une fois validé, ce document ne pourra plus être modifié. Continuer ?")) return;
              // Generate and upload PDF to blob storage
              const pdfDoc = buildPdfDoc();
              const pdf = generateInvoicePDF(pdfDoc, pdfOptions);
              await uploadPDFToBlob(pdf, doc.id);
              onStatusChange(doc.id, "sent");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5682F2]/10 text-[#5682F2] text-sm font-medium hover:bg-[#5682F2]/20 transition-colors"
          >
            <FileText className="size-4" /> Valider et envoyer
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
            <Check className="size-4" /> Marquer pay&eacute;
          </button>
        )}
        {isLocked && doc?.status !== "canceled" && onDuplicate && (
          <button
            onClick={() => {
              if (!window.confirm("Émettre un avoir annulera ce document et créera un avoir du même montant. Continuer ?")) return;
              // Create credit note (avoir)
              onDuplicate({
                ...doc!,
                id: "new",
                number: "",
                type: "facture",
                status: "draft",
                issueDate: new Date().toISOString(),
                notes: `Avoir sur ${doc!.type === "devis" ? "devis" : "facture"} ${doc!.number}.\n${notes || ""}`,
                items: items.map((item, i) => ({
                  ...item,
                  id: crypto.randomUUID(),
                  description: `[AVOIR] ${item.description}`,
                  unitPrice: -Math.abs(item.unitPrice),
                  totalHT: -(item.quantity * Math.abs(item.unitPrice)),
                  sortOrder: i,
                  itemType: "avoir" as const,
                })),
              });
              // Mark original as canceled
              onStatusChange?.(doc!.id, "canceled");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f87171]/10 text-[#f87171] text-sm font-medium hover:bg-[#f87171]/20 transition-colors"
          >
            <X className="size-4" /> &Eacute;mettre un avoir
          </button>
        )}
      </div>
    </div>
  );
}

/* ── PDF Customization Panel ── */

const ACCENT_PRESETS = [
  { color: "#5682F2", label: "Bleu" },
  { color: "#10b981", label: "Vert" },
  { color: "#f97316", label: "Orange" },
  { color: "#8b5cf6", label: "Violet" },
  { color: "#ef4444", label: "Rouge" },
  { color: "#0ea5e9", label: "Cyan" },
  { color: "#1a1a2e", label: "Noir" },
];

const FONT_SIZE_OPTIONS: { value: "small" | "normal" | "large"; label: string }[] = [
  { value: "small", label: "Petit" },
  { value: "normal", label: "Normal" },
  { value: "large", label: "Grand" },
];

function PDFCustomization({ options, onChange }: { options: Partial<PDFOptions>; onChange: (updates: Partial<PDFOptions>) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Settings className="size-3.5" />
        <span>Personnaliser le PDF</span>
        <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="bg-muted/30 rounded-xl border border-border p-4 space-y-4">
          {/* Accent color */}
          <div>
            <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-2 block">Couleur d&apos;accent</label>
            <div className="flex items-center gap-2">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset.color}
                  onClick={() => onChange({ accentColor: preset.color })}
                  title={preset.label}
                  className={cn(
                    "size-7 rounded-full border-2 transition-all hover:scale-110",
                    (options.accentColor ?? "#5682F2") === preset.color
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: preset.color }}
                />
              ))}
              <label className="relative" title="Couleur personnalisée">
                <input
                  type="color"
                  value={options.accentColor ?? "#5682F2"}
                  onChange={(e) => onChange({ accentColor: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer size-7"
                />
                <div
                  className="size-7 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground/40 text-[10px] cursor-pointer hover:border-foreground/40 transition-colors"
                >
                  +
                </div>
              </label>
            </div>
          </div>

          {/* Font size */}
          <div>
            <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-2 block">Taille du texte</label>
            <div className="flex gap-2">
              {FONT_SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onChange({ fontSize: opt.value })}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    (options.fontSize ?? "normal") === opt.value
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Show/hide toggles */}
          <div>
            <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-2 block">Afficher sur le PDF</label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.showIban ?? true}
                  onChange={(e) => onChange({ showIban: e.target.checked })}
                  className="accent-primary size-3.5"
                />
                IBAN
              </label>
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.showBic ?? true}
                  onChange={(e) => onChange({ showBic: e.target.checked })}
                  className="accent-primary size-3.5"
                />
                BIC
              </label>
            </div>
          </div>

          {/* Custom footer */}
          <div>
            <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1.5 block">Pied de page personnalis&eacute;</label>
            <input
              value={options.customFooter ?? ""}
              onChange={(e) => onChange({ customFooter: e.target.value })}
              placeholder="Ex: Membre d'une association de gestion agréée..."
              className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40 placeholder:text-muted-foreground/40"
            />
          </div>
        </div>
      )}
    </div>
  );
}
