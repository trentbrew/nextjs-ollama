// Utility function for text-to-speech using browser's Speech Synthesis API
export async function speakText(
  text: string,
  voiceName: string = 'Daniel',
): Promise<void> {
  try {
    // Use the Web Speech API
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech synthesis not supported in this browser');
    }

    // Cancel any ongoing speech
    stopSpeech();

    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);

    // Wait for voices to load
    let voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      await new Promise<void>((resolve) => {
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          resolve();
        };
      });
    }

    // Try to find the requested voice
    const selectedVoice = voices.find((v) =>
      v.name.toLowerCase().includes(voiceName.toLowerCase()),
    );

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      // Fallback to any English voice
      const englishVoice = voices.find((voice) => voice.lang.startsWith('en'));
      if (englishVoice) utterance.voice = englishVoice;
    }

    // Set other properties
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Store the current utterance globally
    window.currentUtterance = utterance;

    // Create a promise that will resolve when speech ends or rejects on error
    const speechPromise = new Promise<void>((resolve, reject) => {
      utterance.onend = () => {
        window.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        window.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);
    });

    // Return the promise
    return speechPromise;
  } catch (error) {
    console.error('Text-to-speech error:', error);
    window.currentUtterance = null;
    throw error;
  }
}

// Pause current speech
export function pauseSpeech(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.pause();
  }
}

// Resume current speech
export function resumeSpeech(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.resume();
  }
}

// Stop all speech
export function stopSpeech(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    window.currentUtterance = null;
  }
}

// Function to get all available voices
export function getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices();

    if (voices.length) {
      resolve(voices);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        resolve(voices);
      };
    }
  });
}

// Add these types to extend the Window interface
declare global {
  interface Window {
    currentUtterance: SpeechSynthesisUtterance | null;
    speechUnloadListenerAdded: boolean;
  }
}
