import { z } from 'zod';
import { Agent } from '@/agents/types';
import { agentRegistry } from '@/lib/agentRegistry';

// Schema for FS list action
const FsListSchema = z.object({
  action: z.literal('list'),
  path: z.string(),
});

// Output schema: array of file entries
const FsListOutputSchema = z.array(
  z.object({ name: z.string(), isFile: z.boolean(), isDirectory: z.boolean() }),
);

type FsListInput = z.input<typeof FsListSchema>;
type FsListOutput = z.output<typeof FsListOutputSchema>;

/**
 * Filesystem agent: supports listing directory contents via internal API.
 */
const filesystemAgent: Agent<FsListInput, FsListOutput> = {
  name: 'filesystem',
  description: 'Explore the server file system by listing directory contents.',
  inputSchema: FsListSchema,
  outputSchema: FsListOutputSchema,
  async execute({ action, path: dirPath }: FsListInput): Promise<FsListOutput> {
    if (action === 'list') {
      // Call the internal API route to list directory (absolute URL)
      const baseUrl =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const url = `${baseUrl}/api/fs/list`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dir: dirPath }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `FS list failed: ${res.status}`);
      }
      const data = await res.json();
      return data.entries;
    }
    throw new Error(`Unsupported action: ${action}`);
  },
};

// Register this agent
agentRegistry.register(filesystemAgent);

export { filesystemAgent };
