import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Speaker } from 'lucide-react';
import { useVoiceStore } from '../utils/voice-store';
import { getAvailableVoices } from '../utils/text-to-speech';

export function VoiceSelector() {
  const { voiceSettings, setVoiceSettings } = useVoiceStore();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = async () => {
      try {
        const availableVoices = await getAvailableVoices();
        // Filter for English voices only
        const englishVoices = availableVoices.filter((voice) =>
          voice.lang.startsWith('en'),
        );
        setVoices(englishVoices);
      } catch (error) {
        console.error('Failed to load voices:', error);
      }
    };

    loadVoices();
  }, []);

  const handleVoiceChange = (value: string) => {
    setVoiceSettings({ selectedVoice: value });
  };

  // If no voices are available, don't render the component
  if (voices.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Speaker className="h-4 w-4 text-muted-foreground" />
      <Select
        value={voiceSettings.selectedVoice}
        onValueChange={handleVoiceChange}
      >
        <SelectTrigger className="h-8 w-[180px]">
          <SelectValue placeholder="Select voice" />
        </SelectTrigger>
        <SelectContent>
          {voices.map((voice) => (
            <SelectItem key={voice.name} value={voice.name}>
              {voice.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
