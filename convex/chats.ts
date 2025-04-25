import { query, mutation } from './_generated/server';
import { v } from 'convex/values'; // Import v
import { v4 as uuidv4 } from 'uuid';

/**
 * Get a list of unique chat IDs from the messages table.
 * Note: This might become inefficient with a huge number of messages.
 * Consider a dedicated 'chats' table for metadata if performance degrades.
 */
export const listUniqueChats = query({
  handler: async (ctx) => {
    const allMessages = await ctx.db.query('messages').collect();
    // Use a Set to efficiently find unique chatIds, then convert to array
    const uniqueChatIds = Array.from(
      new Set(allMessages.map((msg) => msg.chatId)),
    );

    // Optionally, fetch the first message or creation time for sorting/display
    const chatList = await Promise.all(
      uniqueChatIds.map(async (chatId) => {
        const firstMessage = await ctx.db
          .query('messages')
          .withIndex('by_chatId', (q) => q.eq('chatId', chatId))
          .order('asc')
          .first();
        return {
          id: chatId,
          title: firstMessage?.content.substring(0, 50) || 'New Chat', // Truncated first message as title
          createdAt: firstMessage?._creationTime || 0, // Use creation time for sorting
        };
      }),
    );

    // Sort chats by creation time, newest first
    chatList.sort((a, b) => b.createdAt - a.createdAt);

    return chatList;
  },
});

/**
 * Placeholder mutation to generate a new chat ID.
 * Does not create a persistent chat record yet.
 */
export const create = mutation({
  // No args needed for just generating an ID
  handler: async () => {
    // Generate a new UUID
    const newChatId = uuidv4();
    console.log(`[Convex Mutation] Generated new chat ID: ${newChatId}`);
    return newChatId; // Return the generated ID
  },
});
