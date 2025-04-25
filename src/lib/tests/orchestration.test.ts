/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { routeUserInput } from '../orchestration';
import type { OrchestratorDecision } from '../types';

describe('routeUserInput', () => {
  it('delegates to weather agent on weather queries', () => {
    const input = 'What is the weather in Berlin?';
    const result = routeUserInput(input);
    expect(result).toEqual({
      type: 'delegate',
      agent: 'weather',
      args: { location: input },
    });
  });

  it('delegates to research agent on research queries', () => {
    const input = 'Who discovered penicillin?';
    const result = routeUserInput(input);
    expect(result).toEqual({
      type: 'delegate',
      agent: 'research',
      args: { query: input },
    });
  });

  it('responds with greeting on hello inputs', () => {
    const input = 'Hi there';
    const result = routeUserInput(input);
    expect(result).toEqual(expect.objectContaining({ type: 'respond' }));
    expect((result as any).message).toMatch(/Hi there/i);
  });

  it('responds with thanks on thank you inputs', () => {
    const input = 'Thanks for your help';
    const result = routeUserInput(input);
    expect(result).toEqual(expect.objectContaining({ type: 'respond' }));
    expect((result as any).message).toMatch(/welcome/i);
  });

  it('responds with goodbye on bye inputs', () => {
    const input = 'Goodbye!';
    const result = routeUserInput(input);
    expect(result).toEqual(expect.objectContaining({ type: 'respond' }));
    expect((result as any).message).toMatch(/Goodbye/i);
  });

  it('asks for clarification on unrecognized inputs', () => {
    const input = 'banana?';
    const result = routeUserInput(input);
    expect(result).toEqual(expect.objectContaining({ type: 'clarify' }));
    expect((result as any).question).toMatch(
      /specify what you need help with/i,
    );
  });
});
