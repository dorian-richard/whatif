import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    include: { clients: { where: { isActive: true }, orderBy: { createdAt: "asc" } } },
  });

  if (!profile) {
    // Create profile on first access
    const newProfile = await prisma.user.create({
      data: { id: user.id, email: user.email! },
      include: { clients: true },
    });
    return NextResponse.json(newProfile);
  }

  return NextResponse.json(profile);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { monthlyExpenses, savings, adminHoursPerWeek, workDaysPerWeek, onboardingCompleted } = body;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(monthlyExpenses !== undefined && { monthlyExpenses }),
      ...(savings !== undefined && { savings }),
      ...(adminHoursPerWeek !== undefined && { adminHoursPerWeek }),
      ...(workDaysPerWeek !== undefined && { workDaysPerWeek }),
      ...(onboardingCompleted !== undefined && { onboardingCompleted }),
    },
  });

  return NextResponse.json(updated);
}
