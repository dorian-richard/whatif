import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

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
    description: "Navigue vers une page de l'application Freelens.",
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

function buildContextBlock(context: Record<string, unknown>): string {
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

  return parts.length > 0 ? `\n\n<user_context>\n${parts.join("\n")}\n</user_context>` : "";
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const ALLOWED_EMAILS = ["dorich@icloud.com"];
  if (!ALLOWED_EMAILS.includes(user.email ?? "")) {
    return Response.json({ error: "Feature not available" }, { status: 403 });
  }

  let body: { messages?: Array<{ role: string; content: string }>; context?: Record<string, unknown> };
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { messages, context } = body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Missing messages" }, { status: 400 });
  }

  const contextBlock = context ? buildContextBlock(context) : "";
  const systemPrompt = SYSTEM_PROMPT + contextBlock;
  const apiMessages = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  try {
    // Step 1: Check for tool use (non-streaming)
    const firstResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      tools: TOOLS,
      messages: apiMessages,
    });

    // Check if there are tool calls
    const toolBlocks = firstResponse.content.filter(b => b.type === "tool_use");
    const actions: Array<{ type: string; data: Record<string, unknown> }> = [];

    if (toolBlocks.length > 0) {
      for (const block of toolBlocks) {
        if (block.type === "tool_use") {
          actions.push({ type: block.name, data: block.input as Record<string, unknown> });
        }
      }

      // Get text from this response too
      const text = firstResponse.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map(b => b.text)
        .join("");

      // Build confirmation text for actions
      let actionText = "";
      for (const a of actions) {
        if (a.type === "create_invoice" || a.type === "create_devis") {
          const total = (a.data.quantity as number) * (a.data.unitPrice as number);
          const docType = a.type === "create_devis" ? "Devis" : "Facture";
          actionText += `\n\n**${docType} créé en brouillon** pour **${a.data.clientName}** : ${a.data.quantity} ${a.data.unit ?? "jour"}(s) x ${a.data.unitPrice}€ = **${total.toLocaleString("fr-FR")}€ HT**`;
        } else if (a.type === "navigate") {
          actionText += `\n\nRedirection vers **${a.data.page}**...`;
        }
      }

      return Response.json({ text: (text + actionText).trim(), actions });
    }

    // Step 2: No tools — stream the response
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: apiMessages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: event.delta.text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Assistant API error:", err);
    return Response.json({ error: "Erreur de l'assistant IA" }, { status: 500 });
  }
}
