// Tiny event bus so any component (sidebar, suggestion bubbles) can open the
// floating AI assistant panel without prop-drilling its open state everywhere.

const OPEN_EVENT = "pip:open-ai";

export function openAIAssistant(prompt?: string) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { prompt } }));
}

export function onOpenAIAssistant(handler: (prompt?: string) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<{ prompt?: string }>).detail?.prompt);
  window.addEventListener(OPEN_EVENT, listener);
  return () => window.removeEventListener(OPEN_EVENT, listener);
}
