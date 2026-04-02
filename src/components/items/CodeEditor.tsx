'use client';

import { useState, useRef } from 'react';
import Editor, { type Monaco } from '@monaco-editor/react';
import { Copy, Check } from 'lucide-react';
import { useEditorPreferences } from '@/contexts/EditorPreferencesContext';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
}

function defineCustomThemes(monaco: Monaco) {
  monaco.editor.defineTheme('monokai', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '75715E', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'F92672' },
      { token: 'string', foreground: 'E6DB74' },
      { token: 'number', foreground: 'AE81FF' },
      { token: 'type', foreground: '66D9EF', fontStyle: 'italic' },
      { token: 'function', foreground: 'A6E22E' },
      { token: 'variable', foreground: 'F8F8F2' },
      { token: 'constant', foreground: 'AE81FF' },
      { token: 'tag', foreground: 'F92672' },
      { token: 'attribute.name', foreground: 'A6E22E' },
      { token: 'attribute.value', foreground: 'E6DB74' },
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#F8F8F2',
      'editor.lineHighlightBackground': '#3E3D32',
      'editor.selectionBackground': '#49483E',
      'editorCursor.foreground': '#F8F8F0',
      'editorWhitespace.foreground': '#3B3A32',
    },
  });

  monaco.editor.defineTheme('github-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff7b72' },
      { token: 'string', foreground: 'a5d6ff' },
      { token: 'number', foreground: '79c0ff' },
      { token: 'type', foreground: 'ffa657' },
      { token: 'function', foreground: 'd2a8ff' },
      { token: 'variable', foreground: 'c9d1d9' },
      { token: 'constant', foreground: '79c0ff' },
      { token: 'tag', foreground: '7ee787' },
      { token: 'attribute.name', foreground: '79c0ff' },
      { token: 'attribute.value', foreground: 'a5d6ff' },
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#c9d1d9',
      'editor.lineHighlightBackground': '#161b22',
      'editor.selectionBackground': '#264f78',
      'editorCursor.foreground': '#c9d1d9',
      'editorWhitespace.foreground': '#21262d',
    },
  });
}

export default function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const themesDefined = useRef(false);
  const { preferences } = useEditorPreferences();

  const monacoLanguage = (language ?? 'plaintext').toLowerCase();
  const lineCount = value ? value.split('\n').length : 1;
  const lineHeight = preferences.fontSize + 7;
  const editorHeight = Math.min(400, Math.max(120, lineCount * lineHeight + 32));

  function handleBeforeMount(monaco: Monaco) {
    if (!themesDefined.current) {
      defineCustomThemes(monaco);
      themesDefined.current = true;
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-md overflow-hidden border border-border">
      {/* macOS-style header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1e1e1e] border-b border-white/[0.08]">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <div className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>

        {monacoLanguage && monacoLanguage !== 'plaintext' && (
          <span className="ml-2 text-xs text-white/40 font-mono">{monacoLanguage}</span>
        )}

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code"
          className="ml-auto flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors px-1.5 py-0.5 rounded hover:bg-white/10"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Monaco Editor */}
      <div style={{ height: editorHeight }}>
        <Editor
          height="100%"
          language={monacoLanguage}
          value={value}
          onChange={(val) => onChange?.(val ?? '')}
          theme={preferences.theme}
          beforeMount={handleBeforeMount}
          options={{
            readOnly,
            minimap: { enabled: preferences.minimap },
            scrollBeyondLastLine: false,
            wordWrap: preferences.wordWrap ? 'on' : 'off',
            fontSize: preferences.fontSize,
            tabSize: preferences.tabSize,
            lineHeight,
            padding: { top: 12, bottom: 12 },
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 5,
              horizontalScrollbarSize: 5,
            },
            overviewRulerLanes: 0,
            renderLineHighlight: readOnly ? 'none' : 'line',
            contextmenu: false,
            folding: false,
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            glyphMargin: false,
            renderValidationDecorations: 'off',
          }}
        />
      </div>
    </div>
  );
}
