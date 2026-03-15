import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

// Allow up to 60s for AI responses
export const maxDuration = 60;

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
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Feature restricted to specific users
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

    const clients = context.clients as Array<Record<string, unknown>> | undefined;
    if (clients?.length) {
      parts.push(`\nClients (${clients.length}) :`);
      for (const c of clients) {
        const billing = c.billing === "tjm" ? `TJM ${c.dailyRate}€, ${c.daysPerWeek ?? c.daysPerMonth ?? "?"}j` :
                        c.billing === "forfait" ? `Forfait ${c.monthlyAmount}€/mois` :
                        `Mission ${c.totalAmount}€`;
        const active = c.isActive === false ? " (inactif)" : "";
        parts.push(`  - ${c.name}${c.companyName ? ` (${c.companyName})` : ""} : ${billing}${active}`);
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
    // Use non-streaming for reliability, then return the full response
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT + contextBlock,
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return Response.json({ text });
  } catch (err) {
    console.error("Assistant API error:", err);
    return Response.json({ error: "Erreur de l'assistant IA" }, { status: 500 });
  }
}
