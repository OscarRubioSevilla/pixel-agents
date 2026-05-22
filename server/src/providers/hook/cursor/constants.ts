/**
 * Cursor-specific constants. Kept separate from `server/src/constants.ts` so a
 * future single-provider build doesn't accidentally depend on Cursor unless
 * Cursor is the active provider.
 */

/** Output filename after esbuild compiles cursor-hook.ts to CJS */
export const CURSOR_HOOK_SCRIPT_NAME = 'cursor-hook.js';

/** Hook events to install in ~/.cursor/hooks.json */
export const CURSOR_HOOK_EVENTS = [
  'sessionStart',
  'sessionEnd',
  'preToolUse',
  'postToolUse',
  'postToolUseFailure',
  'subagentStart',
  'subagentStop',
  'beforeShellExecution',
  'stop',
] as const;

/** Cursor composer command attempted when focusing a hooks-only cursor agent */
export const CURSOR_COMPOSER_COMMAND = 'composer.open';
