// @ts-nocheck
import { z } from 'zod';
import { Agent } from '@/agents/types';
import { agentRegistry } from '@/lib/agentRegistry';

// Define the discriminated input schema: list or create
const NotesInputSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }),
  z.object({
    action: z.literal('create'),
    title: z.string().optional(),
    content: z.string(),
  }),
]);
export type NotesAgentInput = z.infer<typeof NotesInputSchema>;

// Note object schema
const NoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.number(),
});

// Output schema: either an array of notes (list - for internal parsing) or a success message string (create or formatted list)
const NotesListOutputSchema = z.array(NoteSchema); // Schema for the raw data from API
const FormattedOutputSchema = z.string(); // Final output to user is a string
export type NotesAgentOutput = string; // Agent always returns a string now

// Create the NotesAgent
const notesAgent: Agent<NotesAgentInput, NotesAgentOutput> = {
  name: 'notes',
  description: 'List existing notes or create a new note in the user journal.',
  inputSchema: NotesInputSchema,
  outputSchema: FormattedOutputSchema, // Agent's final output is always a string

  async execute(input) {
    const apiUrl = `${
      process.env.BASE_URL || 'http://localhost:4321'
    }/api/notes`;

    if (input.action === 'list') {
      const res = await fetch(apiUrl, {
        method: 'GET',
      });
      const data = await res.json();
      // Validate the raw data from the API
      const notes = NotesListOutputSchema.parse(data);

      if (notes.length === 0) {
        return "You don't have any notes yet.";
      }

      // Format the notes into a readable string
      const formattedNotes = notes
        .map(
          (note) =>
            `📝 **${note.title}** (Created: ${new Date(
              note.createdAt,
            ).toLocaleDateString()})\n${note.content}`,
        )
        .join('\n\n---\n\n'); // Separate notes

      return `Here are your notes:\n\n${formattedNotes}`;
    } else {
      // Generate default title if missing
      const title = input.title || input.content.substring(0, 50); // Use first 50 chars of content as fallback

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title, content: input.content }),
      });
      const data = await res.json(); // API returns { id: ... }

      // Check if the API call was successful (we expect an ID back)
      if (data && data.id) {
        return `✅ Note titled "${title}" created successfully.`;
      } else {
        // Handle case where API might not return an ID or indicates failure
        console.error(
          '[NotesAgent] Failed to create note, API response:',
          data,
        );
        throw new Error(
          'Failed to create note. API did not return expected ID.',
        );
      }
    }
  },
};

// Register the agent
agentRegistry.register(notesAgent);
export { notesAgent };
