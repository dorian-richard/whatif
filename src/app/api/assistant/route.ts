import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `Tu es l'assistant IA de Freelens, le copilote financier des freelances en France.

Tu aides les freelances à :
- Comprendre leur situation financière (CA, charges, net, trésorerie)
- Comparer les statuts juridiques (micro-entreprise, EURL, SASU, portage salarial)
- Optimiser leur fiscalité (ACRE, versement libératoire, IS vs IR, dividendes)
- Fixer leur TJM et négocier leurs tarifs
- Gérer leur facturation et leurs clients
- Planifier (vacances, épargne, retraite, investissement)

Règles :
- Réponds en français, de manière concise et directe
- Utilise les données du profil de l'utilisateur quand elles sont disponibles pour personnaliser tes réponses
- Fais des calculs précis quand c'est possible, en montrant les chiffres
- Précise toujours quand une info est une estimation vs un calcul exact
- Ne donne jamais de conseil juridique ou fiscal définitif — recommande de consulter un expert-comptable pour les décisions importantes
- Sois proactif : si tu vois une optimisation possible dans les données de l'utilisateur, mentionne-la
- Formate tes réponses avec du markdown (gras, listes, tableaux) pour la lisibilité
- Sois bref : 2-4 paragraphes max sauf si l'utilisateur demande une analyse détaillée`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  // Feature restricted to specific users
  const ALLOWED_EMAILS = ["dorich@icloud.com"];
  if (!ALLOWED_EMAILS.includes(user.email ?? "")) {
    return new Response(JSON.stringify({ error: "Feature not available" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const { messages, context } = await request.json();

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "Missing messages" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Build context block from user's profile data
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

    if (context.clients?.length) {
      parts.push(`\nClients (${context.clients.length}) :`);
      for (const c of context.clients) {
        const billing = c.billing === "tjm" ? `TJM ${c.dailyRate}€, ${c.daysPerWeek ?? c.daysPerMonth ?? "?"}j` :
                        c.billing === "forfait" ? `Forfait ${c.monthlyAmount}€/mois` :
                        `Mission ${c.totalAmount}€`;
        const active = c.isActive === false ? " (inactif)" : "";
        parts.push(`  - ${c.name}${c.companyName ? ` (${c.companyName})` : ""} : ${billing}${active}`);
      }
    }

    if (context.caAnnuel) parts.push(`\nCA annuel estimé : ${context.caAnnuel}€`);
    if (context.netAnnuel) parts.push(`Net annuel estimé : ${context.netAnnuel}€`);

    if (context.invoices) {
      parts.push(`\nFactures : ${context.invoices.total} au total, ${context.invoices.unpaid} impayées (${context.invoices.unpaidAmount}€), ${context.invoices.drafts} brouillons`);
    }

    if (parts.length > 0) {
      contextBlock = `\n\n<user_context>\n${parts.join("\n")}\n</user_context>`;
    }
  }

  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT + contextBlock,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  // Stream response as SSE
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
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
}
