'use client';

import { useEditorPreferences } from '@/contexts/EditorPreferencesContext';

const FONT_SIZES = [10, 12, 14, 16, 18, 20];
const TAB_SIZES = [2, 4, 8];
const THEMES = [
  { value: 'vs-dark', label: 'VS Dark' },
  { value: 'monokai', label: 'Monokai' },
  { value: 'github-dark', label: 'GitHub Dark' },
];

export function EditorPreferencesForm() {
  const { preferences, updatePreference } = useEditorPreferences();

  return (
    <div className="space-y-4">
      {/* Font Size */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Font Size</p>
          <p className="text-xs text-muted-foreground">Editor font size in pixels</p>
        </div>
        <select
          value={preferences.fontSize}
          onChange={(e) => updatePreference('fontSize', Number(e.target.value))}
          className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground"
        >
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>
      </div>

      {/* Tab Size */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Tab Size</p>
          <p className="text-xs text-muted-foreground">Number of spaces per tab</p>
        </div>
        <select
          value={preferences.tabSize}
          onChange={(e) => updatePreference('tabSize', Number(e.target.value))}
          className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground"
        >
          {TAB_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} spaces
            </option>
          ))}
        </select>
      </div>

      {/* Theme */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Theme</p>
          <p className="text-xs text-muted-foreground">Editor color theme</p>
        </div>
        <select
          value={preferences.theme}
          onChange={(e) => updatePreference('theme', e.target.value)}
          className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground"
        >
          {THEMES.map((theme) => (
            <option key={theme.value} value={theme.value}>
              {theme.label}
            </option>
          ))}
        </select>
      </div>

      {/* Word Wrap */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Word Wrap</p>
          <p className="text-xs text-muted-foreground">Wrap long lines in the editor</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={preferences.wordWrap}
          onClick={() => updatePreference('wordWrap', !preferences.wordWrap)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
            preferences.wordWrap ? 'bg-emerald-500' : 'bg-muted-foreground/30'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              preferences.wordWrap ? 'translate-x-4.5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Minimap */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Minimap</p>
          <p className="text-xs text-muted-foreground">Show code minimap on the right side</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={preferences.minimap}
          onClick={() => updatePreference('minimap', !preferences.minimap)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
            preferences.minimap ? 'bg-emerald-500' : 'bg-muted-foreground/30'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              preferences.minimap ? 'translate-x-4.5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
