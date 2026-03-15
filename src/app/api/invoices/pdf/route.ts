import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";

// Upload PDF blob for a document
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const documentId = formData.get("documentId") as string | null;

  if (!file || !documentId) {
    return NextResponse.json({ error: "Missing file or documentId" }, { status: 400 });
  }

  // Verify document belongs to user
  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId: user.id },
    select: { id: true, number: true, pdfUrl: true },
  });
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  // Delete previous blob if exists
  if (doc.pdfUrl) {
    try { await del(doc.pdfUrl); } catch { /* ignore */ }
  }

  // Upload to Vercel Blob
  const blob = await put(`invoices/${user.id}/${doc.number}.pdf`, file, {
    access: "public",
    contentType: "application/pdf",
  });

  // Update document with PDF URL
  await prisma.document.update({
    where: { id: documentId },
    data: { pdfUrl: blob.url },
  });

  return NextResponse.json({ url: blob.url }, { status: 201 });
}

// Get PDF URL for a document
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");
  if (!documentId) return NextResponse.json({ error: "Missing documentId" }, { status: 400 });

  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId: user.id },
    select: { pdfUrl: true },
  });
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  return NextResponse.json({ url: doc.pdfUrl });
}
