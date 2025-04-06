import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VoiceSettings = {
  selectedVoice: string;
};

type VoiceStore = {
  voiceSettings: VoiceSettings;
  setVoiceSettings: (settings: Partial<VoiceSettings>) => void;
};

export const useVoiceStore = create<VoiceStore>()(
  persist(
    (set) => ({
      voiceSettings: {
        selectedVoice: 'Microsoft Steffan',
      },
      setVoiceSettings: (settings) =>
        set((state) => ({
          voiceSettings: {
            ...state.voiceSettings,
            ...settings,
          },
        })),
    }),
    {
      name: 'voice-settings',
    },
  ),
);
