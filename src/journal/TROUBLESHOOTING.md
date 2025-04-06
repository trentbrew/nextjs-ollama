# Troubleshooting Guide

This document provides solutions for common issues you might encounter when working with the Ollama UI application.

## Text-to-Speech Issues

### Speech Continues After Page Refresh

**Problem**: Speech continues playing even after refreshing the page.

**Solution**:

1. We've implemented handlers in `src/utils/speech-initializer.ts` that should stop speech on page refresh.
2. If the issue persists, check:
   - `beforeunload` event is properly attached
   - `stopSpeech` function is being called correctly
   - Browser may be caching audio state; try clearing browser cache

### No Voices Available or Default Voice Not Found

**Problem**: Voice selection dropdown is empty or Microsoft Steffan is not available.

**Solution**:

1. Browser may not have loaded voices yet. Try refreshing the page.
2. Different operating systems have different voice sets:
   - Windows: Check if "Microsoft Steffan" is installed
   - macOS: Try "Samantha" or "Alex" instead
   - Linux: May require additional voice packages
3. Modify `src/utils/voice-store.ts` to use a voice available on your system.

### Audio Icon Not Animating

**Problem**: The audio animation doesn't display during speech playback.

**Solution**:

1. Check if `audioIconRef.current` is being properly assigned in `chat-message.tsx`
2. Verify the animation logic in `icons/audio.tsx`
3. Ensure the animation functions are being called from speech handlers
4. Check browser console for errors related to the animation

## Function Calling Issues

### Function Calls Not Working with Certain Models

**Problem**: Function calling isn't working with a particular model.

**Solution**:

1. Not all models support function calling. Check the `modelSupportsFunctionCalling` function in `src/utils/function-calling.ts`
2. Add your model to the `supportedModels` array if it supports function calling
3. Ensure model is property configured on your Ollama instance
4. Check browser console for API errors

### Function Results Not Displaying

**Problem**: Function calls work but results aren't showing in the UI.

**Solution**:

1. Check that your message type is properly cast to `ExtendedMessage`
2. Verify `message.function_call` and `message.function_call_result` are present in the message object
3. Inspect network responses to ensure function results are being returned
4. Check for errors in the `FunctionCallResult` component

### TypeScript Errors with Function Calling

**Problem**: TypeScript compiler errors about undefined properties on Message type.

**Solution**:

1. We've created an `ExtendedMessage` interface in `src/utils/function-calling.ts`
2. Make sure you're importing and using this type where needed
3. Cast standard Message types to ExtendedMessage when necessary
4. Update type declarations if the Vercel AI SDK changes

## Environment and Setup Issues

### Ollama Connection Problems

**Problem**: Can't connect to Ollama or models aren't loading.

**Solution**:

1. Verify Ollama is running locally
2. Check that `OLLAMA_URL` and `NEXT_PUBLIC_OLLAMA_URL` in `.env` are correct
3. Default is `http://localhost:11434` - make sure port matches your setup
4. Test connection with `curl http://localhost:11434/api/tags`
5. Check for CORS issues in browser console

### Missing Component Errors

**Problem**: Errors about missing or undefined components.

**Solution**:

1. Make sure all imports and exports use consistent naming
2. Check for circular dependencies in your import structure
3. Verify that all referenced components are properly implemented
4. Look for capitalization issues in component names

### Build or Runtime Errors

**Problem**: Build fails or application crashes at runtime.

**Solution**:

1. Check TypeScript errors with `npm run lint`
2. Look for missing dependencies in package.json
3. Verify compatibility between dependencies
4. Check for browser-specific code that might not work in all environments

## Adding New Features

### Adding a New Function

To add a new function:

1. Define the function in `src/utils/function-calling.ts` following the pattern of existing functions
2. Implement the handler logic in the `functionCallHandler` function
3. Create a specialized renderer in `FunctionCallResult` if needed
4. Test with a compatible model

### Adding Text-to-Speech Options

To add new text-to-speech controls:

1. Update the `VoiceSettings` interface in `src/utils/voice-store.ts`
2. Modify the speech utility functions in `src/utils/text-to-speech.ts`
3. Update the UI in VoiceSelector and relevant controls
4. Add any needed controls to the settings UI

## Debugging Tips

1. Use `console.log` for speech and function call state
2. Check browser speech synthesis with `window.speechSynthesis.getVoices()`
3. Test function calls with simple examples first
4. Monitor network requests for API communication issues
5. Use React DevTools to inspect component state

## Still Having Issues?

If you encounter problems not covered here:

1. Check the browser console for detailed error messages
2. Look for similar issues in the GitHub repository
3. Document the exact steps to reproduce the issue
4. Add your findings to this troubleshooting guide
