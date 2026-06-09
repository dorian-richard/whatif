import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// All writable client columns. Building the Prisma payload from this explicit
// allow-list keeps the API in sync with the schema: any extra field present on
// the client object (e.g. UI-only props) is dropped instead of crashing Prisma
// with "Unknown argument", which previously made every update silently fail.
function buildClientData(
  body: Record<string, unknown>
): Prisma.ClientUncheckedUpdateInput {
  const data: Prisma.ClientUncheckedUpdateInput = {};
  const set = <K extends keyof Prisma.ClientUncheckedUpdateInput>(key: K) => {
    if (body[key as string] !== undefined) {
      data[key] = body[key as string] as never;
    }
  };

  set("name");
  set("dailyRate");
  set("daysPerMonth");
  set("daysPerWeek");
  set("daysPerYear");
  set("monthlyAmount");
  set("totalAmount");
  set("startMonth");
  set("endMonth");
  set("startYear");
  set("endYear");
  set("color");
  set("email");
  set("phone");
  set("contactName");
  set("companyName");
  set("siret");
  set("siren");
  set("tvaNumber");
  set("nafCode");
  set("legalForm");
  set("clientAddress");
  set("clientCity");
  set("clientZip");
  set("clientCountry");
  set("website");
  set("paymentTermDays");

  if (typeof body.billing === "string") {
    data.billing = body.billing.toUpperCase() as Prisma.ClientUncheckedUpdateInput["billing"];
  }

  return data;
}

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

  const data = buildClientData(body);
  const client = await prisma.client.create({
    data: {
      ...data,
      ...(body.id && { id: body.id as string }),
      userId: user.id,
      name: body.name as string,
      billing: (body.billing as string).toUpperCase() as Prisma.ClientUncheckedCreateInput["billing"],
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
  const { id } = body;
  const data = buildClientData(body);

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
