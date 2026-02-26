import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/** Convert a devis into a facture */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const devisId = body.devisId as string;
  if (!devisId) return NextResponse.json({ error: "Missing devisId" }, { status: 400 });

  const devis = await prisma.document.findFirst({
    where: { id: devisId, userId: user.id, type: "DEVIS", isActive: true },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!devis) return NextResponse.json({ error: "Devis not found" }, { status: 404 });

  const year = new Date().getFullYear();
  const prefix = `F-${year}-`;
  const count = await prisma.document.count({
    where: { userId: user.id, number: { startsWith: prefix } },
  });
  const number = `${prefix}${String(count + 1).padStart(3, "0")}`;

  const facture = await prisma.$transaction(async (tx) => {
    // Mark devis as accepted
    await tx.document.updateMany({
      where: { id: devisId, userId: user.id },
      data: { status: "ACCEPTED" },
    });

    // Create facture from devis
    return tx.document.create({
      data: {
        userId: user.id,
        clientId: devis.clientId,
        type: "FACTURE",
        number,
        status: "DRAFT",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
        totalHT: devis.totalHT,
        totalTVA: devis.totalTVA,
        totalTTC: devis.totalTTC,
        tvaRate: devis.tvaRate,
        clientSnapshot: devis.clientSnapshot ?? undefined,
        issuerSnapshot: devis.issuerSnapshot ?? undefined,
        notes: devis.notes,
        sourceDevisId: devisId,
        items: {
          create: devis.items.map((item, i) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalHT: item.totalHT,
            sortOrder: i,
          })),
        },
      },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
  });

  return NextResponse.json(facture, { status: 201 });
}
