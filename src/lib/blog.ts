export interface BlogSection {
  title: string;
  content: string; // HTML string
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO date
  readingTime: string;
  keywords: string[];
  sections: BlogSection[];
  cta: { text: string; href: string; sub: string };
  relatedLinks: { label: string; href: string }[];
}

export const BLOG_POSTS: BlogPost[] = [
  // ─── Article 1 : Statuts juridiques ───
  {
    slug: "micro-entreprise-vs-sasu-vs-eurl-2026",
    title: "Micro-entreprise, SASU ou EURL en 2026 : quel statut freelance choisir ?",
    description:
      "Compare les statuts juridiques pour freelances en 2026 : micro-entreprise, EI, EURL, SASU, portage. Charges, fiscalité, protection sociale et exemples chiffrés.",
    date: "2026-03-04",
    readingTime: "12 min",
    keywords: [
      "micro-entreprise vs sasu",
      "statut freelance 2026",
      "eurl vs sasu",
      "quel statut choisir freelance",
      "comparatif statuts juridiques",
    ],
    sections: [
      {
        title: "Pourquoi le choix du statut est crucial",
        content: `<p>En freelance, ton statut juridique détermine <strong>trois choses essentielles</strong> : combien tu paies de charges sociales, comment tu es imposé, et quel niveau de protection sociale tu as (retraite, maladie, chômage).</p>
<p>À chiffre d'affaires identique, l'écart de <strong>revenu net entre deux statuts peut dépasser 15 000€ par an</strong>. Un développeur à 600€/jour en micro-entreprise touche environ 20% de plus qu'en SASU à l'IS avec salaire. Mais la SASU offre une protection sociale bien supérieure.</p>
<p>Il n'y a pas de "meilleur" statut universel. Le bon choix dépend de ton CA prévisionnel, de tes besoins en protection sociale, et de ta stratégie de rémunération. Voici le comparatif complet pour 2026.</p>`,
      },
      {
        title: "Les 5 statuts freelance comparés",
        content: `<p>En France en 2026, un freelance peut exercer sous 5 formes juridiques principales :</p>

<p><strong>1. La micro-entreprise (ex auto-entrepreneur)</strong></p>
<p>Le statut le plus simple. Pas de comptabilité, déclaration trimestrielle du CA, cotisations calculées sur le CA (pas le bénéfice). Idéal pour démarrer ou si ton CA reste sous le plafond de 77 700€ (prestations BNC). Charges sociales : environ 21,1% du CA en BNC (taux URSSAF 2026 : 23,1% dont 2% pour la formation, ou 24,6% avec versement libératoire de l'IR).</p>

<p><strong>2. L'entreprise individuelle au réel (EI)</strong></p>
<p>Pas de plafond de CA. Tu déduis tes frais réels (matériel, coworking, déplacements). Cotisations calculées sur le bénéfice (~45%). Intéressant si tu as des charges professionnelles élevées. Depuis 2022, l'EI bénéficie de la séparation des patrimoines automatique.</p>

<p><strong>3. L'EURL (Entreprise Unipersonnelle à Responsabilité Limitée)</strong></p>
<p>Société unipersonnelle. Deux régimes fiscaux possibles :</p>
<ul>
<li><strong>EURL à l'IR</strong> : fonctionnement proche de l'EI, cotisations TNS (~45%), pas d'IS.</li>
<li><strong>EURL à l'IS</strong> : la société paie l'IS sur le bénéfice (15% jusqu'à 42 500€, 25% au-delà). Tu te verses un salaire (cotisations TNS ~45%) et/ou des dividendes (cotisations ~17% + CSG/CRDS). Permet d'optimiser le mix rémunération.</li>
</ul>

<p><strong>4. La SASU (Société par Actions Simplifiée Unipersonnelle)</strong></p>
<p>Le président est assimilé salarié (régime général de la Sécu). Deux régimes :</p>
<ul>
<li><strong>SASU à l'IR</strong> : rare, limité à 5 ans. Le bénéfice est imposé à l'IR du dirigeant.</li>
<li><strong>SASU à l'IS</strong> : le plus courant. IS sur le bénéfice, salaire soumis aux charges patronales (~65% du net), dividendes soumis au PFU (30% flat tax). Charges élevées mais excellente couverture sociale et pas de RSI.</li>
</ul>

<p><strong>5. Le portage salarial</strong></p>
<p>Tu es salarié d'une société de portage qui facture tes clients. Avantages : CDI, assurance chômage, mutuelle, zéro admin. Inconvénient : frais de gestion de 7 à 10% du CA, plus les charges salariales classiques. Il te reste environ 45 à 50% du CA facturé.</p>`,
      },
      {
        title: "Tableau comparatif des statuts",
        content: `<table>
<thead><tr><th>Critère</th><th>Micro</th><th>EI</th><th>EURL IS</th><th>SASU IS</th><th>Portage</th></tr></thead>
<tbody>
<tr><td><strong>Charges sociales</strong></td><td>~21%</td><td>~45%</td><td>~35-50%</td><td>~65%</td><td>~50%</td></tr>
<tr><td><strong>Plafond CA</strong></td><td>77 700€</td><td>Illimité</td><td>Illimité</td><td>Illimité</td><td>Illimité</td></tr>
<tr><td><strong>Protection sociale</strong></td><td>Minimale</td><td>TNS</td><td>TNS</td><td>Régime général</td><td>Salarié</td></tr>
<tr><td><strong>Déduction frais</strong></td><td>Non</td><td>Oui</td><td>Oui</td><td>Oui</td><td>Non</td></tr>
<tr><td><strong>Dividendes</strong></td><td>Non</td><td>Non</td><td>Oui</td><td>Oui (PFU 30%)</td><td>Non</td></tr>
<tr><td><strong>Complexité admin</strong></td><td>Très faible</td><td>Moyenne</td><td>Élevée</td><td>Élevée</td><td>Très faible</td></tr>
<tr><td><strong>Comptable requis</strong></td><td>Non</td><td>Recommandé</td><td>Oui</td><td>Oui</td><td>Non</td></tr>
</tbody>
</table>
<p><em>Taux indicatifs incluant cotisations sociales. Le taux effectif dépend de ton CA, de ta rémunération et de ta situation fiscale.</em></p>`,
      },
      {
        title: "Quel statut choisir selon ton CA ?",
        content: `<p>Voici des recommandations générales basées sur le chiffre d'affaires annuel :</p>

<p><strong>CA &lt; 40 000€/an</strong> — La <strong>micro-entreprise</strong> est presque toujours le meilleur choix. Charges faibles (~21%), admin minimale, pas de comptable nécessaire. Le versement libératoire de l'IR peut être avantageux si ton taux d'imposition est bas.</p>

<p><strong>CA 40 000 — 77 700€/an</strong> — La micro reste intéressante, mais <strong>compare avec l'EURL à l'IS</strong> si tu as des frais professionnels significatifs (matériel, déplacements, sous-traitance). L'EURL permet de déduire ces frais et d'optimiser via les dividendes.</p>

<p><strong>CA 77 700 — 120 000€/an</strong> — Tu dépasses le plafond micro. Le choix se fait entre <strong>EURL IS</strong> (charges plus faibles, statut TNS) et <strong>SASU IS</strong> (charges plus élevées, meilleure protection sociale). L'EURL IS est souvent plus avantageuse en net pur.</p>

<p><strong>CA &gt; 120 000€/an</strong> — Les deux structures IS fonctionnent bien. La SASU IS permet de se verser des dividendes au PFU (30% flat tax) sans cotisations sociales supplémentaires, ce qui peut être très avantageux. Consulte un expert-comptable pour optimiser le mix salaire/dividendes.</p>

<p><strong>Exemples chiffrés (CA 100 000€, TJM ~500€, 200 jours)</strong> :</p>
<ul>
<li>Micro-entreprise : impossible (plafond 77 700€)</li>
<li>EURL IS (mix salaire 3 000€/mois + dividendes) : <strong>~62 000€ net</strong></li>
<li>SASU IS (salaire 3 000€/mois + dividendes) : <strong>~55 000€ net</strong></li>
<li>Portage salarial (8% de frais) : <strong>~48 000€ net</strong></li>
</ul>`,
      },
      {
        title: "Comment changer de statut",
        content: `<p>Tu as démarré en micro et tu dépasses le plafond ? Tu veux passer d'EI à SASU ? Voici ce qu'il faut savoir :</p>

<p><strong>Micro → EURL/SASU</strong> : tu fermes ta micro (radiation CFE) et crées ta société (statuts, dépôt de capital, immatriculation). Délai : 2 à 4 semaines. Coût : 500 à 2 000€ avec un juriste en ligne.</p>

<p><strong>EURL → SASU (ou inversement)</strong> : c'est une transformation juridique. Il faut modifier les statuts, changer le régime social du dirigeant, et parfois réévaluer le capital. Un expert-comptable est indispensable.</p>

<p><strong>EI → Société</strong> : tu peux apporter ton fonds de commerce à ta nouvelle société. Les contrats clients sont transférés.</p>

<p><strong>Le bon moment pour changer</strong> : en début d'année fiscale si possible, pour simplifier la comptabilité. Anticipe 1 à 2 mois avant le changement effectif.</p>

<p>Avant de changer, utilise le <a href="/comparateur-statuts-freelance">comparateur de statuts Freelens</a> pour simuler l'impact exact sur ton revenu net.</p>`,
      },
    ],
    cta: {
      text: "Comparer les statuts sur mon CA réel \u2192",
      href: "/signup",
      sub: "Sans carte bancaire \u00B7 Résultat instantané",
    },
    relatedLinks: [
      { label: "Simulateur de revenus freelance", href: "/simulateur-revenus-freelance" },
      { label: "TJM freelance 2026", href: "/tjm-freelance" },
      { label: "Charges freelance 2026", href: "/blog/charges-freelance-2026-urssaf-impots" },
      { label: "Devenir freelance", href: "/devenir-freelance" },
    ],
  },

  // ─── Article 2 : Charges & fiscalité ───
  {
    slug: "charges-freelance-2026-urssaf-impots",
    title: "Charges freelance en 2026 : URSSAF, impôts et cotisations expliqués",
    description:
      "Tout comprendre sur les charges freelance en 2026 : cotisations URSSAF par statut, impôt sur le revenu, IS, CFE. Exemples chiffrés et tableaux comparatifs.",
    date: "2026-03-04",
    readingTime: "14 min",
    keywords: [
      "charges freelance 2026",
      "cotisations urssaf freelance",
      "impôts freelance",
      "charges sociales indépendant",
      "combien de charges en freelance",
    ],
    sections: [
      {
        title: "Combien il reste vraiment après charges",
        content: `<p>C'est LA question de tout freelance : <strong>sur 100€ facturés, combien je garde ?</strong> La réponse dépend de ton statut juridique, de ton niveau de CA, et de ta situation fiscale.</p>
<p>En résumé rapide :</p>
<ul>
<li><strong>Micro-entreprise BNC</strong> : il te reste environ <strong>60 à 65%</strong> après cotisations + IR</li>
<li><strong>EI au réel</strong> : environ <strong>45 à 55%</strong> (mais tu déduis tes frais)</li>
<li><strong>EURL à l'IS</strong> : environ <strong>55 à 65%</strong> avec un mix salaire/dividendes optimisé</li>
<li><strong>SASU à l'IS</strong> : environ <strong>45 à 55%</strong> (charges patronales élevées, mais meilleure protection)</li>
<li><strong>Portage salarial</strong> : environ <strong>45 à 50%</strong></li>
</ul>
<p>Ces fourchettes incluent cotisations sociales ET impôt sur le revenu. Voyons le détail.</p>`,
      },
      {
        title: "Les cotisations URSSAF par statut (taux 2026)",
        content: `<p>Les cotisations sociales sont le premier prélèvement sur ton activité. Elles financent ta retraite, ta santé, et tes indemnités journalières.</p>

<p><strong>Micro-entreprise (BNC)</strong></p>
<p>Taux unique calculé sur le CA : <strong>23,1%</strong> (dont 0,3% de formation professionnelle). Si tu optes pour le versement libératoire de l'IR, ajoute 2,2%, soit 25,3% au total. C'est simple mais tu ne peux pas déduire tes frais.</p>

<p><strong>EI au réel / EURL à l'IR</strong></p>
<p>Cotisations TNS calculées sur le <strong>bénéfice</strong> (CA - charges déductibles). Taux global : environ <strong>45%</strong> du bénéfice. Détail : maladie-maternité (~6,5%), retraite de base (~17,75%), retraite complémentaire (~7-8%), invalidité-décès (~1,3%), allocations familiales (~3,1%), CSG/CRDS (~9,7%), formation (~0,3%).</p>

<p><strong>EURL à l'IS</strong></p>
<p>Deux composantes : cotisations TNS sur ta rémunération (~45%), et IS + prélèvements sur les dividendes. Les dividendes d'EURL IS supérieurs à 10% du capital sont soumis aux cotisations sociales TNS. En dessous de ce seuil : prélèvements sociaux de 17,2%.</p>

<p><strong>SASU à l'IS</strong></p>
<p>Le président est assimilé salarié. Charges patronales : environ <strong>45% du salaire brut</strong>, soit ~65% du salaire net. Les dividendes sont soumis au PFU (Prélèvement Forfaitaire Unique) de 30% (12,8% IR + 17,2% prélèvements sociaux), sans cotisations sociales supplémentaires.</p>

<p><strong>Portage salarial</strong></p>
<p>Frais de gestion : 7 à 10% du CA HT. Puis charges salariales classiques (~22% du brut) + charges patronales (~42% du brut). Il te reste environ 47 à 52% du CA initial.</p>`,
      },
      {
        title: "L'impôt sur le revenu (IR)",
        content: `<p>En plus des cotisations sociales, tu paies l'impôt sur le revenu. Le barème progressif 2026 :</p>

<table>
<thead><tr><th>Tranche de revenu</th><th>Taux d'imposition</th></tr></thead>
<tbody>
<tr><td>Jusqu'à 11 294€</td><td>0%</td></tr>
<tr><td>11 295€ à 28 797€</td><td>11%</td></tr>
<tr><td>28 798€ à 82 341€</td><td>30%</td></tr>
<tr><td>82 342€ à 177 106€</td><td>41%</td></tr>
<tr><td>Au-delà de 177 106€</td><td>45%</td></tr>
</tbody>
</table>

<p><strong>En micro-entreprise</strong>, le revenu imposable est le CA après abattement forfaitaire (34% pour les BNC, soit 66% du CA imposé). Option : le versement libératoire à 2,2% du CA si ton revenu fiscal de référence N-2 ne dépasse pas certains seuils.</p>

<p><strong>En EI/EURL IR</strong>, le bénéfice (CA - charges déductibles - cotisations) est soumis au barème progressif.</p>

<p><strong>En EURL/SASU IS</strong>, ton salaire est soumis au barème IR classique. Les dividendes sont soumis au PFU de 30% (ou au barème progressif sur option).</p>`,
      },
      {
        title: "L'impôt sur les sociétés (IS)",
        content: `<p>Si tu es en EURL IS ou SASU IS, ta société paie l'IS sur son bénéfice (après déduction de ton salaire et de toutes les charges) :</p>
<ul>
<li><strong>15%</strong> sur les premiers 42 500€ de bénéfice (taux réduit PME)</li>
<li><strong>25%</strong> au-delà</li>
</ul>
<p>Ce taux réduit à 15% est un avantage important des structures IS pour les freelances. Si ta société fait 50 000€ de bénéfice, tu paies : 42 500 × 15% + 7 500 × 25% = 6 375 + 1 875 = <strong>8 250€ d'IS</strong>, soit un taux effectif de 16,5%.</p>
<p>Le bénéfice après IS peut ensuite être distribué en dividendes (soumis au PFU de 30%) ou conservé dans la société pour investir.</p>`,
      },
      {
        title: "La CFE et autres taxes",
        content: `<p><strong>La CFE (Cotisation Foncière des Entreprises)</strong> est due par tous les freelances, quel que soit le statut. Son montant dépend de ta commune et de ton CA (de 200 à 2 000€/an en général). Tu en es exonéré la première année d'activité.</p>
<p><strong>La CVAE (Cotisation sur la Valeur Ajoutée)</strong> ne concerne que les CA supérieurs à 500 000€ — rare pour un freelance solo.</p>
<p><strong>La TVA</strong> : en franchise en base si CA &lt; 36 800€ (prestations). Au-delà, tu collectes 20% de TVA sur tes factures et tu reverses à l'État. Ce n'est pas une charge car le client la paie, mais c'est de l'admin en plus.</p>`,
      },
      {
        title: "Du CA brut au net réel : exemples chiffrés",
        content: `<p>Combien il reste sur 12 mois pour un freelance tech avec 5 semaines de vacances :</p>

<table>
<thead><tr><th>TJM</th><th>CA annuel</th><th>Micro</th><th>EURL IS</th><th>SASU IS</th></tr></thead>
<tbody>
<tr><td>500€</td><td>~105 000€</td><td>Impossible*</td><td>~62 000€</td><td>~54 000€</td></tr>
<tr><td>650€</td><td>~136 000€</td><td>Impossible*</td><td>~78 000€</td><td>~68 000€</td></tr>
<tr><td>800€</td><td>~168 000€</td><td>Impossible*</td><td>~93 000€</td><td>~82 000€</td></tr>
<tr><td>400€</td><td>~72 000€</td><td>~52 000€</td><td>~47 000€</td><td>~40 000€</td></tr>
</tbody>
</table>
<p><em>*Plafond micro BNC : 77 700€. Estimations incluant cotisations sociales + IR (taux moyen). Le net EURL/SASU IS suppose un mix salaire/dividendes optimisé.</em></p>

<p>Pour un calcul précis adapté à ta situation, utilise le <a href="/simulateur-revenus-freelance">simulateur Freelens</a> qui intègre les taux URSSAF 2026 et le barème IR en vigueur.</p>`,
      },
      {
        title: "Comment optimiser ses charges légalement",
        content: `<p>Quelques leviers d'optimisation parfaitement légaux :</p>
<ul>
<li><strong>Choisir le bon statut</strong> : c'est le levier n°1. Un mauvais choix peut coûter 10 000€+/an.</li>
<li><strong>Mix salaire/dividendes</strong> (IS) : en EURL/SASU IS, ajuste la proportion salaire vs dividendes pour minimiser le total charges + impôts.</li>
<li><strong>ACRE</strong> : exonération partielle de cotisations la première année (50% en micro, variable en société). Ne la rate pas !</li>
<li><strong>Frais professionnels</strong> : en société ou EI réel, déduis tout ce qui est lié à ton activité (matériel, logiciels, transport, repas d'affaires).</li>
<li><strong>Plan d'épargne retraite (PER)</strong> : les versements sont déductibles du revenu imposable.</li>
<li><strong>Versement libératoire</strong> (micro) : avantageux si ton taux marginal IR est supérieur à 11%.</li>
</ul>
<p>Attention : l'optimisation fiscale est légale et recommandée. L'évasion fiscale ne l'est pas. Consulte un expert-comptable pour ta situation spécifique.</p>`,
      },
    ],
    cta: {
      text: "Simuler mon net après charges \u2192",
      href: "/signup",
      sub: "Taux URSSAF 2026 \u00B7 Barème IR en vigueur",
    },
    relatedLinks: [
      { label: "Comparateur de statuts freelance", href: "/comparateur-statuts-freelance" },
      { label: "TJM freelance 2026", href: "/blog/combien-facturer-freelance-2026-tjm" },
      { label: "Quel statut freelance choisir ?", href: "/blog/micro-entreprise-vs-sasu-vs-eurl-2026" },
      { label: "Simulateur de revenus", href: "/simulateur-revenus-freelance" },
    ],
  },

  // ─── Article 3 : TJM & tarification ───
  {
    slug: "combien-facturer-freelance-2026-tjm",
    title: "Combien facturer en freelance en 2026 ? Guide TJM complet",
    description:
      "Guide complet pour fixer son TJM freelance en 2026 : formule de calcul, benchmark par métier, négociation, erreurs à éviter. Avec exemples chiffrés.",
    date: "2026-03-04",
    readingTime: "13 min",
    keywords: [
      "combien facturer freelance",
      "TJM freelance 2026",
      "tarif journalier moyen",
      "prix freelance",
      "calculer son TJM",
    ],
    sections: [
      {
        title: "La question que tout freelance se pose",
        content: `<p>"Combien je me facture ?" C'est la première question — et souvent la plus angoissante — quand on se lance en freelance. <strong>Trop bas, tu ne couvres pas tes charges. Trop haut, tu perds des missions.</strong></p>
<p>Le TJM (Taux Journalier Moyen) est la base de ta rémunération. Contrairement au salariat où ton employeur gère la complexité, en freelance c'est à toi de calculer ce qu'il faut facturer pour atteindre ton objectif de revenu net.</p>
<p>Ce guide te donne la méthode, les références marché, et les erreurs à éviter.</p>`,
      },
      {
        title: "Comment calculer son TJM : la formule inversée",
        content: `<p>La plupart des freelances font l'erreur de fixer leur TJM "au feeling" ou en copiant un collègue. La bonne méthode : <strong>partir de ton objectif de revenu net et remonter au TJM nécessaire.</strong></p>

<p>La formule simplifiée :</p>
<p><strong>TJM = (Revenu net cible + Charges sociales + Impôts + Charges fixes) ÷ Jours facturés</strong></p>

<p>En pratique :</p>
<ol>
<li><strong>Définis ton revenu net mensuel cible</strong> (ce que tu veux sur ton compte perso). Ex : 4 000€/mois.</li>
<li><strong>Calcule tes jours facturés par an</strong> : 52 semaines × 5 jours = 260 jours - week-ends - 25 jours de vacances - 10 jours fériés - 10 jours non facturés (admin, prospection, maladie) = <strong>environ 200 à 215 jours</strong>.</li>
<li><strong>Ajoute tes charges</strong> : cotisations URSSAF + IR + charges fixes (mutuelle, comptable, matériel, coworking). En micro BNC, compte environ 35 à 40% de charges globales. En SASU IS, 50 à 55%.</li>
<li><strong>Divise le total par le nombre de jours</strong>.</li>
</ol>

<p><strong>Exemple concret</strong> : tu veux 4 000€ net/mois en micro-entreprise, avec 5 semaines de vacances et 500€/mois de charges fixes.</p>
<ul>
<li>Besoin annuel : 4 000 × 12 + 500 × 12 = 54 000€</li>
<li>En micro, les charges sociales + IR représentent ~35% du CA</li>
<li>CA nécessaire : 54 000 / 0,65 ≈ 83 000€ → tu dépasses le plafond micro !</li>
<li>Avec 210 jours facturés : TJM = 83 000 / 210 ≈ <strong>395€/jour</strong></li>
</ul>

<p>Plutôt que faire ce calcul à la main, utilise l'outil <a href="/objectif">Objectif Revenu de Freelens</a> qui gère toutes les subtilités (barème progressif IR, seuils URSSAF, saisonnalité).</p>`,
      },
      {
        title: "Benchmark TJM 2026 par métier",
        content: `<p>Voici les fourchettes de TJM observées sur le marché freelance français en 2026, basées sur les données Malt, Silkhom et Comet :</p>

<table>
<thead><tr><th>Métier</th><th>Junior (0-3 ans)</th><th>Confirmé (3-7 ans)</th><th>Senior (7+ ans)</th></tr></thead>
<tbody>
<tr><td>Développeur fullstack</td><td>350-450€</td><td>450-550€</td><td>550-700€</td></tr>
<tr><td>Développeur React / Next.js</td><td>400-500€</td><td>500-600€</td><td>600-750€</td></tr>
<tr><td>Développeur mobile (React Native, Flutter)</td><td>400-500€</td><td>500-650€</td><td>650-800€</td></tr>
<tr><td>Data Engineer</td><td>450-550€</td><td>550-700€</td><td>700-900€</td></tr>
<tr><td>Data Scientist / ML Engineer</td><td>450-550€</td><td>600-750€</td><td>750-1 000€</td></tr>
<tr><td>DevOps / Cloud / SRE</td><td>450-550€</td><td>550-700€</td><td>700-900€</td></tr>
<tr><td>Architecte technique / CTO</td><td>—</td><td>600-800€</td><td>800-1 200€</td></tr>
<tr><td>Product Manager</td><td>400-500€</td><td>500-650€</td><td>650-850€</td></tr>
<tr><td>Product Designer / UX</td><td>350-450€</td><td>450-600€</td><td>600-800€</td></tr>
<tr><td>Consultant cybersécurité</td><td>500-600€</td><td>600-800€</td><td>800-1 100€</td></tr>
<tr><td>Consultant marketing digital</td><td>300-400€</td><td>400-550€</td><td>550-750€</td></tr>
<tr><td>Chef de projet / Scrum Master</td><td>350-450€</td><td>450-600€</td><td>600-800€</td></tr>
<tr><td>Business Analyst</td><td>350-450€</td><td>450-600€</td><td>600-750€</td></tr>
<tr><td>Consultant SAP / Salesforce</td><td>400-500€</td><td>550-700€</td><td>700-950€</td></tr>
<tr><td>Graphiste / Directeur artistique</td><td>250-350€</td><td>350-500€</td><td>500-700€</td></tr>
</tbody>
</table>

<p><em>Ces fourchettes sont indicatives et varient selon la localisation (Paris +10-20%), le secteur client (finance, luxe = premium), et la durée de mission (missions courtes = TJM plus élevé).</em></p>

<p>Compare ton TJM actuel avec le marché sur le <a href="/benchmark">benchmark Freelens</a> qui couvre 27 métiers tech.</p>`,
      },
      {
        title: "Les facteurs qui influencent ton TJM",
        content: `<p>Ton TJM n'est pas juste un chiffre arbitraire. Voici les 6 facteurs qui le déterminent :</p>

<p><strong>1. L'expérience</strong> — C'est le facteur n°1. Un senior avec 10 ans d'expérience peut facturer 50 à 100% de plus qu'un junior. Les clients paient pour la capacité à livrer vite et bien, pas juste les heures.</p>

<p><strong>2. La spécialisation</strong> — Un "développeur fullstack" est interchangeable. Un "expert Next.js / Vercel avec expérience e-commerce à fort trafic" est rare et cher. Plus ta niche est pointue, plus tu peux facturer.</p>

<p><strong>3. La localisation</strong> — Paris et l'Île-de-France offrent des TJM 10 à 20% plus élevés que la province. Le full remote a réduit cet écart mais il existe encore, notamment pour les missions on-site.</p>

<p><strong>4. Le secteur client</strong> — Finance, assurance, luxe et pharma paient des TJM premium (+20-30%). Les startups et PME paient moins mais offrent souvent plus de flexibilité et d'autonomie.</p>

<p><strong>5. La durée de mission</strong> — Une mission de 2 jours se facture plus cher au TJM qu'une mission longue de 12 mois. Le client paie la flexibilité et le risque d'intercontrat.</p>

<p><strong>6. Ta réputation et ton réseau</strong> — Les recommandations et le bouche-à-oreille permettent de facturer plus cher. Un freelance avec des références solides peut justifier un premium de 15-25%.</p>`,
      },
      {
        title: "TJM vs forfait vs mission : quand utiliser quoi",
        content: `<p>Le TJM n'est pas le seul mode de facturation. Voici quand utiliser chaque modèle :</p>

<p><strong>TJM (Taux Journalier Moyen)</strong></p>
<p>Le plus courant en freelance tech. Tu factures au nombre de jours travaillés. Avantages : simple, prévisible, adapté aux missions longues. Inconvénient : tu vends ton temps, pas ta valeur. Utilise-le pour les missions de régie (intégré chez le client).</p>

<p><strong>Forfait mensuel</strong></p>
<p>Tu factures un montant fixe par mois, indépendamment des jours travaillés. Avantage : revenu prévisible pour toi et le client. Idéal pour les clients récurrents avec un volume de travail stable. Permet de "travailler moins et gagner pareil" quand tu es efficace.</p>

<p><strong>Mission ponctuelle (forfait projet)</strong></p>
<p>Un prix fixe pour un livrable défini. Avantage : tu peux facturer la valeur créée, pas le temps passé. Risque : sous-estimation du temps nécessaire. À utiliser quand tu maîtrises bien le périmètre du projet.</p>

<p><strong>La stratégie optimale</strong> : combine les trois. Un client récurrent en forfait mensuel (base stable), des missions TJM en régie (volume), et des projets ponctuels au forfait (marge élevée).</p>`,
      },
      {
        title: "Comment négocier et augmenter son TJM",
        content: `<p>Augmenter ton TJM de 50€/jour sur 200 jours = <strong>10 000€ de plus par an</strong>. Voici comment :</p>

<p><strong>1. Ne donne jamais ton TJM en premier.</strong> Demande le budget du client. "Quel est le budget prévu pour cette mission ?" te donne un ancrage.</p>

<p><strong>2. Justifie par la valeur, pas par le temps.</strong> "Mon intervention va réduire le time-to-market de 3 mois" vaut plus que "je suis senior donc je facture plus".</p>

<p><strong>3. Augmente à chaque nouveau client.</strong> C'est le moment le plus facile pour augmenter. Chaque nouveau contrat est l'occasion de tester un TJM +50€.</p>

<p><strong>4. Augmente tes clients existants annuellement.</strong> 3 à 5% par an est raisonnable et rarement refusé. Annonce-le en avance : "À partir de janvier, mon TJM passe à X€."</p>

<p><strong>5. Refuse les missions sous-payées.</strong> Chaque mission sous ton tarif tire ta moyenne vers le bas et t'empêche de prendre des missions mieux payées.</p>

<p><strong>6. Diversifie tes sources de revenus.</strong> Formation, conseil, mentorat, produits (SaaS, templates) complètent le TJM et réduisent ta dépendance aux missions.</p>`,
      },
      {
        title: "Les erreurs à éviter",
        content: `<p>Les pièges classiques qui coûtent cher aux freelances :</p>

<p><strong>Erreur n°1 : Oublier les charges dans le calcul.</strong> Un TJM de 500€ ne te rapporte pas 500€/jour. Après charges et impôts, il te reste 250 à 325€ selon ton statut. Calcule toujours en net.</p>

<p><strong>Erreur n°2 : Compter 220 jours facturés.</strong> En réalité, entre les vacances, les jours fériés, la prospection, l'admin et les périodes creuses, un freelance facture en moyenne 180 à 210 jours par an. Sois conservateur.</p>

<p><strong>Erreur n°3 : S'aligner sur le salariat.</strong> "En CDI je gagnais 50k, donc en freelance je vais facturer 250€/jour." Non. Tu dois couvrir tes charges, ta mutuelle, ta retraite, tes congés. Un freelance à 250€/jour gagne moins qu'un salarié à 50k.</p>

<p><strong>Erreur n°4 : Baisser son TJM par peur.</strong> Baisser de 50€ pour décrocher un contrat te coûte 10 000€/an. Si un client ne peut pas payer ton tarif, ce n'est pas ton client.</p>

<p><strong>Erreur n°5 : Ne pas augmenter.</strong> L'inflation, l'expérience que tu gagnes, la valeur que tu apportes — tout justifie une augmentation régulière. 5% par an minimum.</p>`,
      },
    ],
    cta: {
      text: "Calculer mon TJM idéal \u2192",
      href: "/signup",
      sub: "Benchmark 27 métiers \u00B7 Objectif revenu net inclus",
    },
    relatedLinks: [
      { label: "Benchmark TJM par métier", href: "/tjm-freelance" },
      { label: "Simulateur de revenus freelance", href: "/simulateur-revenus-freelance" },
      { label: "Charges freelance 2026", href: "/blog/charges-freelance-2026-urssaf-impots" },
      { label: "Comparateur de statuts", href: "/comparateur-statuts-freelance" },
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}
