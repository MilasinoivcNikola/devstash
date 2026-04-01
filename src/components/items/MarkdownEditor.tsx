'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  placeholder = 'Write markdown content...',
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>(readOnly ? 'preview' : 'write');
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const lineCount = value ? value.split('\n').length : 1;
  const editorHeight = Math.min(400, Math.max(120, lineCount * 20 + 32));

  return (
    <div className="rounded-md overflow-hidden border border-border">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#2d2d2d] border-b border-white/[0.08]">
        {!readOnly && (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'write'
                  ? 'bg-white/10 text-white/80'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'preview'
                  ? 'bg-white/10 text-white/80'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              Preview
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy content"
          className="ml-auto flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors px-1.5 py-0.5 rounded hover:bg-white/10"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Content */}
      <div className="bg-[#1e1e1e]" style={{ minHeight: 120, maxHeight: 400 }}>
        {activeTab === 'write' && !readOnly ? (
          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            style={{ height: editorHeight }}
            className="w-full resize-none bg-transparent px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none font-mono leading-5"
          />
        ) : (
          <div
            className="markdown-preview overflow-y-auto px-4 py-3"
            style={{ minHeight: 120, maxHeight: 400 }}
          >
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <span className="text-white/20 text-sm">Nothing to preview</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
