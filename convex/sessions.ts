import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByWorkspace = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    goalText: v.string(),
    initialRules: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { workspaceId, goalText }) => {
    const now = Date.now();
    return await ctx.db.insert("sessions", {
      workspaceId,
      goalText: goalText.trim(),
      status: "active",
      startedAt: now,
    });
  },
});
