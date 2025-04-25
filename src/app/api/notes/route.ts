// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { ConvexClient } from 'convex/browser'; // Use browser client even server-side for actions

// Initialize Convex client (requires NEXT_PUBLIC_CONVEX_URL env var)
const client = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    console.log('[API /api/notes GET] Attempting to list notes via action...');
    // Call the listNotesAction
    const notes = await client.action('notesActions:listNotesAction', {});
    console.log('[API /api/notes GET] Notes listed successfully via action.');
    return NextResponse.json(notes);
  } catch (error: any) {
    console.error('[API /api/notes GET] Caught error calling action:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes', details: error.message },
      { status: 500 },
    );
  }
  // --- REMOVE TEMPORARY TEST ---
  // console.log('[API /api/notes GET] Returning hardcoded list response for testing.');
  // return NextResponse.json([
  //   { id: 'test-1', title: 'Hardcoded Note 1', content: 'Content 1', createdAt: Date.now() },
  // ]);
}

export async function POST(req: NextRequest) {
  try {
    console.log('[API /api/notes POST] Request received to call action.');
    const body = await req.json();
    const { title, content } = body;
    console.log(
      `[API /api/notes POST] Parsed body: title=${title}, content=${content}`,
    );

    if (!title || !content) {
      console.error('[API /api/notes POST] Missing title or content.');
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 },
      );
    }
    console.log(
      '[API /api/notes POST] Attempting to create note via action...',
    );
    // Call the createNoteAction
    const id = await client.action('notesActions:createNoteAction', {
      title,
      content,
    });
    console.log(
      `[API /api/notes POST] Note created successfully via action with ID: ${id}`,
    );
    return NextResponse.json({ id });
  } catch (error: any) {
    console.error('[API /api/notes POST] Caught error calling action:', error);
    return NextResponse.json(
      { error: 'Failed to create note', details: error.message },
      { status: 500 },
    );
  }
  // --- REMOVE TEMPORARY TEST ---
  // console.log('[API /api/notes POST] Returning hardcoded create response for testing.');
  // return NextResponse.json({ id: 'hardcoded-new-id' });
}
