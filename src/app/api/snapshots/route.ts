import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");

  const where: { userId: string; year?: number } = { userId: user.id };
  if (yearParam && yearParam !== "all") {
    where.year = parseInt(yearParam);
  }

  const snapshots = await prisma.monthlySnapshot.findMany({
    where,
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });

  return NextResponse.json(snapshots);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const snapshot = await prisma.monthlySnapshot.upsert({
    where: {
      userId_month_year: { userId: user.id, month: body.month, year: body.year },
    },
    update: {
      ca: body.ca,
      net: body.net,
      clientCount: body.clientCount,
      avgTJM: body.avgTJM,
      paymentRate: body.paymentRate,
      expenses: body.expenses,
    },
    create: {
      userId: user.id,
      month: body.month,
      year: body.year,
      ca: body.ca,
      net: body.net,
      clientCount: body.clientCount,
      avgTJM: body.avgTJM,
      paymentRate: body.paymentRate,
      expenses: body.expenses,
    },
  });

  return NextResponse.json(snapshot, { status: 201 });
}
