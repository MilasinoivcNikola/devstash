'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Code, Sparkles, Terminal, StickyNote, Link, File, Image } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createItem } from '@/actions/items';
import { getUserCollections } from '@/actions/collections';
import CodeEditor from '@/components/items/CodeEditor';
import MarkdownEditor from '@/components/items/MarkdownEditor';
import FileUpload, { type UploadedFile } from '@/components/items/FileUpload';
import CollectionPicker, { type CollectionOption } from '@/components/items/CollectionPicker';

const TYPES = [
  { name: 'snippet', label: 'Snippet', icon: Code, color: '#3b82f6' },
  { name: 'prompt', label: 'Prompt', icon: Sparkles, color: '#8b5cf6' },
  { name: 'command', label: 'Command', icon: Terminal, color: '#f97316' },
  { name: 'note', label: 'Note', icon: StickyNote, color: '#fde047' },
  { name: 'link', label: 'Link', icon: Link, color: '#10b981' },
  { name: 'file', label: 'File', icon: File, color: '#6b7280' },
  { name: 'image', label: 'Image', icon: Image, color: '#ec4899' },
] as const;

type TypeName = (typeof TYPES)[number]['name'];

const CONTENT_TYPES = new Set<TypeName>(['snippet', 'prompt', 'command', 'note']);
const LANGUAGE_TYPES = new Set<TypeName>(['snippet', 'command']);
const MARKDOWN_TYPES = new Set<TypeName>(['prompt', 'note']);
const FILE_TYPES = new Set<TypeName>(['file', 'image']);

function inputClass(multiline?: boolean) {
  const base =
    'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  return multiline ? `${base} resize-none` : base;
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  );
}

interface FormState {
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  tags: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  content: '',
  url: '',
  language: '',
  tags: '',
};

interface CreateItemDialogProps {
  defaultType?: TypeName;
  triggerLabel?: string;
}

export default function CreateItemDialog({ defaultType, triggerLabel }: CreateItemDialogProps = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<TypeName>(defaultType ?? 'snippet');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const showContent = CONTENT_TYPES.has(selectedType);
  const showLanguage = LANGUAGE_TYPES.has(selectedType);
  const showMarkdown = MARKDOWN_TYPES.has(selectedType);
  const showUrl = selectedType === 'link';
  const showFile = FILE_TYPES.has(selectedType);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setForm(EMPTY_FORM);
      setSelectedType(defaultType ?? 'snippet');
      setUploadedFile(null);
      setSelectedCollectionIds([]);
    } else {
      getUserCollections().then(setCollections);
    }
    setOpen(next);
  }

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setSaving(true);
    const result = await createItem({
      title: form.title,
      description: form.description || null,
      content: form.content || null,
      url: form.url || null,
      fileUrl: uploadedFile?.key ?? null,
      fileName: uploadedFile?.fileName ?? null,
      fileSize: uploadedFile?.fileSize ?? null,
      language: form.language || null,
      tags,
      collectionIds: selectedCollectionIds,
      itemTypeName: selectedType,
    });
    setSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success('Item created');
    handleOpenChange(false);
    router.refresh();
  }

  const canSubmit =
    form.title.trim().length > 0 &&
    (selectedType !== 'link' || form.url.trim().length > 0) &&
    (!showFile || uploadedFile !== null);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        {triggerLabel ?? 'New Item'}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Item</DialogTitle>
          </DialogHeader>

          {/* Type selector */}
          <div className="flex gap-2 flex-wrap">
            {TYPES.map(({ name, label, icon: Icon, color }) => (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedType(name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  selectedType === name
                    ? 'border-transparent'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                }`}
                style={
                  selectedType === name
                    ? { backgroundColor: `${color}22`, color, borderColor: `${color}44` }
                    : undefined
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <FieldLabel required>Title</FieldLabel>
              <input
                className={inputClass()}
                value={form.title}
                onChange={set('title')}
                placeholder="Item title"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <FieldLabel>Description</FieldLabel>
              <input
                className={inputClass()}
                value={form.description}
                onChange={set('description')}
                placeholder="Optional description"
              />
            </div>

            {/* URL — link type */}
            {showUrl && (
              <div>
                <FieldLabel required>URL</FieldLabel>
                <input
                  className={inputClass()}
                  type="url"
                  value={form.url}
                  onChange={set('url')}
                  placeholder="https://..."
                />
              </div>
            )}

            {/* File upload — file / image types */}
            {showFile && (
              <div>
                <FieldLabel required>
                  {selectedType === 'image' ? 'Image' : 'File'}
                </FieldLabel>
                <FileUpload
                  itemType={selectedType as 'file' | 'image'}
                  value={uploadedFile}
                  onChange={setUploadedFile}
                />
              </div>
            )}

            {/* Content — text types */}
            {showContent && (
              <div>
                <FieldLabel>Content</FieldLabel>
                {showLanguage ? (
                  <CodeEditor
                    value={form.content}
                    onChange={(val) => setForm((s) => ({ ...s, content: val }))}
                    language={form.language}
                  />
                ) : showMarkdown ? (
                  <MarkdownEditor
                    value={form.content}
                    onChange={(val) => setForm((s) => ({ ...s, content: val }))}
                    placeholder="Write markdown content..."
                  />
                ) : (
                  <textarea
                    className={`${inputClass(true)} font-mono text-xs`}
                    rows={8}
                    value={form.content}
                    onChange={set('content')}
                    placeholder="Content"
                  />
                )}
              </div>
            )}

            {/* Language — snippet / command */}
            {showLanguage && (
              <div>
                <FieldLabel>Language</FieldLabel>
                <input
                  className={inputClass()}
                  value={form.language}
                  onChange={set('language')}
                  placeholder="e.g. typescript"
                />
              </div>
            )}

            {/* Tags */}
            <div>
              <FieldLabel>Tags</FieldLabel>
              <input
                className={inputClass()}
                value={form.tags}
                onChange={set('tags')}
                placeholder="comma, separated, tags"
              />
              <p className="mt-1 text-xs text-muted-foreground">Separate tags with commas</p>
            </div>

            {/* Collections */}
            {collections.length > 0 && (
              <div>
                <FieldLabel>Collections</FieldLabel>
                <CollectionPicker
                  collections={collections}
                  selected={selectedCollectionIds}
                  onChange={setSelectedCollectionIds}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!canSubmit || saving}>
                {saving ? 'Creating…' : 'Create Item'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
