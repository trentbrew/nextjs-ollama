// @ts-nocheck
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CaretSortIcon } from '@radix-ui/react-icons';
import useChatStore, { ChatStore } from '@/app/hooks/useChatStore';
import { VoiceSelector } from '@/components/voice-selector';

export function SettingsForm() {
  // State and setters from Zustand store
  const selectedModel = useChatStore((state: ChatStore) => state.selectedModel);
  const setSelectedModel = useChatStore(
    (state: ChatStore) => state.setSelectedModel,
  );
  const embeddingModel = useChatStore(
    (state: ChatStore) => state.embeddingModel,
  );
  const setEmbeddingModel = useChatStore(
    (state: ChatStore) => state.setEmbeddingModel,
  );

  // Local state for dropdowns and model list
  const [models, setModels] = useState<string[]>([]);
  const [openModel, setOpenModel] = useState(false);
  const [openEmbedding, setOpenEmbedding] = useState(false);
  const embeddingModels = [
    'openai:text-embedding-3-small',
    'mxbai:embed-large:latest',
  ];

  // Fetch available LLM models
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/tags');
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const data = await res.json().catch(() => null);
        if (data?.models?.length) {
          setModels(data.models.map(({ name }: { name: string }) => name));
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    })();
  }, []);

  // Handlers for selection changes
  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setOpenModel(false);
  };

  const handleEmbeddingChange = (model: string) => {
    setEmbeddingModel(model);
    setOpenEmbedding(false);
  };

  return (
    <div className="space-y-6 max-w-md">
      {/* LLM Model Selector */}
      <div>
        <label className="block text-sm font-medium mb-1">Chat Model</label>
        <Popover open={openModel} onOpenChange={setOpenModel}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openModel}
              className="w-full justify-between"
            >
              {selectedModel || 'Select model'}
              <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-1">
            {models.length > 0 ? (
              models.map((model) => (
                <Button
                  key={model}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleModelChange(model)}
                >
                  {model}
                </Button>
              ))
            ) : (
              <Button variant="ghost" disabled className="w-full justify-start">
                No models available
              </Button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Embedding Model Selector */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Embedding Model
        </label>
        <Popover open={openEmbedding} onOpenChange={setOpenEmbedding}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openEmbedding}
              className="w-full justify-between"
            >
              {embeddingModel || 'Select embeddings'}
              <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-1">
            {embeddingModels.map((model) => (
              <Button
                key={model}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleEmbeddingChange(model)}
              >
                {model}
              </Button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {/* Voice Selector */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Text-to-Speech Voice
        </label>
        <VoiceSelector />
      </div>

      {/* Add other settings toggles/inputs here as needed */}
    </div>
  );
}
