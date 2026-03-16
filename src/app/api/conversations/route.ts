import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// GET — list conversations for user
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json(conversations);
}

// POST — create a new conversation
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  const conversation = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: body.title ?? "Nouvelle conversation",
    },
  });

  return NextResponse.json(conversation);
}

// DELETE — delete a conversation
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json().catch(() => ({ id: null }));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.conversation.deleteMany({
    where: { id, userId: user.id },
  });

  return NextResponse.json({ ok: true });
}
