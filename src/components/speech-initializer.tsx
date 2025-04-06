'use client';

import { useEffect } from 'react';
import { initializeSpeechHandlers } from '@/utils/speech-initializer';

/**
 * Component that initializes speech-related functionality
 * Should be mounted once at the app level
 */
export default function SpeechInitializer() {
  useEffect(() => {
    // Initialize speech handlers on mount
    initializeSpeechHandlers();
  }, []);

  // This is a utility component, it doesn't render anything
  return null;
}
