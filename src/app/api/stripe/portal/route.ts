import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Look up existing Stripe customer
    let dbUser;
    try {
      dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { stripeCustomerId: true, subscriptionId: true },
      });
    } catch {
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    let customerId = dbUser?.stripeCustomerId;

    // If no Stripe customer, try to find by email or create one
    if (!customerId) {
      const existing = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const newCustomer = await stripe.customers.create({
          email: user.email!,
          metadata: { userId: user.id },
        });
        customerId = newCustomer.id;
      }

      // Save to DB
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: customerId },
        });
      } catch {
        // Non-blocking
      }
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
