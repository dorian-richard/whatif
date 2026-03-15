import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// Allow up to 60s for AI responses
export const maxDuration = 60;

const anthropic = new Anthropic();

const TOOLS: Anthropic.Tool[] = [
  {
    name: "create_invoice",
    description: "Crée un brouillon de facture pour un client. Utilise cette fonction quand l'utilisateur demande de créer/générer une facture.",
    input_schema: {
      type: "object" as const,
      properties: {
        clientName: { type: "string", description: "Nom du client (doit correspondre à un client existant)" },
        description: { type: "string", description: "Description de la prestation" },
        quantity: { type: "number", description: "Nombre de jours/unités" },
        unitPrice: { type: "number", description: "Prix unitaire HT" },
        unit: { type: "string", description: "Unité (jour, heure, mois, forfait)", default: "jour" },
        month: { type: "number", description: "Mois de la prestation (1-12)" },
        year: { type: "number", description: "Année de la prestation" },
      },
      required: ["clientName", "description", "quantity", "unitPrice"],
    },
  },
  {
    name: "create_devis",
    description: "Crée un brouillon de devis pour un client. Utilise cette fonction quand l'utilisateur demande de créer/générer un devis.",
    input_schema: {
      type: "object" as const,
      properties: {
        clientName: { type: "string", description: "Nom du client" },
        description: { type: "string", description: "Description de la prestation" },
        quantity: { type: "number", description: "Nombre de jours/unités" },
        unitPrice: { type: "number", description: "Prix unitaire HT" },
        unit: { type: "string", description: "Unité (jour, heure, mois, forfait)", default: "jour" },
        validDays: { type: "number", description: "Durée de validité en jours", default: 30 },
      },
      required: ["clientName", "description", "quantity", "unitPrice"],
    },
  },
  {
    name: "navigate",
    description: "Navigue vers une page de l'application Freelens. Utilise cette fonction quand l'utilisateur demande d'aller quelque part ou de voir quelque chose.",
    input_schema: {
      type: "object" as const,
      properties: {
        page: {
          type: "string",
          enum: ["dashboard", "simulateur", "facturation", "journee", "pipeline", "settings", "objectif", "holding"],
          description: "Page de destination",
        },
      },
      required: ["page"],
    },
  },
];

