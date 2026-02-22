import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Create user in DB immediately after successful auth
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await prisma.user.upsert({
          where: { id: user.id },
          update: {},
          create: { id: user.id, email: user.email! },
        });
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error — redirect to login with error hint
  return NextResponse.redirect(`${origin}/login`);
}
