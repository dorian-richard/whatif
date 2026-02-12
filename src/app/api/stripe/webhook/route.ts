import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { PrismaClient } from "@prisma/client";
import type Stripe from "stripe";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId && session.customer && session.subscription) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId: session.customer as string,
            subscriptionId: session.subscription as string,
            subscriptionStatus: "ACTIVE",
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const user = await prisma.user.findUnique({
        where: { stripeCustomerId: subscription.customer as string },
      });
      if (user) {
        const status =
          subscription.status === "active"
            ? "ACTIVE"
            : subscription.status === "past_due"
              ? "PAST_DUE"
              : "CANCELED";
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: status },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const user = await prisma.user.findUnique({
        where: { stripeCustomerId: subscription.customer as string },
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: "FREE",
            subscriptionId: null,
          },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.customer) {
        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: invoice.customer as string },
        });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: "PAST_DUE" },
          });
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
