import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  products: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    image: v.string(),
    inventory: v.number(),
    category: v.optional(v.string()),
  }),
  
  orders: defineTable({
    email: v.string(),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      price: v.number(),
    })),
    total: v.number(),
    status: v.string(), // "pending", "paid", "shipped", "completed"
    stripeSessionId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
});