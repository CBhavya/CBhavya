import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = "demo-user";
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const workspaces = await Promise.all(
      memberships.map(async (m) => {
        const ws = await ctx.db.get(m.workspaceId);
        if (!ws) return null;
        return {
          workspaceId: m.workspaceId,
          name: ws.name,
          role: m.role,
        };
      })
    );

    return workspaces.filter(Boolean);
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = "demo-user";
    const now = Date.now();

    const workspaceId = await ctx.db.insert("workspaces", {
      name: name.trim(),
      createdBy: userId,
      createdAt: now,
      status: "active",
    });

    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      userId,
      role: "owner",
      joinedAt: now,
    });

    return workspaceId;
  },
});
