export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  // Return a curated list of remote provider models for Google Gemini, OpenAI GPT-4o, and Anthropic Claude 3.5
  const models = [
    { name: 'google:gemini-2.0-flash-001' },
    { name: 'openai:gpt-4o' },
    { name: 'anthropic:claude-3-5-sonnet-20240620' },
  ];
  return new Response(JSON.stringify({ models }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
