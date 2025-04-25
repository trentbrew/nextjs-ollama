import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  messages: defineTable({
    // Define fields for your messages table
    // Use Vercel AI SDK CoreMessage shape + potentially sources, agent info etc.
    role: v.union(
      v.literal('user'),
      v.literal('assistant'),
      v.literal('system'),
      v.literal('function'),
      v.literal('tool'),
    ),
    content: v.string(),
    // Optional fields
    name: v.optional(v.string()), // For function/tool calls
    tool_call_id: v.optional(v.string()),
    tool_calls: v.optional(v.any()), // Store complex tool call structures
    // Add custom fields if needed
    chatId: v.string(), // To group messages by conversation
    sources: v.optional(v.array(v.string())), // For research agent results
    agentName: v.optional(v.string()), // Track which agent generated the message
    embedding: v.optional(v.array(v.number())), // Store embeddings for RAG
  }).index('by_chatId', ['chatId']), // Index for efficient querying by chat
  // New table for storing user notes
  notes: defineTable({
    title: v.string(),
    content: v.string(),
    createdAt: v.number(),
  }),
});
