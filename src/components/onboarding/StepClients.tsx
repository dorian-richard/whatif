"use client";

import { useProfileStore } from "@/stores/useProfileStore";
import { ClientForm } from "@/components/clients/ClientForm";
import { fmt } from "@/lib/utils";
import { getClientBaseCA } from "@/lib/simulation-engine";
import { CLIENT_COLORS } from "@/lib/constants";

export function StepClients() {
  const { clients, addClient, updateClient, removeClient } = useProfileStore();

  const totalCA = clients.reduce((sum, c) => sum + getClientBaseCA(c), 0);
  const tjmClients = clients.filter((c) => c.billing === "tjm");
  const totalDaysPerWeek = tjmClients.reduce((s, c) => s + (c.daysPerWeek ?? 0), 0);

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1">Tes clients actuels</h2>
      <p className="text-sm text-[#8b8b9e] mb-5">
        Ajoute tes clients avec leur type de facturation. On ajustera après.
      </p>

      <div className="space-y-3">
        {clients.map((client) => (
          <ClientForm
            key={client.id}
            client={client}
            onUpdate={(updates) => updateClient(client.id, updates)}
            onRemove={() => removeClient(client.id)}
            isOnly={clients.length <= 1}
          />
        ))}
      </div>

      <button
        onClick={() =>
          addClient({
            name: `Client ${String.fromCharCode(65 + clients.length)}`,
            billing: "tjm",
            dailyRate: 400,
            daysPerWeek: 5,
          })
        }
        className="w-full mt-3 py-2.5 border-2 border-dashed border-white/[0.1] rounded-xl text-sm text-[#5a5a6e] hover:border-[#5682F2]/30 hover:text-[#5682F2] transition-all"
      >
        + Ajouter un client
      </button>

      {clients.length > 0 && (
        <div className="mt-4 p-3 bg-[#5682F2]/10 border border-[#5682F2]/20 rounded-xl text-center space-y-1">
          <span className="text-sm text-[#5682F2] font-medium block">
            CA total : <strong>{fmt(totalCA)}&euro;/mois</strong>
          </span>
          <div className="flex justify-center gap-4 text-xs text-[#8b8b9e]">
            <span>{clients.filter((c) => c.billing === "tjm").length} TJM</span>
            <span>{clients.filter((c) => c.billing === "forfait").length} Forfait</span>
            <span>{clients.filter((c) => c.billing === "mission").length} Mission</span>
            {totalDaysPerWeek > 0 && <span>{totalDaysPerWeek}j/sem facturés</span>}
          </div>
        </div>
      )}
    </div>
  );
}
