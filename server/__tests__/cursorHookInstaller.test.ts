import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let tmpBase: string;

vi.mock('os', async () => {
  const actual = await vi.importActual<typeof import('os')>('os');
  return { ...actual, homedir: () => tmpBase };
});

const { areHooksInstalled, installHooks, uninstallHooks, copyHookScript } =
  await import('../src/providers/hook/cursor/cursorHookInstaller.js');

function readHooksConfig(): Record<string, unknown> {
  const p = path.join(tmpBase, '.cursor', 'hooks.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

describe('cursorHookInstaller', () => {
  beforeEach(() => {
    tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'pxl-cursor-hook-test-'));
    fs.mkdirSync(path.join(tmpBase, '.cursor'), { recursive: true });
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it('installHooks adds entries to hooks.json', () => {
    installHooks();
    const config = readHooksConfig();
    expect(config.hooks).toBeTruthy();
    const hooks = config.hooks as Record<string, unknown[]>;
    expect(hooks['sessionStart']).toHaveLength(1);
    expect(hooks['preToolUse']).toHaveLength(1);
    expect(hooks['stop']).toHaveLength(1);
  });

  it('installHooks is idempotent', () => {
    installHooks();
    installHooks();
    const hooks = readHooksConfig().hooks as Record<string, unknown[]>;
    expect(hooks['sessionStart']).toHaveLength(1);
  });

  it('areHooksInstalled returns true after install', () => {
    installHooks();
    expect(areHooksInstalled()).toBe(true);
  });

  it('areHooksInstalled returns false before install', () => {
    expect(areHooksInstalled()).toBe(false);
  });

  it('uninstallHooks removes entries', () => {
    installHooks();
    uninstallHooks();
    expect(areHooksInstalled()).toBe(false);
  });

  it('handles missing hooks.json gracefully', () => {
    expect(() => areHooksInstalled()).not.toThrow();
    expect(areHooksInstalled()).toBe(false);
  });

  it('copyHookScript copies to ~/.pixel-agents/hooks/', () => {
    const mockExtPath = path.join(tmpBase, 'mock-ext');
    const hookSrc = path.join(mockExtPath, 'dist', 'hooks');
    fs.mkdirSync(hookSrc, { recursive: true });
    fs.writeFileSync(path.join(hookSrc, 'cursor-hook.js'), '// mock cursor hook');

    copyHookScript(mockExtPath);

    const dst = path.join(tmpBase, '.pixel-agents', 'hooks', 'cursor-hook.js');
    expect(fs.existsSync(dst)).toBe(true);
  });
});
