import { stopSpeech } from './text-to-speech';

/**
 * Initialize global speech synthesis event handlers
 * This should be called early in the application lifecycle
 */
export function initializeSpeechHandlers(): void {
  // Only run on client side
  if (typeof window === 'undefined') return;

  // Set initial state
  window.currentUtterance = null;
  window.speechUnloadListenerAdded = false;

  // Stop any existing speech when page is loaded/refreshed
  stopSpeech();

  // Add beforeunload listener to stop speech
  window.addEventListener('beforeunload', () => {
    stopSpeech();
  });

  // Add visibility change listener to pause speech when page is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      stopSpeech();
    }
  });

  // Mark that the listener has been added
  window.speechUnloadListenerAdded = true;
}
