/*
 * Funnel de vérité — LECTURE SEULE sur ta base.
 * Lance : node scripts/funnel.cjs   (depuis la racine du repo)
 * Aucune écriture. Affiche où ça bloque + tes leads chauds non-payants à contacter.
 */
const fs = require("fs");
const path = require("path");

// Charge DATABASE_URL depuis .env.local (Prisma lit .env par défaut, pas .env.local)
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const pct = (n, d) => (d > 0 ? `${((n / d) * 100).toFixed(1)}%` : "—");
const daysAgo = (n) => new Date(Date.now() - n * 86400000);

(async () => {
  const total = await prisma.user.count();
  if (total === 0) {
    console.log("Base vide (0 utilisateur).");
    return;
  }

  const [byStatus, onboarded, withStripe, withTrial, activated, withScenario, withDoc, withProspect, withSnapshot] =
    await Promise.all([
      prisma.user.groupBy({ by: ["subscriptionStatus"], _count: true }),
      prisma.user.count({ where: { onboardingCompleted: true } }),
      prisma.user.count({ where: { stripeCustomerId: { not: null } } }),
      prisma.user.count({ where: { trialEndsAt: { not: null } } }),
      prisma.user.count({ where: { clients: { some: {} } } }),
      prisma.user.count({ where: { scenarios: { some: {} } } }),
      prisma.user.count({ where: { documents: { some: {} } } }),
      prisma.user.count({ where: { prospects: { some: {} } } }),
      prisma.user.count({ where: { snapshots: { some: {} } } }),
    ]);

  const statusMap = Object.fromEntries(byStatus.map((s) => [s.subscriptionStatus, s._count]));
  const paying = statusMap.ACTIVE || 0;

  const [signups30, signups90] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: daysAgo(30) } } }),
    prisma.user.count({ where: { createdAt: { gte: daysAgo(90) } } }),
  ]);

  const allUsers = await prisma.user.findMany({ select: { createdAt: true } });
  const byMonth = {};
  for (const u of allUsers) {
    const k = u.createdAt.toISOString().slice(0, 7);
    byMonth[k] = (byMonth[k] || 0) + 1;
  }

  console.log("\n════════════════ FUNNEL FREELENS (base réelle) ════════════════\n");
  console.log(`Inscrits (total) ............... ${total}`);
  console.log(`  onboarding terminé ........... ${onboarded}  (${pct(onboarded, total)})`);
  console.log(`  activés (≥1 client) .......... ${activated}  (${pct(activated, total)})`);
  console.log(`  ≥1 scénario .................. ${withScenario}  (${pct(withScenario, total)})`);
  console.log(`  ≥1 facture/devis ............. ${withDoc}  (${pct(withDoc, total)})`);
  console.log(`  ≥1 prospect (pipeline) ....... ${withProspect}  (${pct(withProspect, total)})`);
  console.log(`  ≥1 snapshot mensuel .......... ${withSnapshot}  (${pct(withSnapshot, total)})`);
  console.log(`  a ouvert le checkout Stripe .. ${withStripe}  (${pct(withStripe, total)})`);
  console.log(`  a eu un essai (trialEndsAt) .. ${withTrial}  (${pct(withTrial, total)})`);
  console.log("\nStatut d'abonnement :");
  for (const st of ["FREE", "ACTIVE", "CANCELED", "PAST_DUE"]) {
    console.log(`  ${st.padEnd(10)} ${statusMap[st] || 0}`);
  }
  console.log(`\n>>> CLIENTS PAYANTS (ACTIVE) : ${paying}   —   taux inscrit→payant : ${pct(paying, total)}`);
  console.log(`\nInscriptions 30 j : ${signups30}   ·   90 j : ${signups90}`);
  console.log("\nInscriptions par mois :");
  for (const k of Object.keys(byMonth).sort()) {
    console.log(`  ${k}  ${"█".repeat(Math.min(byMonth[k], 60))} ${byMonth[k]}`);
  }

  console.log("\n──────────────── OÙ ÇA BLOQUE ────────────────");
  if (total < 30) {
    console.log("→ Goulot EN HAUT : trop peu d'inscrits pour conclure sur la conversion.");
    console.log("  Priorité n°1 = ACQUISITION (aller chercher des gens à la main), pas le produit/prix.");
  } else if (withStripe > 0 && paying === 0) {
    console.log(`→ Goulot au CHECKOUT : ${withStripe} ont ouvert le paiement, 0 a payé.`);
    console.log("  Problème = PRIX / offre / blocage technique paiement. Teste une offre membre fondateur.");
  } else if (activated > 0 && withStripe === 0) {
    console.log(`→ Goulot TRIAL→PAID : ${activated} activent le produit mais 0 n'ouvre le paiement.`);
    console.log("  Le produit ne déclenche pas l'achat. Fais un ASK payant direct à ces gens.");
  } else if (onboarded / total < 0.4) {
    console.log(`→ Goulot ACTIVATION : seulement ${pct(onboarded, total)} finissent l'onboarding.`);
    console.log("  Ils s'inscrivent mais ne voient jamais la valeur. Raccourcis le 'aha' (leur vrai net).");
  } else {
    console.log(`→ Taux inscrit→payant = ${pct(paying, total)} (SaaS freemium sain ≈ 2-5%).`);
  }

  const hot = await prisma.user.findMany({
    where: {
      subscriptionStatus: { in: ["FREE", "CANCELED", "PAST_DUE"] },
      OR: [{ onboardingCompleted: true }, { clients: { some: {} } }],
    },
    select: {
      email: true, createdAt: true, businessStatus: true, trialEndsAt: true,
      _count: { select: { clients: true, scenarios: true, documents: true, prospects: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  console.log(`\n──────── ${hot.length} LEADS CHAUDS NON-PAYANTS (à contacter cette semaine) ────────`);
  console.log("(ils ont onboardé OU ajouté un client, mais ne paient pas)\n");
  for (const u of hot) {
    const eng = `${u._count.clients}cli/${u._count.scenarios}scé/${u._count.documents}fact/${u._count.prospects}prosp`;
    console.log(`  ${u.email.padEnd(34)} ${u.createdAt.toISOString().slice(0, 10)}  ${(u.businessStatus || "?").padEnd(8)} ${eng}`);
  }
})()
  .catch((e) => { console.error("ERREUR:", e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
