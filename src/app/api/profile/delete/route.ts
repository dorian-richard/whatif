import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Cancel Stripe subscription if active
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { subscriptionId: true, stripeCustomerId: true },
    });

    if (dbUser?.subscriptionId) {
      try {
        await stripe.subscriptions.cancel(dbUser.subscriptionId);
      } catch (err) {
        console.error("Failed to cancel Stripe subscription:", err);
      }
    }

    // 2. Delete user from DB (cascade deletes clients, scenarios, payments)
    await prisma.user.delete({ where: { id: user.id } });

    // 3. Delete Supabase auth user
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await supabaseAdmin.auth.admin.deleteUser(user.id);

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
