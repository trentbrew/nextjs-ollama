import { NextRequest, NextResponse } from 'next/server';
import { getEmbedding } from '@/lib/embeddings';

export async function POST(req: NextRequest) {
  const { text, embeddingModel } = await req.json();
  try {
    const embedding = await getEmbedding(text, embeddingModel);
    return NextResponse.json({ embedding });
  } catch (err: any) {
    console.error('[API] Embedding generation error:', err);
    return NextResponse.json(
      { error: err.message || 'Error generating embedding' },
      { status: 500 },
    );
  }
}
