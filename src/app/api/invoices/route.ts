import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const type = searchParams.get("type");

  const where: Record<string, unknown> = { userId: user.id, isActive: true };
  if (type) where.type = type.toUpperCase();
  if (year) {
    const y = Number(year);
    where.issueDate = {
      gte: new Date(y, 0, 1),
      lt: new Date(y + 1, 0, 1),
    };
  }

  const documents = await prisma.document.findMany({
    where,
    include: { items: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const type = (body.type as string).toUpperCase() as "DEVIS" | "FACTURE";
  const year = new Date(body.issueDate ?? Date.now()).getFullYear();
  const prefix = type === "DEVIS" ? `D-${year}-` : `F-${year}-`;

  // Auto-generate number
  const count = await prisma.document.count({
    where: { userId: user.id, number: { startsWith: prefix } },
  });
  const number = `${prefix}${String(count + 1).padStart(3, "0")}`;

  const items = (body.items ?? []).map((item: Record<string, unknown>, i: number) => ({
    id: (item.id as string) || undefined,
    description: item.description as string,
    quantity: Number(item.quantity) || 1,
    unitPrice: Number(item.unitPrice) || 0,
    totalHT: Number(item.totalHT) || 0,
    sortOrder: i,
  }));

  const doc = await prisma.document.create({
    data: {
      userId: user.id,
      clientId: body.clientId,
      type,
      number,
      status: ((body.status as string)?.toUpperCase() ?? "DRAFT") as "DRAFT" | "SENT" | "ACCEPTED" | "REFUSED" | "PAID" | "LATE" | "PARTIAL" | "CANCELED",
      issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      totalHT: Number(body.totalHT) || 0,
      totalTVA: Number(body.totalTVA) || 0,
      totalTTC: Number(body.totalTTC) || 0,
      tvaRate: Number(body.tvaRate) ?? 20,
      clientSnapshot: body.clientSnapshot ?? undefined,
      issuerSnapshot: body.issuerSnapshot ?? undefined,
      notes: body.notes ?? null,
      sourceDevisId: body.sourceDevisId ?? null,
      items: { create: items },
    },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(doc, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, items, ...data } = body;

  if (!id) return NextResponse.json({ error: "Missing document id" }, { status: 400 });

  // Convert enums to uppercase
  if (data.status) data.status = (data.status as string).toUpperCase();
  if (data.type) data.type = (data.type as string).toUpperCase();

  // Convert dates
  if (data.issueDate) data.issueDate = new Date(data.issueDate);
  if (data.dueDate) data.dueDate = new Date(data.dueDate);
  if (data.validUntil) data.validUntil = new Date(data.validUntil);
  if (data.sentAt) data.sentAt = new Date(data.sentAt);
  if (data.paidAt) data.paidAt = new Date(data.paidAt);

  const doc = await prisma.$transaction(async (tx) => {
    // Update document
    await tx.document.updateMany({
      where: { id, userId: user.id },
      data,
    });

    // Replace items if provided
    if (items) {
      await tx.documentItem.deleteMany({ where: { documentId: id } });
      if (items.length > 0) {
        await tx.documentItem.createMany({
          data: items.map((item: Record<string, unknown>, i: number) => ({
            documentId: id,
            description: item.description as string,
            quantity: Number(item.quantity) || 1,
            unitPrice: Number(item.unitPrice) || 0,
            totalHT: Number(item.totalHT) || 0,
            sortOrder: i,
          })),
        });
      }
    }

    return tx.document.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
  });

  return NextResponse.json(doc);
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing document id" }, { status: 400 });

  await prisma.document.updateMany({
    where: { id, userId: user.id },
    data: { isActive: false },
  });

  return NextResponse.json({ deleted: true });
}
