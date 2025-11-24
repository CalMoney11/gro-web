import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all products
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("products").collect();
  },
});

// Get single product by ID
export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Add a product (for your admin panel later)
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.number(),
    image: v.string(),
    inventory: v.number(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const productId = await ctx.db.insert("products", {
      name: args.name,
      description: args.description,
      price: args.price,
      image: args.image,
      inventory: args.inventory,
      category: args.category,
    });
    return productId;
  },
});

// Update inventory
export const updateInventory = mutation({
  args: {
    id: v.id("products"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      inventory: args.quantity,
    });
  },
});