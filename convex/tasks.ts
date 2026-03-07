import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
  },
});

export const listDependenciesBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("taskDependencies")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
  },
});

export const seedFromGoal = mutation({
  args: {
    sessionId: v.id("sessions"),
    nodes: v.array(
      v.object({
        taskKey: v.string(),
        label: v.string(),
        description: v.optional(v.string()),
        priority: v.number(),
        estimatedHours: v.optional(v.number()),
      })
    ),
    edges: v.array(
      v.object({
        fromTaskKey: v.string(),
        toTaskKey: v.string(),
      })
    ),
  },
  handler: async (ctx, { sessionId, nodes, edges }) => {
    const now = Date.now();

    for (const node of nodes) {
      await ctx.db.insert("tasks", {
        sessionId,
        taskKey: node.taskKey,
        label: node.label,
        description: node.description,
        status: "pending",
        priority: node.priority,
        estimatedHours: node.estimatedHours,
        updatedAt: now,
      });
    }

    for (const edge of edges) {
      await ctx.db.insert("taskDependencies", {
        sessionId,
        fromTaskKey: edge.fromTaskKey,
        toTaskKey: edge.toTaskKey,
      });
    }
  },
});

export const updateStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.union(
      v.literal("pending"),
      v.literal("ready"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, { taskId, status }) => {
    await ctx.db.patch(taskId, { status, updatedAt: Date.now() });
  },
});
