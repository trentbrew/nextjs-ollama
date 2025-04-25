import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

/**
 * Get messages for a specific chat session, ordered by creation time.
 */
export const listByChat = query({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    // Retrieve messages associated with the given chatId, ordered by creation time
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_chatId', (q) => q.eq('chatId', args.chatId))
      .order('asc') // Fetch in creation order
      .collect();
    return messages;
  },
});

/**
 * Add a new message to a chat session.
 */
export const add = mutation({
  // Accept arguments matching the fields in the messages table schema
  args: {
    chatId: v.string(),
    role: v.union(
      v.literal('user'),
      v.literal('assistant'),
      v.literal('system'),
      v.literal('function'),
      v.literal('tool'),
    ),
    content: v.string(),
    name: v.optional(v.string()),
    tool_call_id: v.optional(v.string()),
    tool_calls: v.optional(v.any()),
    sources: v.optional(v.array(v.string())),
    agentName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Insert the new message into the database
    await ctx.db.insert('messages', {
      chatId: args.chatId,
      role: args.role,
      content: args.content,
      name: args.name,
      tool_call_id: args.tool_call_id,
      tool_calls: args.tool_calls,
      sources: args.sources,
      agentName: args.agentName,
      // Convex automatically adds _creationTime and _id
    });
  },
});
