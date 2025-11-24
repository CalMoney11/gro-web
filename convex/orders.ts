import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Create an order
export const create = mutation({
  args: {
    email: v.string(),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      price: v.number(),
    })),
    total: v.number(),
    stripeSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orderId = await ctx.db.insert("orders", {
      email: args.email,
      items: args.items,
      total: args.total,
      status: "pending",
      stripeSessionId: args.stripeSessionId,
      createdAt: Date.now(),
    });
    return orderId;
  },
});

// Get all orders (for admin)
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("orders").order("desc").collect();
  },
});

// Get orders by email (for customer)
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
  },
});

// Update order status
export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
    });
  },
});