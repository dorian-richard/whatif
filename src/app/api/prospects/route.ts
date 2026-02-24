import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prospects = await prisma.prospect.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(prospects);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const prospect = await prisma.prospect.create({
    data: {
      userId: user.id,
      name: body.name,
      estimatedCA: body.estimatedCA,
      probability: body.probability ?? 50,
      stage: body.stage ?? "LEAD",
      notes: body.notes,
      expectedClose: body.expectedClose ? new Date(body.expectedClose) : null,
      contactEmail: body.contactEmail,
    },
  });

  return NextResponse.json(prospect, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const prospect = await prisma.prospect.updateMany({
    where: { id: body.id, userId: user.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.estimatedCA !== undefined && { estimatedCA: body.estimatedCA }),
      ...(body.probability !== undefined && { probability: body.probability }),
      ...(body.stage !== undefined && { stage: body.stage }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.expectedClose !== undefined && { expectedClose: body.expectedClose ? new Date(body.expectedClose) : null }),
      ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
    },
  });

  return NextResponse.json(prospect);
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.prospect.deleteMany({
    where: { id, userId: user.id },
  });

  return NextResponse.json({ deleted: true });
}
