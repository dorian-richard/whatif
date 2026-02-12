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
  const totalDays = tjmClients.reduce((s, c) => s + (c.daysPerMonth ?? 0), 0);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Tes clients actuels</h2>
      <p className="text-sm text-gray-400 mb-5">
        Ajoute tes clients avec leur type de facturation. On ajustera apres.
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
            daysPerMonth: 5,
          })
        }
        className="w-full mt-3 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all"
      >
        + Ajouter un client
      </button>

      {clients.length > 0 && (
        <div className="mt-4 p-3 bg-indigo-50 rounded-xl text-center space-y-1">
          <span className="text-sm text-indigo-600 font-medium block">
            CA total : <strong>{fmt(totalCA)}&euro;/mois</strong>
          </span>
          <div className="flex justify-center gap-4 text-xs text-gray-500">
            <span>{clients.filter((c) => c.billing === "tjm").length} TJM</span>
            <span>{clients.filter((c) => c.billing === "forfait").length} Forfait</span>
            <span>{clients.filter((c) => c.billing === "mission").length} Mission</span>
            {totalDays > 0 && <span>{totalDays.toFixed(1)}j factures/mois</span>}
          </div>
        </div>
      )}
    </div>
  );
}
