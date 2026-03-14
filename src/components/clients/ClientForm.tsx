"use client";

import { useState, useCallback } from "react";
import type { ClientData, BillingType } from "@/types";
import { BillingTypePicker } from "./BillingTypePicker";
import { fmt, cn } from "@/lib/utils";
import { MONTHS_SHORT } from "@/lib/constants";
import { JOURS_OUVRES } from "@/lib/simulation-engine";
import { Search, Building2, Loader2, ChevronDown, ChevronUp } from "@/components/ui/icons";

interface CompanyResult {
  siren: string;
  siret: string;
  companyName: string;
  legalForm: string;
  nafCode: string;
  address: string;
  zip: string;
  city: string;
}

interface ClientFormProps {
  client: ClientData;
  onUpdate: (updates: Partial<ClientData>) => void;
  onRemove: () => void;
  isOnly: boolean;
}

export function ClientForm({ client, onUpdate, onRemove, isOnly }: ClientFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const [siretQuery, setSiretQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CompanyResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const ca = getDisplayCA(client);

  const handleSiretSearch = useCallback(async () => {
    const q = siretQuery.trim();
    if (q.length < 3) return;
    setSearching(true);
    setShowResults(true);
    try {
      const res = await fetch(`/api/company-lookup?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch { /* ignore */ }
    setSearching(false);
  }, [siretQuery]);

  const handleSelectCompany = useCallback((company: CompanyResult) => {
    onUpdate({
      companyName: company.companyName,
      siret: company.siret,
      siren: company.siren,
      nafCode: company.nafCode,
      legalForm: company.legalForm,
      clientAddress: company.address,
      clientCity: company.city,
      clientZip: company.zip,
      name: client.name || company.companyName,
    });
    setShowResults(false);
    setSiretQuery("");
    setShowCompanyInfo(true);
  }, [client.name, onUpdate]);

  const inputCls = "w-full px-3 py-2 bg-muted/50 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#5682F2]/40";

  return (
    <div className="border border-border rounded-xl p-4 space-y-3 bg-card hover:border-border transition-colors">
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: client.color ?? "#6366f1" }}
        />
        <input
          className="flex-1 text-sm font-medium bg-transparent outline-none text-foreground placeholder:text-muted-foreground/70"
          value={client.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Nom du client"
        />
        <span className="text-sm font-bold text-[#5682F2] bg-[#5682F2]/10 px-2.5 py-1 rounded-lg">
          {fmt(ca)}&euro; HT/mois
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground/70 hover:text-foreground transition-colors text-sm"
        >
          {expanded ? "\u25B2" : "\u25BC"}
        </button>
        {!isOnly && (
          <button
            onClick={onRemove}
            className="text-muted-foreground/70 hover:text-red-400 transition-colors text-lg"
          >
            &times;
          </button>
        )}
      </div>

      {expanded && (
        <div className="space-y-4 pt-2">
          {/* ── SIRET Search ── */}
          <div>
            <label className="text-xs text-muted-foreground/70 mb-1.5 flex items-center gap-1.5">
              <Building2 className="size-3.5" />
              Recherche entreprise (SIRET, SIREN ou nom)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={siretQuery}
                  onChange={(e) => setSiretQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSiretSearch()}
                  placeholder="Ex: 12345678901234 ou Acme Corp"
                  className={inputCls}
                />
              </div>
              <button
                onClick={handleSiretSearch}
                disabled={searching || siretQuery.trim().length < 3}
                className="px-3 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                Chercher
              </button>
            </div>

            {/* Search results dropdown */}
            {showResults && (
              <div className="mt-2 border border-border rounded-xl overflow-hidden bg-card shadow-lg max-h-60 overflow-y-auto">
                {searching ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin inline mr-2" />
                    Recherche en cours...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Aucun résultat trouvé
                  </div>
                ) : (
                  searchResults.map((r) => (
                    <button
                      key={r.siret}
                      onClick={() => handleSelectCompany(r)}
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
                    >
                      <div className="text-sm font-medium text-foreground">{r.companyName}</div>
                      <div className="text-xs text-muted-foreground/70 mt-0.5">
                        SIRET {r.siret} &middot; {r.city} {r.zip} &middot; {r.legalForm}
                      </div>
                    </button>
                  ))
                )}
                <button
                  onClick={() => setShowResults(false)}
                  className="w-full text-center py-2 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/30"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>

          {/* ── Company Info (collapsible) ── */}
          <div>
            <button
              onClick={() => setShowCompanyInfo(!showCompanyInfo)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-foreground transition-colors mb-2"
            >
              {showCompanyInfo ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              Informations entreprise
              {client.siret && (
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium ml-1">
                  SIRET renseigné
                </span>
              )}
            </button>

            {showCompanyInfo && (
              <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground/70 mb-1 block">Raison sociale</label>
                    <input
                      type="text"
                      value={client.companyName ?? ""}
                      onChange={(e) => onUpdate({ companyName: e.target.value })}
                      placeholder="Nom de l'entreprise"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground/70 mb-1 block">SIRET</label>
                    <input
                      type="text"
                      value={client.siret ?? ""}
                      onChange={(e) => onUpdate({ siret: e.target.value })}
                      placeholder="14 chiffres"
                      maxLength={14}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground/70 mb-1 block">SIREN</label>
                    <input
                      type="text"
                      value={client.siren ?? ""}
                      onChange={(e) => onUpdate({ siren: e.target.value })}
                      placeholder="9 chiffres"
                      maxLength={9}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground/70 mb-1 block">N° TVA intra.</label>
                    <input
                      type="text"
                      value={client.tvaNumber ?? ""}
                      onChange={(e) => onUpdate({ tvaNumber: e.target.value })}
                      placeholder="FR12345678901"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground/70 mb-1 block">Code NAF</label>
                    <input
                      type="text"
                      value={client.nafCode ?? ""}
                      onChange={(e) => onUpdate({ nafCode: e.target.value })}
                      placeholder="6201Z"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground/70 mb-1 block">Forme juridique</label>
                    <input
                      type="text"
                      value={client.legalForm ?? ""}
                      onChange={(e) => onUpdate({ legalForm: e.target.value })}
                      placeholder="SAS, SARL, SA..."
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="text-xs text-muted-foreground/70 mb-1 block">Adresse</label>
                  <input
                    type="text"
                    value={client.clientAddress ?? ""}
                    onChange={(e) => onUpdate({ clientAddress: e.target.value })}
                    placeholder="12 rue de la Paix"
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground/70 mb-1 block">Code postal</label>
                    <input
                      type="text"
                      value={client.clientZip ?? ""}
                      onChange={(e) => onUpdate({ clientZip: e.target.value })}
                      placeholder="75001"
                      maxLength={5}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground/70 mb-1 block">Ville</label>
                    <input
                      type="text"
                      value={client.clientCity ?? ""}
                      onChange={(e) => onUpdate({ clientCity: e.target.value })}
                      placeholder="Paris"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground/70 mb-1 block">Pays</label>
                    <input
                      type="text"
                      value={client.clientCountry ?? "France"}
                      onChange={(e) => onUpdate({ clientCountry: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground/70 mb-1 block">Contact principal</label>
                    <input
                      type="text"
                      value={client.contactName ?? ""}
                      onChange={(e) => onUpdate({ contactName: e.target.value })}
                      placeholder="Jean Dupont"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground/70 mb-1 block">Email</label>
                    <input
                      type="email"
                      value={client.email ?? ""}
                      onChange={(e) => onUpdate({ email: e.target.value })}
                      placeholder="contact@example.com"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground/70 mb-1 block">Téléphone</label>
                    <input
                      type="tel"
                      value={client.phone ?? ""}
                      onChange={(e) => onUpdate({ phone: e.target.value })}
                      placeholder="06 12 34 56 78"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground/70 mb-1 block">Site web</label>
                    <input
                      type="url"
                      value={client.website ?? ""}
                      onChange={(e) => onUpdate({ website: e.target.value })}
                      placeholder="https://example.com"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground/70 mb-1 block">Délai de paiement (jours)</label>
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={client.paymentTermDays ?? 30}
                    onChange={(e) => onUpdate({ paymentTermDays: Number(e.target.value) || 30 })}
                    className={cn(inputCls, "w-32 text-right")}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Billing Type ── */}
          <BillingTypePicker
            value={client.billing}
            onChange={(billing) => {
              const updates: Partial<ClientData> = { billing };
              if (billing === "mission" && client.startMonth == null) {
                const m = new Date().getMonth();
                updates.startMonth = m;
                updates.endMonth = m;
              }
              onUpdate(updates);
            }}
          />

          {client.billing === "tjm" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground/70 mb-1 block">TJM HT</label>
                  <div className="relative">
                    <input
                      type="number"
                      className={cn(inputCls, "text-right pr-10")}
                      value={client.dailyRate ?? ""}
                      onChange={(e) => onUpdate({ dailyRate: Number(e.target.value) || 0 })}
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
                      className={cn(inputCls, "text-right pr-10")}
                      value={client.daysPerWeek ?? ""}
                      onChange={(e) => onUpdate({ daysPerWeek: Number(e.target.value) || 0 })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">j/sem</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground/70 mb-1 block">Jours / an (optionnel)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="260"
                    placeholder="Auto"
                    className={cn(inputCls, "text-right pr-10 placeholder:text-muted-foreground/70")}
                    value={client.daysPerYear ?? ""}
                    onChange={(e) => {
                      const v = e.target.value === "" ? undefined : Number(e.target.value) || 0;
                      onUpdate({ daysPerYear: v });
                    }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">j/an</span>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground bg-muted/50 border border-border px-3 py-1.5 rounded-lg">
                {client.daysPerYear
                  ? `${client.daysPerYear}j/an \u2192 ~${Math.round(client.daysPerYear / 12)}j/mois \u2192 ${fmt((client.dailyRate ?? 0) * client.daysPerYear / 12)}\u20AC/mois`
                  : `${JOURS_OUVRES[new Date().getMonth()]} jours ouvrés ce mois (${(client.daysPerWeek ?? 0)}j/sem)`}
              </div>
              {/* Période optionnelle */}
              {(client.startMonth != null || client.endMonth != null) ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground/70">Période du contrat</label>
                    <button
                      onClick={() => onUpdate({ startMonth: undefined, endMonth: undefined })}
                      className="text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors"
                    >
                      Retirer
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground/70 mb-1 block">Début</label>
                      <select
                        className={inputCls}
                        value={client.startMonth ?? 0}
                        onChange={(e) => onUpdate({ startMonth: Number(e.target.value) })}
                      >
                        {MONTHS_SHORT.map((m, i) => (
                          <option key={i} value={i}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground/70 mb-1 block">Fin</label>
                      <select
                        className={inputCls}
                        value={client.endMonth ?? 11}
                        onChange={(e) => onUpdate({ endMonth: Number(e.target.value) })}
                      >
                        {MONTHS_SHORT.map((m, i) => (
                          <option key={i} value={i}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    const m = new Date().getMonth();
                    onUpdate({ startMonth: m, endMonth: 11 });
                  }}
                  className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  + Définir une période (optionnel)
                </button>
              )}
            </div>
          )}

          {client.billing === "forfait" && (
            <div>
              <label className="text-xs text-muted-foreground/70 mb-1 block">Montant mensuel HT</label>
              <div className="relative">
                <input
                  type="number"
                  className={cn(inputCls, "text-right pr-12")}
                  value={client.monthlyAmount ?? ""}
                  onChange={(e) => onUpdate({ monthlyAmount: Number(e.target.value) || 0 })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">&euro;/mois</span>
              </div>
            </div>
          )}

          {client.billing === "mission" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground/70 mb-1 block">Montant total HT</label>
                <div className="relative">
                  <input
                    type="number"
                    className={cn(inputCls, "text-right pr-6")}
                    value={client.totalAmount ?? ""}
                    onChange={(e) => onUpdate({ totalAmount: Number(e.target.value) || 0 })}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">&euro;</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground/70 mb-1 block">Debut</label>
                  <select
                    className={inputCls}
                    value={client.startMonth ?? 0}
                    onChange={(e) => onUpdate({ startMonth: Number(e.target.value) })}
                  >
                    {MONTHS_SHORT.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground/70 mb-1 block">Fin</label>
                  <select
                    className={inputCls}
                    value={client.endMonth ?? 11}
                    onChange={(e) => onUpdate({ endMonth: Number(e.target.value) })}
                  >
                    {MONTHS_SHORT.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getDisplayCA(client: ClientData): number {
  switch (client.billing) {
    case "tjm":
      if (client.daysPerYear) return (client.dailyRate ?? 0) * client.daysPerYear / 12;
      return (client.dailyRate ?? 0) * (client.daysPerWeek ?? 0) / 5 * JOURS_OUVRES[new Date().getMonth()];
    case "forfait":
      return client.monthlyAmount ?? 0;
    case "mission": {
      const duration = Math.max(1, (client.endMonth ?? 11) - (client.startMonth ?? 0) + 1);
      return (client.totalAmount ?? 0) / duration;
    }
    default:
      return 0;
  }
}
