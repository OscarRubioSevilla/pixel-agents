import * as path from 'path';

import {
  BASH_COMMAND_DISPLAY_MAX_LENGTH,
  TASK_DESCRIPTION_DISPLAY_MAX_LENGTH,
} from '../../../constants.js';

export function formatToolStatus(toolName: string, input?: unknown): string {
  const inp = (input ?? {}) as Record<string, unknown>;
  const base = (p: unknown) => (typeof p === 'string' ? path.basename(p) : '');
  switch (toolName) {
    case 'Read':
      return `Reading ${base(inp.path ?? inp.file_path)}`;
    case 'Write':
      return `Writing ${base(inp.path ?? inp.file_path)}`;
    case 'Shell': {
      const cmd = (typeof inp.command === 'string' ? inp.command : '') || '';
      return `Running: ${cmd.length > BASH_COMMAND_DISPLAY_MAX_LENGTH ? cmd.slice(0, BASH_COMMAND_DISPLAY_MAX_LENGTH) + '\u2026' : cmd}`;
    }
    case 'Grep':
      return 'Searching code';
    case 'Glob':
      return 'Searching files';
    case 'WebFetch':
      return 'Fetching web content';
    case 'WebSearch':
      return 'Searching the web';
    case 'Task': {
      const desc =
        typeof inp.description === 'string'
          ? inp.description
          : typeof inp.task === 'string'
            ? inp.task
            : '';
      return desc
        ? `Subtask: ${desc.length > TASK_DESCRIPTION_DISPLAY_MAX_LENGTH ? desc.slice(0, TASK_DESCRIPTION_DISPLAY_MAX_LENGTH) + '\u2026' : desc}`
        : 'Running subtask';
    }
    case 'Delete':
      return `Deleting ${base(inp.path ?? inp.file_path)}`;
    default:
      return `Using ${toolName}`;
  }
}
