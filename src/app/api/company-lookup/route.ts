import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/company-lookup?q=SIRET_OR_NAME
 * Uses the free French government API (no auth required)
 * https://recherche-entreprises.api.gouv.fr
 */

interface SireneEtablissement {
  siret: string;
  adresse: string;
  code_postal: string;
  libelle_commune: string;
  est_siege: boolean;
}

interface SireneResult {
  siren: string;
  nom_complet: string;
  nom_raison_sociale: string;
  nature_juridique: string;
  activite_principale: string;
  nombre_etablissements: number;
  siege: {
    siret: string;
    adresse: string;
    code_postal: string;
    libelle_commune: string;
  };
  matching_etablissements?: SireneEtablissement[];
}

export interface CompanyLookupResult {
  siren: string;
  siret: string;
  companyName: string;
  legalForm: string;
  nafCode: string;
  address: string;
  zip: string;
  city: string;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 3) {
    return NextResponse.json({ error: "Query too short (min 3 chars)" }, { status: 400 });
  }

  try {
    // The API accepts SIRET (14 digits), SIREN (9 digits), or company name
    const url = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(q)}&page=1&per_page=10`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "API unavailable" }, { status: 502 });
    }

    const data = await res.json();
    const results: CompanyLookupResult[] = (data.results ?? []).map((r: SireneResult) => ({
      siren: r.siren,
      siret: r.siege?.siret ?? "",
      companyName: r.nom_complet ?? r.nom_raison_sociale ?? "",
      legalForm: r.nature_juridique ?? "",
      nafCode: r.activite_principale ?? "",
      address: r.siege?.adresse ?? "",
      zip: r.siege?.code_postal ?? "",
      city: r.siege?.libelle_commune ?? "",
    }));

    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
