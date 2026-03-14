"use client";

import type { InvoiceDocument, DocumentStatus, DocumentType } from "@/types";
import { fmt, cn } from "@/lib/utils";
import { FileText, AlertTriangle, Check, Clock, X, CircleMinus, Copy } from "@/components/ui/icons";

const STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string; bg: string }> = {
  draft: { label: "Brouillon", color: "#8b8b9e", bg: "bg-[#8b8b9e]/12" },
  sent: { label: "Envoyé", color: "#5682F2", bg: "bg-[#5682F2]/12" },
  accepted: { label: "Accepté", color: "#4ade80", bg: "bg-[#4ade80]/12" },
  refused: { label: "Refusé", color: "#f87171", bg: "bg-[#f87171]/12" },
  paid: { label: "Payé", color: "#4ade80", bg: "bg-[#4ade80]/12" },
  late: { label: "En retard", color: "#f87171", bg: "bg-[#f87171]/12" },
  partial: { label: "Partiel", color: "#f97316", bg: "bg-[#f97316]/12" },
  canceled: { label: "Annulé", color: "#8b8b9e", bg: "bg-[#8b8b9e]/12" },
};

const STATUS_ICON: Record<DocumentStatus, typeof Check> = {
  draft: Clock,
  sent: FileText,
  accepted: Check,
  refused: X,
  paid: Check,
  late: AlertTriangle,
  partial: CircleMinus,
  canceled: X,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

interface DocumentListProps {
  documents: InvoiceDocument[];
  filter: DocumentType | "all";
  onSelect: (doc: InvoiceDocument) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (doc: InvoiceDocument) => void;
}

export function DocumentList({ documents, filter, onSelect, onDelete, onDuplicate }: DocumentListProps) {
  const filtered = filter === "all" ? documents : documents.filter((d) => d.type === filter);
  const sorted = [...filtered].sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground/60">
        <FileText className="size-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Aucun document pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((doc) => {
        const cfg = STATUS_CONFIG[doc.status];
        const Icon = STATUS_ICON[doc.status];
        return (
          <div
            key={doc.id}
            onClick={() => onSelect(doc)}
            className="flex items-center gap-3 py-3 px-4 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className={cn("size-8 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
              <Icon className="size-4" style={{ color: cfg.color }} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{doc.number}</span>
                <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ color: cfg.color, backgroundColor: `${cfg.color}15` }}>
                  {cfg.label}
                </span>
              </div>
              <div className="text-xs text-muted-foreground/60">
                {doc.clientSnapshot?.name ?? "Client"} &middot; {formatDate(doc.issueDate)}
                {doc.items?.length ? ` \u00B7 ${doc.items.length} ligne${doc.items.length > 1 ? "s" : ""}` : ""}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-sm font-bold text-foreground">{fmt(doc.totalTTC)}&nbsp;&euro;</div>
              <div className="text-[10px] text-muted-foreground/60">{doc.type === "devis" ? "Devis" : "Facture"}</div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {onDuplicate && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDuplicate(doc); }}
                  className="text-muted-foreground/40 hover:text-primary transition-colors p-1"
                  title="Dupliquer"
                >
                  <Copy className="size-3.5" />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); if (window.confirm(`Supprimer ${doc.number} ?`)) onDelete(doc.id); }}
                className="text-muted-foreground/40 hover:text-red-400 transition-colors p-1"
                title="Supprimer"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
