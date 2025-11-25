import { v } from "convex/values";
import { action } from "./_generated/server";
import Stripe from "stripe";

// Helper function to get Stripe instance
function getStripe() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(apiKey, {
    apiVersion: "2024-11-20.acacia",
  });
}

// Create a checkout session
export const createCheckoutSession = action({
  args: {
    items: v.array(
      v.object({
        productId: v.id("products"),
        name: v.string(),
        price: v.number(),
        quantity: v.number(),
        image: v.string(),
      })
    ),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const stripe = getStripe();

    // Calculate total
    const total = args.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create line items for Stripe
    const lineItems = args.items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: [item.image],
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/cart`,
      customer_email: args.email,
      metadata: {
        items: JSON.stringify(
          args.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          }))
        ),
      },
    });

    return { sessionId: session.id, url: session.url };
  },
});

// Verify a payment session (call this on success page)
export const verifySession = action({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(args.sessionId);

    if (session.payment_status === "paid") {
      // Parse items from metadata
      const items = JSON.parse(session.metadata?.items || "[]");

      // Create order in database
      const orderId = await ctx.runMutation(
        ctx.db.insert("orders", {
          email: session.customer_email || session.customer_details?.email || "",
          items: items,
          total: session.amount_total ? session.amount_total / 100 : 0,
          status: "paid",
          stripeSessionId: session.id,
          createdAt: Date.now(),
        })
      );

      // Update inventory for each item
      for (const item of items) {
        const product = await ctx.runQuery(ctx.db.get(item.productId));
        if (product) {
          await ctx.runMutation(
            ctx.db.patch(item.productId, {
              inventory: product.inventory - item.quantity,
            })
          );
        }
      }

      return {
        success: true,
        orderId,
        email: session.customer_email || session.customer_details?.email,
      };
    }

    return { success: false };
  },
});

// Webhook handler for Stripe events (for production)
export const handleWebhook = action({
  args: {
    payload: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, args) => {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("Missing STRIPE_WEBHOOK_SECRET");
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        args.payload,
        args.signature,
        webhookSecret
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      throw new Error("Invalid signature");
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;

        // Parse items from metadata
        const items = JSON.parse(session.metadata?.items || "[]");

        // Create order
        await ctx.runMutation(
          ctx.db.insert("orders", {
            email: session.customer_email || session.customer_details?.email || "",
            items: items,
            total: session.amount_total ? session.amount_total / 100 : 0,
            status: "paid",
            stripeSessionId: session.id,
            createdAt: Date.now(),
          })
        );

        // Update inventory
        for (const item of items) {
          const product = await ctx.runQuery(ctx.db.get(item.productId));
          if (product) {
            await ctx.runMutation(
              ctx.db.patch(item.productId, {
                inventory: product.inventory - item.quantity,
              })
            );
          }
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  },
});