import type { AgentEvent, HookProvider } from '../../../../../core/src/provider.js';
import { CURSOR_HOOK_EVENTS } from './constants.js';
import {
  areHooksInstalled as installerAreHooksInstalled,
  installHooks as installerInstallHooks,
  uninstallHooks as installerUninstallHooks,
} from './cursorHookInstaller.js';
import { formatToolStatus } from './formatToolStatus.js';

/** Cursor hook_event_name values (camelCase per Cursor docs). */
const CURSOR_EVENT = {
  SESSION_START: 'sessionStart',
  SESSION_END: 'sessionEnd',
  PRE_TOOL_USE: 'preToolUse',
  POST_TOOL_USE: 'postToolUse',
  POST_TOOL_USE_FAILURE: 'postToolUseFailure',
  SUBAGENT_START: 'subagentStart',
  SUBAGENT_STOP: 'subagentStop',
  BEFORE_SHELL: 'beforeShellExecution',
  STOP: 'stop',
} as const;

function resolveSessionId(raw: Record<string, unknown>): string | null {
  if (typeof raw.session_id === 'string' && raw.session_id.length > 0) {
    return raw.session_id;
  }
  if (typeof raw.conversation_id === 'string' && raw.conversation_id.length > 0) {
    return raw.conversation_id;
  }
  return null;
}

function resolveCwd(raw: Record<string, unknown>): string | undefined {
  if (typeof raw.cwd === 'string' && raw.cwd.length > 0) return raw.cwd;
  if (Array.isArray(raw.workspace_roots) && typeof raw.workspace_roots[0] === 'string') {
    return raw.workspace_roots[0];
  }
  return undefined;
}

function resolveTranscriptPath(raw: Record<string, unknown>): string | undefined {
  if (typeof raw.transcript_path === 'string' && raw.transcript_path.length > 0) {
    return raw.transcript_path;
  }
  return undefined;
}

function normalizeHookEvent(
  raw: Record<string, unknown>,
): { sessionId: string; event: AgentEvent } | null {
  const eventName = raw.hook_event_name;
  const sessionId = resolveSessionId(raw);
  if (typeof eventName !== 'string' || !sessionId) return null;

  switch (eventName) {
    case CURSOR_EVENT.PRE_TOOL_USE: {
      const toolName = typeof raw.tool_name === 'string' ? raw.tool_name : '';
      const toolInput =
        typeof raw.tool_input === 'object' && raw.tool_input !== null
          ? (raw.tool_input as Record<string, unknown>)
          : {};
      const toolId =
        typeof raw.tool_use_id === 'string' && raw.tool_use_id.length > 0
          ? raw.tool_use_id
          : `hook-${Date.now()}`;
      return {
        sessionId,
        event: {
          kind: 'toolStart',
          toolId,
          toolName,
          input: toolInput,
          runInBackground: raw.is_background_agent === true,
        },
      };
    }

    case CURSOR_EVENT.POST_TOOL_USE:
    case CURSOR_EVENT.POST_TOOL_USE_FAILURE: {
      const toolId =
        typeof raw.tool_use_id === 'string' && raw.tool_use_id.length > 0
          ? raw.tool_use_id
          : 'current';
      return { sessionId, event: { kind: 'toolEnd', toolId } };
    }

    case CURSOR_EVENT.STOP:
      return { sessionId, event: { kind: 'turnEnd' } };

    case CURSOR_EVENT.SUBAGENT_START: {
      const subagentType = typeof raw.subagent_type === 'string' ? raw.subagent_type : 'subagent';
      const subToolId =
        typeof raw.subagent_id === 'string' && raw.subagent_id.length > 0
          ? raw.subagent_id
          : `hook-sub-${subagentType}-${Date.now()}`;
      const parentToolId =
        typeof raw.tool_call_id === 'string' && raw.tool_call_id.length > 0
          ? raw.tool_call_id
          : 'current';
      return {
        sessionId,
        event: {
          kind: 'subagentStart',
          parentToolId,
          toolId: subToolId,
          toolName: subagentType,
          input: raw,
          runInBackground: raw.is_parallel_worker === true,
        },
      };
    }

    case CURSOR_EVENT.SUBAGENT_STOP: {
      const parentToolId =
        typeof raw.tool_call_id === 'string' && raw.tool_call_id.length > 0
          ? raw.tool_call_id
          : 'current';
      const subToolId =
        typeof raw.subagent_id === 'string' && raw.subagent_id.length > 0
          ? raw.subagent_id
          : 'current';
      return {
        sessionId,
        event: { kind: 'subagentEnd', parentToolId, toolId: subToolId },
      };
    }

    case CURSOR_EVENT.BEFORE_SHELL:
      return { sessionId, event: { kind: 'permissionRequest' } };

    case CURSOR_EVENT.SESSION_START: {
      const composerMode = typeof raw.composer_mode === 'string' ? raw.composer_mode : undefined;
      return {
        sessionId,
        event: {
          kind: 'sessionStart',
          source: composerMode,
          transcriptPath: resolveTranscriptPath(raw),
          cwd: resolveCwd(raw),
        },
      };
    }

    case CURSOR_EVENT.SESSION_END: {
      const reason = typeof raw.reason === 'string' ? raw.reason : undefined;
      return { sessionId, event: { kind: 'sessionEnd', reason } };
    }

    default:
      return null;
  }
}

function installHooks(_serverUrl: string, _authToken: string): Promise<void> {
  installerInstallHooks();
  return Promise.resolve();
}

function uninstallHooks(): Promise<void> {
  installerUninstallHooks();
  return Promise.resolve();
}

function areHooksInstalled(): Promise<boolean> {
  return Promise.resolve(installerAreHooksInstalled());
}

export const cursorProvider: HookProvider = {
  kind: 'hook',
  id: 'cursor',
  displayName: 'Cursor Agent',
  protocolVersion: 1,

  normalizeHookEvent,

  installHooks,
  uninstallHooks,
  areHooksInstalled,

  formatToolStatus,
  permissionExemptTools: new Set(['Task']),
  subagentToolNames: new Set(['Task']),
  readingTools: new Set(['Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch']),
};

/** Events we register in ~/.cursor/hooks.json (exported for tests). */
export const cursorHookEvents = CURSOR_HOOK_EVENTS;
