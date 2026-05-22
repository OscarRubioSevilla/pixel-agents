import type { HookProvider } from '../../core/src/provider.js';
import { claudeProvider } from '../../server/src/providers/hook/claude/claude.js';
import { cursorProvider } from '../../server/src/providers/hook/cursor/cursor.js';
import type { IdeType } from './ideDetector.js';
import { IDE_TYPE } from './ideDetector.js';

export type AgentSource = 'auto' | 'cursor' | 'claude' | 'both';

export interface ResolvedProviders {
  /** Effective agent source after resolving `auto` from IDE type */
  source: Exclude<AgentSource, 'auto'>;
  /** Primary provider for terminal launch + transcript heuristics */
  primary: HookProvider;
  /** All active hook providers (for multi-provider hook routing) */
  all: HookProvider[];
}

export function resolveAgentSource(
  ideType: IdeType,
  configured: AgentSource = 'auto',
): Exclude<AgentSource, 'auto'> {
  if (configured === 'cursor' || configured === 'claude' || configured === 'both') {
    return configured;
  }
  if (ideType === IDE_TYPE.CURSOR) return 'cursor';
  return 'claude';
}

export function resolveProviders(
  ideType: IdeType,
  configured: AgentSource = 'auto',
): ResolvedProviders {
  const source = resolveAgentSource(ideType, configured);
  switch (source) {
    case 'cursor':
      return { source, primary: cursorProvider, all: [cursorProvider] };
    case 'both':
      return { source, primary: claudeProvider, all: [claudeProvider, cursorProvider] };
    case 'claude':
    default:
      return { source, primary: claudeProvider, all: [claudeProvider] };
  }
}

export function usesClaudeTerminal(source: Exclude<AgentSource, 'auto'>): boolean {
  return source === 'claude' || source === 'both';
}

export function usesCursorHooks(source: Exclude<AgentSource, 'auto'>): boolean {
  return source === 'cursor' || source === 'both';
}

export function usesClaudeHooks(source: Exclude<AgentSource, 'auto'>): boolean {
  return source === 'claude' || source === 'both';
}

export function mergeProviderCapabilities(providers: HookProvider[]): {
  readingTools: string[];
  subagentToolNames: string[];
} {
  const readingTools = new Set<string>();
  const subagentToolNames = new Set<string>();
  for (const provider of providers) {
    for (const tool of provider.readingTools) readingTools.add(tool);
    for (const tool of provider.subagentToolNames) subagentToolNames.add(tool);
  }
  return {
    readingTools: [...readingTools],
    subagentToolNames: [...subagentToolNames],
  };
}
