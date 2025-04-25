import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// List all notes, sorted by creation time descending
export const list = query({
  handler: async (ctx) => {
    const notes = await ctx.db.query('notes').collect();
    notes.sort((a, b) => b.createdAt - a.createdAt);
    return notes.map((note) => ({
      id: note._id.toString(),
      title: note.title,
      content: note.content,
      createdAt: note.createdAt,
    }));
  },
});

// Create a new note
export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert('notes', {
      title: args.title,
      content: args.content,
      createdAt: now,
    });
    return id.toString();
  },
});
