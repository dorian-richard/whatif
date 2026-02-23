import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan = "monthly" } = await request.json();
    const priceId = plan === "annual" ? PLANS.annual.priceId : PLANS.monthly.priceId;

    // Reuse existing Stripe customer if available (non-blocking — checkout must not fail if DB is slow)
    let stripeCustomerId: string | null = null;
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { stripeCustomerId: true },
      });
      stripeCustomerId = dbUser?.stripeCustomerId ?? null;
    } catch (err) {
      console.error("DB lookup failed, falling back to email:", err);
    }

    const checkoutParams = {
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription" as const,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/simulator?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
      metadata: { userId: user.id },
    };

    let session;
    if (stripeCustomerId) {
      try {
        session = await stripe.checkout.sessions.create({
          ...checkoutParams,
          customer: stripeCustomerId,
        });
      } catch (err: unknown) {
        // Stale customer ID (deleted or wrong env) → clear it and fall back to email
        const stripeErr = err as { code?: string };
        if (stripeErr.code === "resource_missing") {
          console.warn(`Stale Stripe customer ${stripeCustomerId}, clearing and retrying with email`);
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { stripeCustomerId: null },
            });
          } catch { /* non-blocking */ }
          session = await stripe.checkout.sessions.create({
            ...checkoutParams,
            customer_email: user.email,
          });
        } else {
          throw err;
        }
      }
    } else {
      session = await stripe.checkout.sessions.create({
        ...checkoutParams,
        customer_email: user.email,
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const stripeErr = error as { message?: string; code?: string; type?: string };
    console.error("Stripe checkout error:", stripeErr.message, stripeErr.code, stripeErr.type);
    return NextResponse.json(
      { error: stripeErr.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
