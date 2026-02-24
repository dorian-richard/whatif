import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const positions = body.positions as { id: string; positionX: number; positionY: number }[];

  if (!positions?.length) {
    return NextResponse.json({ error: "Missing positions" }, { status: 400 });
  }

  const structure = await prisma.holdingStructure.findUnique({
    where: { userId: user.id },
  });
  if (!structure) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction(
    positions.map((p) =>
      prisma.holdingEntity.updateMany({
        where: { id: p.id, structureId: structure.id },
        data: { positionX: p.positionX, positionY: p.positionY },
      })
    )
  );

  return NextResponse.json({ updated: true });
}
