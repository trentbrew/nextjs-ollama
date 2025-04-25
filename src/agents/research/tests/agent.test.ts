/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResearchAgent, researchAgentInputSchema } from '../agent';
import type { ResearchAgentInput, ResearchAgentOutput } from '../agent';
import * as tools from '@/utils/tools';

describe('ResearchAgent', () => {
  const spyExecuteSearchWeb = vi.spyOn(tools, 'executeSearchWeb');

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('executes the search tool and returns its output', async () => {
    const input: ResearchAgentInput = { query: 'test search' };
    const fakeOutput: ResearchAgentOutput = {
      searchResult: 'result text',
      sources: ['url'],
    };
    spyExecuteSearchWeb.mockResolvedValue(fakeOutput);

    // Validate input schema works
    const parsed = researchAgentInputSchema.safeParse(input);
    expect(parsed.success).toBe(true);

    const result = await ResearchAgent.execute(input);
    expect(spyExecuteSearchWeb).toHaveBeenCalledWith(input);
    expect(result).toBe(fakeOutput);
  });

  it('propagates errors from the search tool', async () => {
    const input: ResearchAgentInput = { query: 'error search' };
    const error = new Error('search failed');
    spyExecuteSearchWeb.mockRejectedValue(error);

    await expect(ResearchAgent.execute(input)).rejects.toThrow('search failed');
  });
});
