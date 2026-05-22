import { describe, expect, it } from 'vitest';

import { cursorProvider } from '../src/providers/hook/cursor/cursor.js';

describe('cursorProvider', () => {
  describe('identity', () => {
    it('has kind "hook"', () => {
      expect(cursorProvider.kind).toBe('hook');
    });
    it('has id "cursor"', () => {
      expect(cursorProvider.id).toBe('cursor');
    });
    it('has displayName "Cursor Agent"', () => {
      expect(cursorProvider.displayName).toBe('Cursor Agent');
    });
    it('has Task in subagentToolNames', () => {
      expect(cursorProvider.subagentToolNames.has('Task')).toBe(true);
    });
    it('has reading tools Read/Grep/Glob/WebFetch', () => {
      for (const tool of ['Read', 'Grep', 'Glob', 'WebFetch']) {
        expect(cursorProvider.readingTools.has(tool)).toBe(true);
      }
    });
    it('has no team provider', () => {
      expect(cursorProvider.team).toBeUndefined();
    });
  });

  describe('normalizeHookEvent', () => {
    it('returns null when hook_event_name is missing', () => {
      expect(cursorProvider.normalizeHookEvent({ conversation_id: 'x' })).toBeNull();
    });

    it('uses conversation_id when session_id is absent', () => {
      const result = cursorProvider.normalizeHookEvent({
        hook_event_name: 'stop',
        conversation_id: 'conv-1',
      });
      expect(result?.sessionId).toBe('conv-1');
      expect(result?.event.kind).toBe('turnEnd');
    });

    it('normalizes preToolUse with tool_use_id', () => {
      const result = cursorProvider.normalizeHookEvent({
        hook_event_name: 'preToolUse',
        session_id: 'sess-1',
        tool_name: 'Read',
        tool_use_id: 'tu-123',
        tool_input: { path: '/foo.ts' },
      });
      expect(result?.event.kind).toBe('toolStart');
      if (result?.event.kind === 'toolStart') {
        expect(result.event.toolId).toBe('tu-123');
        expect(result.event.toolName).toBe('Read');
      }
    });

    it('normalizes postToolUse to toolEnd with tool_use_id', () => {
      const result = cursorProvider.normalizeHookEvent({
        hook_event_name: 'postToolUse',
        session_id: 'sess-1',
        tool_use_id: 'tu-123',
      });
      expect(result?.event.kind).toBe('toolEnd');
      if (result?.event.kind === 'toolEnd') {
        expect(result.event.toolId).toBe('tu-123');
      }
    });

    it('normalizes beforeShellExecution to permissionRequest', () => {
      const result = cursorProvider.normalizeHookEvent({
        hook_event_name: 'beforeShellExecution',
        conversation_id: 'conv-1',
        command: 'rm -rf /',
      });
      expect(result?.event.kind).toBe('permissionRequest');
    });

    it('normalizes sessionStart with workspace_roots cwd', () => {
      const result = cursorProvider.normalizeHookEvent({
        hook_event_name: 'sessionStart',
        session_id: 'sess-1',
        workspace_roots: ['/Users/dev/project'],
        transcript_path: '/tmp/transcript.txt',
        composer_mode: 'agent',
      });
      expect(result?.event.kind).toBe('sessionStart');
      if (result?.event.kind === 'sessionStart') {
        expect(result.event.cwd).toBe('/Users/dev/project');
        expect(result.event.transcriptPath).toBe('/tmp/transcript.txt');
        expect(result.event.source).toBe('agent');
      }
    });

    it('normalizes subagentStart with subagent_id and tool_call_id', () => {
      const result = cursorProvider.normalizeHookEvent({
        hook_event_name: 'subagentStart',
        session_id: 'sess-1',
        subagent_id: 'sub-1',
        subagent_type: 'explore',
        tool_call_id: 'tc-99',
        task: 'Explore auth flow',
      });
      expect(result?.event.kind).toBe('subagentStart');
      if (result?.event.kind === 'subagentStart') {
        expect(result.event.toolId).toBe('sub-1');
        expect(result.event.parentToolId).toBe('tc-99');
        expect(result.event.toolName).toBe('explore');
      }
    });

    it('normalizes subagentStop to subagentEnd', () => {
      const result = cursorProvider.normalizeHookEvent({
        hook_event_name: 'subagentStop',
        session_id: 'sess-1',
        subagent_id: 'sub-1',
        tool_call_id: 'tc-99',
      });
      expect(result?.event.kind).toBe('subagentEnd');
    });

    it('normalizes sessionEnd with reason', () => {
      const result = cursorProvider.normalizeHookEvent({
        hook_event_name: 'sessionEnd',
        session_id: 'sess-1',
        reason: 'completed',
      });
      expect(result?.event.kind).toBe('sessionEnd');
      if (result?.event.kind === 'sessionEnd') {
        expect(result.event.reason).toBe('completed');
      }
    });
  });

  describe('formatToolStatus', () => {
    it('formats Read with path', () => {
      expect(cursorProvider.formatToolStatus('Read', { path: '/a/b.ts' })).toBe('Reading b.ts');
    });
    it('formats Shell command', () => {
      expect(cursorProvider.formatToolStatus('Shell', { command: 'npm test' })).toBe(
        'Running: npm test',
      );
    });
    it('formats Task with task description', () => {
      expect(cursorProvider.formatToolStatus('Task', { task: 'Research API' })).toBe(
        'Subtask: Research API',
      );
    });
  });
});