const SYSTEM_PROMPT = `Tu es l'assistant IA de Freelens, le copilote financier des freelances en France.

Tu aides les freelances à :
- Comprendre leur situation financière (CA, charges, net, trésorerie)
- Comparer les statuts juridiques (micro-entreprise, EURL, SASU, portage salarial)
- Optimiser leur fiscalité (ACRE, versement libératoire, IS vs IR, dividendes)
- Fixer leur TJM et négocier leurs tarifs
- Gérer leur facturation et leurs clients
- Planifier (vacances, épargne, retraite, investissement)

Tu peux aussi AGIR pour l'utilisateur :
- Créer des factures et devis via l'outil create_invoice / create_devis
- Naviguer vers les pages de l'app via l'outil navigate
Quand l'utilisateur te demande de créer un document, utilise les outils. Déduis le TJM et les infos client du contexte utilisateur.

Règles :
- Réponds en français, de manière concise et directe
- Utilise les données du profil de l'utilisateur quand elles sont disponibles pour personnaliser tes réponses
- Fais des calculs précis quand c'est possible, en montrant les chiffres
- Précise toujours quand une info est une estimation vs un calcul exact
- Ne donne jamais de conseil juridique ou fiscal définitif — recommande de consulter un expert-comptable pour les décisions importantes
- Sois proactif : si tu vois une optimisation possible dans les données de l'utilisateur, mentionne-la
- Formate tes réponses avec du markdown (gras, listes, tableaux) pour la lisibilité
- N'utilise JAMAIS d'emojis ou d'icônes dans tes réponses
- Sois bref : 2-4 paragraphes max sauf si l'utilisateur demande une analyse détaillée`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ALLOWED_EMAILS = ["dorich@icloud.com"];
  if (!ALLOWED_EMAILS.includes(user.email ?? "")) {
    return Response.json({ error: "Feature not available" }, { status: 403 });
  }

  let body: { messages?: Array<{ role: string; content: string }>; context?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages, context } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Missing messages" }, { status: 400 });
  }

  // Build context block
  let contextBlock = "";
  if (context) {
    const parts: string[] = [];

    if (context.businessStatus) parts.push(`Statut juridique : ${context.businessStatus}`);
    if (context.role) parts.push(`Métier : ${context.role}`);
    if (context.companyName) parts.push(`Entreprise : ${context.companyName}`);
    if (context.monthlyExpenses) parts.push(`Charges fixes mensuelles : ${context.monthlyExpenses}€`);
    if (context.savings) parts.push(`Épargne : ${context.savings}€`);
    if (context.workDaysPerWeek) parts.push(`Jours travaillés/semaine : ${context.workDaysPerWeek}`);
    if (context.age) parts.push(`Âge : ${context.age} ans`);
    if (context.monthlySalary) parts.push(`Salaire mensuel (SASU/EURL) : ${context.monthlySalary}€`);
    if (context.nbParts) parts.push(`Parts fiscales : ${context.nbParts}`);
    if (context.chargesPro) parts.push(`Charges pro mensuelles : ${context.chargesPro}€`);

    const clients = context.clients as Array<Record<string, unknown>> | undefined;
    if (clients?.length) {
      parts.push(`\nClients (${clients.length}) :`);
      for (const c of clients) {
        const billing = c.billing === "tjm" ? `TJM ${c.dailyRate}€, ${c.daysPerWeek ?? c.daysPerMonth ?? "?"}j/sem` :
                        c.billing === "forfait" ? `Forfait ${c.monthlyAmount}€/mois` :
                        `Mission ${c.totalAmount}€`;
        const active = c.isActive === false ? " (inactif)" : "";
        parts.push(`  - ${c.name}${c.companyName ? ` (${c.companyName})` : ""} [id: ${c.id}] : ${billing}${active}`);
      }
    }

    if (context.caAnnuel) parts.push(`\nCA annuel estimé : ${context.caAnnuel}€`);
    if (context.netAnnuel) parts.push(`Net annuel estimé : ${context.netAnnuel}€`);

    const invoices = context.invoices as Record<string, unknown> | undefined;
    if (invoices) {
      parts.push(`\nFactures : ${invoices.total} au total, ${invoices.unpaid} impayées (${invoices.unpaidAmount}€), ${invoices.drafts} brouillons`);
    }

    if (parts.length > 0) {
      contextBlock = `\n\n<user_context>\n${parts.join("\n")}\n</user_context>`;
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT + contextBlock,
      tools: TOOLS,
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    // Extract text and tool calls
    const textParts: string[] = [];
    const actions: Array<{ type: string; data: Record<string, unknown> }> = [];

    for (const block of response.content) {
      if (block.type === "text") {
        textParts.push(block.text);
      } else if (block.type === "tool_use") {
        const input = block.input as Record<string, unknown>;
        actions.push({ type: block.name, data: input });

        // Generate confirmation text for each action
        if (block.name === "create_invoice") {
          const total = (input.quantity as number) * (input.unitPrice as number);
          textParts.push(`\n\nFacture créée en brouillon pour **${input.clientName}** : ${input.quantity} ${input.unit ?? "jour"}${(input.quantity as number) > 1 ? "s" : ""} x ${input.unitPrice}€ = **${total.toLocaleString("fr-FR")}€ HT**`);
        } else if (block.name === "create_devis") {
          const total = (input.quantity as number) * (input.unitPrice as number);
          textParts.push(`\n\nDevis créé en brouillon pour **${input.clientName}** : ${input.quantity} ${input.unit ?? "jour"}${(input.quantity as number) > 1 ? "s" : ""} x ${input.unitPrice}€ = **${total.toLocaleString("fr-FR")}€ HT**`);
        } else if (block.name === "navigate") {
          textParts.push(`\n\nRedirection vers **${input.page}**...`);
        }
      }
    }

    return Response.json({
      text: textParts.join(""),
      actions: actions.length > 0 ? actions : undefined,
    });
  } catch (err) {
    console.error("Assistant API error:", err);
    return Response.json({ error: "Erreur de l'assistant IA" }, { status: 500 });
  }
}
