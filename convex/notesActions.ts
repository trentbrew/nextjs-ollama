import { action } from './_generated/server';
import { api } from './_generated/api';
import { v } from 'convex/values';

// Action to create a note (calls the mutation)
export const createNoteAction = action({
  args: {
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Call the existing create mutation
    const noteId = await ctx.runMutation(api.notes.create, {
      title: args.title,
      content: args.content,
    });
    return noteId;
  },
});

// Action to list notes (calls the query)
export const listNotesAction = action({
  args: {},
  handler: async (ctx) => {
    // Call the existing list query
    const notes = await ctx.runQuery(api.notes.list);
    return notes;
  },
});
