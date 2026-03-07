import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const taskStatus = v.union(
  v.literal("pending"),
  v.literal("ready"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("failed")
);

const sessionStatus = v.union(
  v.literal("active"),
  v.literal("paused"),
  v.literal("completed"),
  v.literal("failed")
);

export default defineSchema({
  workspaces: defineTable({
    name: v.string(),
    createdBy: v.string(),
    createdAt: v.number(),
    status: v.union(v.literal("active"), v.literal("archived")),
  })
    .index("by_createdBy", ["createdBy"])
    .index("by_status", ["status"]),

  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.string(),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("member"),
      v.literal("viewer")
    ),
    joinedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_workspace_and_user", ["workspaceId", "userId"]),

  sessions: defineTable({
    workspaceId: v.id("workspaces"),
    goalText: v.string(),
    status: sessionStatus,
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_and_status", ["workspaceId", "status"]),

  tasks: defineTable({
    sessionId: v.id("sessions"),
    taskKey: v.string(),
    label: v.string(),
    description: v.optional(v.string()),
    status: taskStatus,
    assigneeUserId: v.optional(v.string()),
    estimatedHours: v.optional(v.number()),
    priority: v.number(),
    updatedAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_and_status", ["sessionId", "status"])
    .index("by_session_and_key", ["sessionId", "taskKey"]),

  taskDependencies: defineTable({
    sessionId: v.id("sessions"),
    fromTaskKey: v.string(),
    toTaskKey: v.string(),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_and_from", ["sessionId", "fromTaskKey"]),
});
