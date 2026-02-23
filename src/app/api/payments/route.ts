import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

  const payments = await prisma.payment.findMany({
    where: { userId: user.id, year },
    orderBy: [{ month: "asc" }, { clientId: "asc" }],
  });

  return NextResponse.json(payments);
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

  const payment = await prisma.payment.upsert({
    where: {
      clientId_month_year: {
        clientId: body.clientId,
        month: body.month,
        year: body.year,
      },
    },
    update: {
      expected: body.expected,
      received: body.received ?? 0,
      status: body.status ?? "PENDING",
      paidAt: body.status === "PAID" ? new Date() : null,
    },
    create: {
      ...(body.id && { id: body.id }),
      userId: user.id,
      clientId: body.clientId,
      month: body.month,
      year: body.year,
      expected: body.expected,
      received: body.received ?? 0,
      status: body.status ?? "PENDING",
      paidAt: body.status === "PAID" ? new Date() : null,
    },
  });

  return NextResponse.json(payment, { status: 201 });
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

  const payment = await prisma.payment.updateMany({
    where: {
      userId: user.id,
      clientId: body.clientId,
      month: body.month,
      year: body.year,
    },
    data: {
      received: body.received,
      status: body.status,
      paidAt: body.status === "PAID" ? new Date() : null,
    },
  });

  return NextResponse.json(payment);
}