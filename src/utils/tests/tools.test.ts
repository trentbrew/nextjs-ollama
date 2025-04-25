/// <reference types="vitest" />
import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { executeSearchWeb } from '../tools';

let originalApiKey: string | undefined;

describe('executeSearchWeb', () => {
  beforeEach(() => {
    // Save and set API key
    originalApiKey = process.env.PERPLEXITY_API_KEY;
    process.env.PERPLEXITY_API_KEY = 'test-key';
    // Mock fetch
    global.fetch = vi.fn();
  });

  afterAll(() => {
    // Restore API key
    process.env.PERPLEXITY_API_KEY = originalApiKey;
  });

  function createFetchResponse(
    data: any,
    ok = true,
    status = 200,
    statusText = 'OK',
  ) {
    return {
      ok,
      status,
      statusText,
      json: async () => data,
      text: async () => JSON.stringify(data),
    };
  }

  it('calls Perplexity API and returns cleaned content and sources', async () => {
    const query = 'hello world';
    const rawContent = 'line1\n\n\nline2';
    const citations = ['https://example.com'];
    (global.fetch as any).mockResolvedValue(
      createFetchResponse({
        choices: [{ message: { content: rawContent } }],
        citations,
      }),
    );

    const result = await executeSearchWeb({ query });

    expect(global.fetch).toHaveBeenCalledOnce();
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.perplexity.ai/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
        body: expect.stringContaining(query),
      }),
    );

    expect(result.searchResult).toBe('line1\n\nline2');
    expect(result.sources).toEqual(citations);
  });

  it('throws if API key is missing', async () => {
    // Remove API key
    process.env.PERPLEXITY_API_KEY = '';
    await expect(executeSearchWeb({ query: 'test' })).rejects.toThrow(
      'Missing PERPLEXITY_API_KEY',
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('throws on non-OK HTTP response', async () => {
    (global.fetch as any).mockResolvedValue(
      createFetchResponse({}, false, 500, 'Error'),
    );

    await expect(executeSearchWeb({ query: 'test' })).rejects.toThrow(
      /Perplexity API request failed: 500 Error/,
    );
    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it('bubbles up network errors', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network Error'));

    await expect(executeSearchWeb({ query: 'test' })).rejects.toThrow(
      'Network Error',
    );
  });

  it('returns placeholder when content missing', async () => {
    (global.fetch as any).mockResolvedValue(
      createFetchResponse({ choices: [{ message: {} }], citations: ['a'] }),
    );

    const result = await executeSearchWeb({ query: 'test' });
    expect(result.searchResult).toBe('No meaningful result found.');
    expect(result.sources).toEqual([]);
  });

  it('defaults to empty sources when citations missing', async () => {
    (global.fetch as any).mockResolvedValue(
      createFetchResponse({ choices: [{ message: { content: 'C' } }] }),
    );

    const result = await executeSearchWeb({ query: 'test' });
    expect(result.searchResult).toBe('C');
    expect(result.sources).toEqual([]);
  });
});
