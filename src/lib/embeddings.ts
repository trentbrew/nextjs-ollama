import OpenAI from 'openai';

// Initialize OpenAI client using environment variable
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate embedding vector for given text using specified model.
 * Supports 'openai:<model>' or 'mxbai:<model>' prefixes.
 */
export async function getEmbedding(
  text: string,
  providerModel: string = 'openai:text-embedding-3-small',
): Promise<number[]> {
  const [provider, model] = providerModel.split(':');
  if (provider === 'openai') {
    const response = await openai.embeddings.create({
      model: model,
      input: text,
    });
    return response.data[0].embedding;
  } else if (provider === 'mxbai') {
    // Stub: call local embedding service
    const res = await fetch(`http://localhost:11434/embed?model=${model}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      throw new Error(`Local embedder error: ${res.status}`);
    }
    const data = await res.json();
    return data.embedding;
  } else {
    throw new Error(`Unknown embedding provider: ${provider}`);
  }
}

/**
 * Compute cosine similarity between two vectors.
 */
export function cosine(a: number[], b: number[]): number {
  const dot = a.reduce((sum, x, i) => sum + x * (b[i] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((sum, x) => sum + x * x, 0));
  const magB = Math.sqrt(b.reduce((sum, y) => sum + y * y, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}
