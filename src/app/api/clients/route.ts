import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clients = await prisma.client.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(clients);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const client = await prisma.client.create({
    data: {
      userId: user.id,
      name: body.name,
      billing: body.billing,
      dailyRate: body.dailyRate,
      daysPerMonth: body.daysPerMonth,
      monthlyAmount: body.monthlyAmount,
      totalAmount: body.totalAmount,
      startMonth: body.startMonth,
      endMonth: body.endMonth,
      color: body.color,
    },
  });

  return NextResponse.json(client, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...data } = body;

  const client = await prisma.client.updateMany({
    where: { id, userId: user.id },
    data,
  });

  return NextResponse.json(client);
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing client id" }, { status: 400 });
  }

  await prisma.client.updateMany({
    where: { id, userId: user.id },
    data: { isActive: false },
  });

  return NextResponse.json({ deleted: true });
}
