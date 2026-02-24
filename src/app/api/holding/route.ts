import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const structure = await prisma.holdingStructure.findUnique({
    where: { userId: user.id },
    include: { entities: true, flows: true },
  });

  return NextResponse.json(structure);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const structure = await prisma.holdingStructure.create({
    data: {
      userId: user.id,
      name: body.name ?? "Ma structure holding",
      entities: {
        create: (body.entities ?? []).map((e: Record<string, unknown>) => ({
          name: e.name as string,
          type: (e.type as string).toUpperCase() as "HOLDING" | "OPERATING" | "PERSON",
          businessStatus: e.businessStatus as string | undefined,
          annualCA: (e.annualCA as number) ?? 0,
          annualSalary: (e.annualSalary as number) ?? 0,
          managementFees: (e.managementFees as number) ?? 0,
          positionX: (e.positionX as number) ?? 0,
          positionY: (e.positionY as number) ?? 0,
          color: e.color as string | undefined,
        })),
      },
    },
    include: { entities: true, flows: true },
  });

  // Create flows after entities exist (we need the new IDs)
  if (body.flows?.length && body.entities?.length) {
    const oldToNew = new Map<string, string>();
    (body.entities as { id: string }[]).forEach((oldE, i) => {
      oldToNew.set(oldE.id, structure.entities[i].id);
    });

    for (const f of body.flows as { fromEntityId: string; toEntityId: string; type: string; annualAmount?: number }[]) {
      const fromId = oldToNew.get(f.fromEntityId);
      const toId = oldToNew.get(f.toEntityId);
      if (fromId && toId) {
        await prisma.holdingFlow.create({
          data: {
            structureId: structure.id,
            fromEntityId: fromId,
            toEntityId: toId,
            type: f.type.toUpperCase() as "DIVIDEND" | "MANAGEMENT_FEE" | "SALARY",
            annualAmount: f.annualAmount ?? 0,
          },
        });
      }
    }
  }

  const result = await prisma.holdingStructure.findUnique({
    where: { id: structure.id },
    include: { entities: true, flows: true },
  });

  return NextResponse.json(result, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const structure = await prisma.holdingStructure.findUnique({
    where: { userId: user.id },
  });
  if (!structure) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    // Update name
    if (body.name) {
      await tx.holdingStructure.update({
        where: { id: structure.id },
        data: { name: body.name },
      });
    }

    // Sync entities: delete removed, upsert existing
    if (body.entities) {
      const incomingIds = (body.entities as { id: string }[]).map((e) => e.id);
      await tx.holdingEntity.deleteMany({
        where: { structureId: structure.id, id: { notIn: incomingIds } },
      });

      for (const e of body.entities as Record<string, unknown>[]) {
        await tx.holdingEntity.upsert({
          where: { id: e.id as string },
          create: {
            id: e.id as string,
            structureId: structure.id,
            name: e.name as string,
            type: (e.type as string).toUpperCase() as "HOLDING" | "OPERATING" | "PERSON",
            businessStatus: e.businessStatus as string | undefined,
            annualCA: (e.annualCA as number) ?? 0,
            annualSalary: (e.annualSalary as number) ?? 0,
            managementFees: (e.managementFees as number) ?? 0,
            positionX: (e.positionX as number) ?? 0,
            positionY: (e.positionY as number) ?? 0,
            color: e.color as string | undefined,
          },
          update: {
            name: e.name as string,
            type: (e.type as string).toUpperCase() as "HOLDING" | "OPERATING" | "PERSON",
            businessStatus: e.businessStatus as string | undefined,
            annualCA: (e.annualCA as number) ?? 0,
            annualSalary: (e.annualSalary as number) ?? 0,
            managementFees: (e.managementFees as number) ?? 0,
            positionX: (e.positionX as number) ?? 0,
            positionY: (e.positionY as number) ?? 0,
            color: e.color as string | undefined,
          },
        });
      }
    }

    // Sync flows
    if (body.flows) {
      const incomingFlowIds = (body.flows as { id: string }[]).map((f) => f.id);
      await tx.holdingFlow.deleteMany({
        where: { structureId: structure.id, id: { notIn: incomingFlowIds } },
      });

      for (const f of body.flows as Record<string, unknown>[]) {
        await tx.holdingFlow.upsert({
          where: { id: f.id as string },
          create: {
            id: f.id as string,
            structureId: structure.id,
            fromEntityId: f.fromEntityId as string,
            toEntityId: f.toEntityId as string,
            type: (f.type as string).toUpperCase() as "DIVIDEND" | "MANAGEMENT_FEE" | "SALARY",
            annualAmount: (f.annualAmount as number) ?? 0,
          },
          update: {
            fromEntityId: f.fromEntityId as string,
            toEntityId: f.toEntityId as string,
            type: (f.type as string).toUpperCase() as "DIVIDEND" | "MANAGEMENT_FEE" | "SALARY",
            annualAmount: (f.annualAmount as number) ?? 0,
          },
        });
      }
    }
  });

  const result = await prisma.holdingStructure.findUnique({
    where: { id: structure.id },
    include: { entities: true, flows: true },
  });

  return NextResponse.json(result);
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.holdingStructure.deleteMany({
    where: { userId: user.id },
  });

  return NextResponse.json({ deleted: true });
}
