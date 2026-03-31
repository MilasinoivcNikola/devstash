'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Copy, Check } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
}

export default function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);

  const monacoLanguage = (language ?? 'plaintext').toLowerCase();
  const lineCount = value ? value.split('\n').length : 1;
  const editorHeight = Math.min(400, Math.max(120, lineCount * 19 + 32));

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
          theme="vs-dark"
          options={{
            readOnly,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            fontSize: 12,
            lineHeight: 19,
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
