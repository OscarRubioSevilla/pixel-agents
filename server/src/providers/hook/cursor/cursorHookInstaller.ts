import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { HOOK_SCRIPTS_DIR } from '../../../constants.js';
import { CURSOR_HOOK_EVENTS, CURSOR_HOOK_SCRIPT_NAME } from './constants.js';

const HOOK_SCRIPT_MARKER = CURSOR_HOOK_SCRIPT_NAME;

interface CursorHookEntry {
  command: string;
  timeout?: number;
}

interface CursorHooksConfig {
  version?: number;
  hooks?: Record<string, CursorHookEntry[]>;
  [key: string]: unknown;
}

function getCursorHooksPath(): string {
  return path.join(os.homedir(), '.cursor', 'hooks.json');
}

function getHookScriptPath(): string {
  return path.join(os.homedir(), HOOK_SCRIPTS_DIR, CURSOR_HOOK_SCRIPT_NAME);
}

function readCursorHooks(): CursorHooksConfig {
  const hooksPath = getCursorHooksPath();
  try {
    if (fs.existsSync(hooksPath)) {
      return JSON.parse(fs.readFileSync(hooksPath, 'utf-8')) as CursorHooksConfig;
    }
  } catch (e) {
    console.error(`[Pixel Agents] Failed to read Cursor hooks.json: ${e}`);
  }
  return {};
}

function writeCursorHooks(config: CursorHooksConfig): void {
  const hooksPath = getCursorHooksPath();
  const dir = path.dirname(hooksPath);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = hooksPath + '.pixel-agents-tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2), 'utf-8');
    fs.renameSync(tmpPath, hooksPath);
  } catch (e) {
    console.error(`[Pixel Agents] Failed to write Cursor hooks.json: ${e}`);
  }
}

function isOurHookEntry(entry: CursorHookEntry): boolean {
  return entry.command.includes(HOOK_SCRIPT_MARKER);
}

function makeHookCommand(): string {
  const scriptPath = getHookScriptPath();
  return `node "${scriptPath}"`;
}

function makeHookEntry(): CursorHookEntry {
  return {
    command: makeHookCommand(),
    timeout: 5,
  };
}

export function areHooksInstalled(): boolean {
  const config = readCursorHooks();
  if (!config.hooks) return false;
  return CURSOR_HOOK_EVENTS.every((event) => {
    const entries = config.hooks?.[event];
    return Array.isArray(entries) && entries.some(isOurHookEntry);
  });
}

export function installHooks(): void {
  const config = readCursorHooks();
  if (typeof config.version !== 'number') {
    config.version = 1;
  }
  if (!config.hooks) {
    config.hooks = {};
  }

  let changed = false;
  for (const event of CURSOR_HOOK_EVENTS) {
    if (!Array.isArray(config.hooks[event])) {
      config.hooks[event] = [];
    }
    const entries = config.hooks[event];
    const filtered = entries.filter((e) => !isOurHookEntry(e));
    filtered.push(makeHookEntry());
    if (JSON.stringify(filtered) !== JSON.stringify(entries)) {
      config.hooks[event] = filtered;
      changed = true;
    }
  }

  if (changed) {
    writeCursorHooks(config);
    console.log('[Pixel Agents] Hooks installed in ~/.cursor/hooks.json');
  }
}

export function uninstallHooks(): void {
  const config = readCursorHooks();
  if (!config.hooks) return;

  let changed = false;
  for (const event of Object.keys(config.hooks)) {
    const entries = config.hooks[event];
    if (!Array.isArray(entries)) continue;
    const filtered = entries.filter((e) => !isOurHookEntry(e));
    if (filtered.length !== entries.length) {
      config.hooks[event] = filtered;
      changed = true;
    }
    if (config.hooks[event].length === 0) {
      delete config.hooks[event];
    }
  }
  if (config.hooks && Object.keys(config.hooks).length === 0) {
    delete config.hooks;
  }

  if (changed) {
    writeCursorHooks(config);
    console.log('[Pixel Agents] Hooks removed from ~/.cursor/hooks.json');
  }
}

export function copyHookScript(extensionPath: string): void {
  const src = path.join(extensionPath, 'dist', 'hooks', CURSOR_HOOK_SCRIPT_NAME);
  const dst = getHookScriptPath();
  const dstDir = path.dirname(dst);

  try {
    if (!fs.existsSync(dstDir)) {
      fs.mkdirSync(dstDir, { recursive: true, mode: 0o700 });
    }
    if (!fs.existsSync(src)) {
      console.warn(`[Pixel Agents] Cursor hook script not found at ${src}`);
      return;
    }
    fs.copyFileSync(src, dst);
    fs.chmodSync(dst, 0o700);
    console.log(`[Pixel Agents] Cursor hook script installed at ${dst}`);
  } catch (e) {
    console.error(`[Pixel Agents] Failed to copy Cursor hook script: ${e}`);
  }
}
