export function getSelectedModel(): string {
  if (typeof window !== 'undefined') {
    const storedModel = localStorage.getItem('selectedModel');
    // Default to OpenAI GPT-4o if no model selected
    return storedModel || 'openai:gpt-4o';
  } else {
    // Default model on server-side
    return 'openai:gpt-4o';
  }
}
