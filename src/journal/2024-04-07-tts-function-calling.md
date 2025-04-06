# Development Journal: Text-to-Speech and Function Calling

**Date:** April 7, 2024
**Author:** Claude & Trent

## Features Implemented

### 1. Text-to-Speech with Browser Speech Synthesis API

We implemented text-to-speech functionality using the browser's native Speech Synthesis API. This approach has several advantages:

- No need for external services or API keys
- Works across browsers without additional dependencies
- Leverages system voices already available on the user's device

Key components:

- **Speech Utility (`src/utils/text-to-speech.ts`)**: Handles speech playback, pause, resume, and stop functions
- **Voice Store (`src/utils/voice-store.ts`)**: Persists user voice preferences using Zustand
- **Voice Selector Component**: Dropdown UI for selecting different voices
- **Speech Initializer**: Handles global speech state and cleanup on page changes

### 2. Function Calling with Ollama Models

We added function/tool calling capabilities to enable the LLM to use external tools. The implementation uses Vercel AI SDK's experimental function calling features.

Key components:

- **Function Definitions (`src/utils/function-calling.ts`)**: Central registry of available functions
- **Function Handler**: Implements the actual function logic for each registered function
- **Function Call Result Component**: Displays results from function calls with specialized UI
- **API Integration**: Enhanced the chat endpoint to conditionally enable function calling for compatible models

## Technical Learnings

### Text-to-Speech Implementation

1. **Speech Synthesis Lifecycle Management**

   - Needed to properly handle speech cancellation on page changes
   - Speech state can persist across page refreshes if not properly cleaned up
   - Using UI state (isSpeaking, isPaused) to coordinate with actual speech state

2. **Voice Selection**

   - System voices vary widely between platforms and browsers
   - Need fallback options when specific voices aren't available
   - "Microsoft Steffan" set as the default but falls back to any available English voice

3. **UI Considerations**
   - Added visual indicators for speech state (animated icon during playback)
   - Speech controls need to account for three states: not speaking, speaking, paused
   - Stop button needs to be distinct from pause functionality

### Function Calling

1. **Model Compatibility**

   - Not all models support function calling
   - Created a utility to check if a model likely supports function calling based on its name
   - Added conditional logic to only enable functions for compatible models

2. **Type Safety**

   - Needed to extend the Message type to include function_call and function_call_result properties
   - Created custom types for function definitions and calls
   - Implemented proper casting between standard Message and ExtendedMessage types

3. **Result Handling**
   - Specialized UI for different function outputs (weather, search, etc.)
   - JSON parsing for structured display of results
   - Card-based layout for visual distinction of function outputs

## Known Issues and Limitations

1. **Text-to-Speech**

   - Voice availability varies by platform and browser
   - No perfect way to ensure "Microsoft Steffan" is available on all systems
   - Mobile browsers have inconsistent support for speech controls

2. **Function Calling**
   - Limited to models that support function calling
   - Current function implementations are mocks (weather and search return fixed data)
   - Vercel AI SDK's function calling support is experimental and may change

## Future Improvements

### Text-to-Speech

- [ ] Add rate/speed control for speech playback
- [ ] Support for multiple languages
- [ ] Split long responses into manageable chunks for better speech flow
- [ ] Save speech preferences by model (some voices may work better with certain responses)

### Function Calling

- [ ] Implement real API integrations for weather, search, etc.
- [ ] Add more specialized functions (calendar, documents, coding tools)
- [ ] Support for file operations and persistence
- [ ] Create a visual indicator when the model is "thinking" about using a function

### General

- [ ] Add comprehensive error handling for both features
- [ ] Implement analytics to track feature usage
- [ ] Create configuration panel for advanced settings
- [ ] Add keyboard shortcuts for common actions

## Technical Debt and Architecture Notes

1. The function calling implementation extends the Message type which may break if the AI SDK changes
2. The speech handling relies on browser-specific behavior which may vary
3. We need a more robust type system for function calls and results
4. Card UI components could be refactored to be more reusable

## Resources

- [Web Speech API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Vercel AI SDK Function Calling](https://sdk.vercel.ai/docs/concepts/function-calling)
- [Ollama API Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
