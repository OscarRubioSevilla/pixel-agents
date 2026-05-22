import { useState } from 'react';

import type { IdeType } from '../hooks/useExtensionMessages.js';
import { isSoundEnabled, setSoundEnabled } from '../notificationSound.js';
import { transport } from '../transport/index.js';
import { Button } from './ui/Button.js';
import { Checkbox } from './ui/Checkbox.js';
import { MenuItem } from './ui/MenuItem.js';
import { Modal } from './ui/Modal.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDebugMode: boolean;
  onToggleDebugMode: () => void;
  alwaysShowOverlay: boolean;
  onToggleAlwaysShowOverlay: () => void;
  externalAssetDirectories: string[];
  watchAllSessions: boolean;
  onToggleWatchAllSessions: () => void;
  hooksEnabled: boolean;
  onToggleHooksEnabled: () => void;
  cursorHooksEnabled: boolean;
  onToggleCursorHooksEnabled: () => void;
  agentSource: string;
  onAgentSourceChange: (source: string) => void;
  usesClaudeHooks: boolean;
  usesCursorHooks: boolean;
  ideType: IdeType;
}

const ideDisplayNames: Record<IdeType, string> = {
  vscode: 'VS Code',
  cursor: 'Cursor',
  unknown: 'Unknown IDE',
};

export function SettingsModal({
  isOpen,
  onClose,
  isDebugMode,
  onToggleDebugMode,
  alwaysShowOverlay,
  onToggleAlwaysShowOverlay,
  externalAssetDirectories,
  watchAllSessions,
  onToggleWatchAllSessions,
  hooksEnabled,
  onToggleHooksEnabled,
  cursorHooksEnabled,
  onToggleCursorHooksEnabled,
  agentSource,
  onAgentSourceChange,
  usesClaudeHooks,
  usesCursorHooks,
  ideType,
}: SettingsModalProps) {
  const [soundLocal, setSoundLocal] = useState(isSoundEnabled);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <MenuItem
        onClick={() => {
          transport.send({ type: 'openSessionsFolder' });
          onClose();
        }}
      >
        Open Sessions Folder
      </MenuItem>
      <MenuItem
        onClick={() => {
          transport.send({ type: 'exportLayout' });
          onClose();
        }}
      >
        Export Layout
      </MenuItem>
      <MenuItem
        onClick={() => {
          transport.send({ type: 'importLayout' });
          onClose();
        }}
      >
        Import Layout
      </MenuItem>
      <MenuItem
        onClick={() => {
          transport.send({ type: 'addExternalAssetDirectory' });
          onClose();
        }}
      >
        Add Asset Directory
      </MenuItem>
      {externalAssetDirectories.map((dir) => (
        <div key={dir} className="flex items-center justify-between py-4 px-10 gap-8">
          <span
            className="text-xs text-text-muted overflow-hidden text-ellipsis whitespace-nowrap"
            title={dir}
          >
            {dir.split(/[/\\]/).pop() ?? dir}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => transport.send({ type: 'removeExternalAssetDirectory', path: dir })}
            className="shrink-0"
          >
            x
          </Button>
        </div>
      ))}
      <Checkbox
        label="Sound Notifications"
        checked={soundLocal}
        onChange={() => {
          const newVal = !isSoundEnabled();
          setSoundEnabled(newVal);
          setSoundLocal(newVal);
          transport.send({ type: 'setSoundEnabled', enabled: newVal });
        }}
      />
      <Checkbox
        label="Watch All Sessions"
        checked={watchAllSessions}
        onChange={onToggleWatchAllSessions}
      />
      <div className="py-4 px-10 flex flex-col gap-4">
        <label className="text-sm text-text-muted">Agent Source</label>
        <select
          value={agentSource}
          onChange={(e) => onAgentSourceChange(e.target.value)}
          className="bg-btn-bg border-2 border-border text-text px-8 py-4 text-sm"
        >
          <option value="auto">Auto (detect IDE)</option>
          <option value="cursor">Cursor Agent</option>
          <option value="claude">Claude Code</option>
          <option value="both">Both (Claude + Cursor)</option>
        </select>
      </div>
      {usesClaudeHooks && (
        <Checkbox
          label="Instant Detection (Claude Hooks)"
          checked={hooksEnabled}
          onChange={onToggleHooksEnabled}
        />
      )}
      {usesCursorHooks && (
        <Checkbox
          label="Instant Detection (Cursor Hooks)"
          checked={cursorHooksEnabled}
          onChange={onToggleCursorHooksEnabled}
        />
      )}
      <Checkbox
        label="Always Show Labels"
        checked={alwaysShowOverlay}
        onChange={onToggleAlwaysShowOverlay}
      />
      <Checkbox label="Debug View" checked={isDebugMode} onChange={onToggleDebugMode} />
      <div className="pt-6 mt-4 border-t border-border text-xs text-text-muted px-10">
        Running in {ideDisplayNames[ideType]}
      </div>
    </Modal>
  );
}
