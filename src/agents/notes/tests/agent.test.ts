// @ts-nocheck
// Unit tests for the NotesAgent
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notesAgent } from '../agent';

// Mock the global fetch function
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('NotesAgent', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockFetch.mockReset();
  });

  it('should call the list API and return notes for the "list" action', async () => {
    const mockNotes = [
      { id: '1', title: 'Note 1', content: 'Content 1', createdAt: Date.now() },
      { id: '2', title: 'Note 2', content: 'Content 2', createdAt: Date.now() },
    ];

    // Setup mock fetch response for GET /api/notes
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockNotes,
    });

    const result = await notesAgent.execute({ action: 'list' });

    // Assert fetch was called correctly
    expect(mockFetch).toHaveBeenCalledWith('/api/notes', {
      method: 'GET',
      // No headers or body needed for GET
    });

    // Assert the result matches the mock data
    expect(result).toEqual(mockNotes);
  });

  it('should call the create API and return the new note ID for the "create" action', async () => {
    const input = {
      action: 'create' as const, // Use 'as const' for literal type
      title: 'New Note Title',
      content: 'New Note Content',
    };
    const mockResponse = {
      // Full note object matching NotesCreateOutput
      id: 'new-note-id-123',
      title: input.title,
      content: input.content,
      createdAt: Date.now(), // Add a timestamp
    };

    // Setup mock fetch response for POST /api/notes
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse, // Return the ID object
    });

    const result = await notesAgent.execute(input);

    // Assert fetch was called correctly
    expect(mockFetch).toHaveBeenCalledWith('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: input.title, content: input.content }),
    });

    // Assert the result matches the mock response
    // The agent currently returns the raw JSON response, let's adjust agent or test
    // For now, assuming the agent *should* return the parsed ID object
    expect(result).toEqual(mockResponse);
  });

  it('should throw an error if fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network Error'));

    await expect(notesAgent.execute({ action: 'list' })).rejects.toThrow(
      'Network Error',
    );
  });
});
