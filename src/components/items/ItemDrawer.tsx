'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Star, Pin, Copy, Pencil, Trash2, FolderOpen, Calendar, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { updateItem, deleteItem } from '@/actions/items';
import type { ItemDetail } from '@/lib/db/items';
import CodeEditor from '@/components/items/CodeEditor';
import MarkdownEditor from '@/components/items/MarkdownEditor';

const CONTENT_TYPES = new Set(['snippet', 'prompt', 'command', 'note']);
const LANGUAGE_TYPES = new Set(['snippet', 'command']);
const MARKDOWN_TYPES = new Set(['prompt', 'note']);

interface ItemDrawerProps {
  itemId: string | null;
  onClose: () => void;
}

interface EditState {
  title: string;
  description: string;
  content: string;
  url: string;
  language: string;
  tags: string;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-accent ${className ?? ''}`} />;
}

function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-5 p-1">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  active,
  activeColor,
  children,
  label,
  variant,
  disabled,
}: {
  onClick?: () => void;
  active?: boolean;
  activeColor?: string;
  children: React.ReactNode;
  label: string;
  variant?: 'default' | 'danger' | 'primary';
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed
        ${variant === 'danger'
          ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
          : variant === 'primary'
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : active
              ? ''
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}
      style={active && activeColor ? { color: activeColor } : undefined}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
      {children}
    </h3>
  );
}

function inputClass(multiline?: boolean) {
  const base =
    'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring';
  return multiline ? `${base} resize-none` : base;
}

export default function ItemDrawer({ itemId, onClose }: ItemDrawerProps) {
  const router = useRouter();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editState, setEditState] = useState<EditState>({
    title: '',
    description: '',
    content: '',
    url: '',
    language: '',
    tags: '',
  });

  useEffect(() => {
    if (!itemId) {
      setItem(null);
      setEditMode(false);
      return;
    }
    setLoading(true);
    setItem(null);
    setEditMode(false);
    fetch(`/api/items/${itemId}`)
      .then((r) => r.json())
      .then((data) => setItem(data))
      .finally(() => setLoading(false));
  }, [itemId]);

  function enterEditMode() {
    if (!item) return;
    setEditState({
      title: item.title,
      description: item.description ?? '',
      content: item.content ?? '',
      url: item.url ?? '',
      language: item.language ?? '',
      tags: item.tags.join(', '),
    });
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
  }

  async function handleSave() {
    if (!item || !itemId) return;
    setSaving(true);

    const tags = editState.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const result = await updateItem(itemId, {
      title: editState.title,
      description: editState.description || null,
      content: editState.content || null,
      url: editState.url || null,
      language: editState.language || null,
      tags,
    });

    setSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setItem(result.data);
    setEditMode(false);
    toast.success('Item saved');
    router.refresh();
  }

  async function handleDelete() {
    if (!itemId) return;
    setDeleting(true);
    const result = await deleteItem(itemId);
    setDeleting(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setConfirmDelete(false);
    toast.success('Item deleted');
    router.refresh();
    onClose();
  }

  const typeName = item?.itemType.name ?? '';
  const showContent = CONTENT_TYPES.has(typeName);
  const showLanguage = LANGUAGE_TYPES.has(typeName);
  const showMarkdown = MARKDOWN_TYPES.has(typeName);
  const showUrl = typeName === 'link';

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <>
    <Sheet open={!!itemId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0 p-0">
        {loading || (!item && !!itemId) ? (
          <div className="p-6">
            <DrawerSkeleton />
          </div>
        ) : item ? (
          <>
            {/* Header */}
            <SheetHeader className="px-6 pt-6 pb-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${item.itemType.color}22`,
                    color: item.itemType.color,
                  }}
                >
                  {item.itemType.name}
                </span>
                {!editMode && item.language && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                    {item.language}
                  </span>
                )}
              </div>
              <SheetTitle className="text-base font-semibold leading-snug text-left">
                {editMode ? (
                  <input
                    className={inputClass()}
                    value={editState.title}
                    onChange={(e) => setEditState((s) => ({ ...s, title: e.target.value }))}
                    placeholder="Title"
                    autoFocus
                  />
                ) : (
                  item.title
                )}
              </SheetTitle>
            </SheetHeader>

            {/* Action bar */}
            <div className="flex items-center gap-1 px-4 py-3 border-b border-border mt-3">
              {editMode ? (
                <>
                  <ActionButton
                    label="Save"
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving || !editState.title.trim()}
                  >
                    <Save className="h-3.5 w-3.5" />
                    {saving ? 'Saving…' : 'Save'}
                  </ActionButton>
                  <ActionButton label="Cancel" onClick={cancelEdit} disabled={saving}>
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </ActionButton>
                </>
              ) : (
                <>
                  <ActionButton label="Favorite" active={item.isFavorite} activeColor="#facc15">
                    <Star
                      className="h-3.5 w-3.5"
                      fill={item.isFavorite ? '#facc15' : 'none'}
                      stroke={item.isFavorite ? '#facc15' : 'currentColor'}
                    />
                    Favorite
                  </ActionButton>
                  <ActionButton label="Pin" active={item.isPinned} activeColor="hsl(var(--foreground))">
                    <Pin className="h-3.5 w-3.5" />
                    Pin
                  </ActionButton>
                  <ActionButton label="Copy content">
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </ActionButton>
                  <div className="ml-auto flex items-center gap-1">
                    <ActionButton label="Edit" onClick={enterEditMode}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </ActionButton>
                    <ActionButton label="Delete" variant="danger" onClick={() => setConfirmDelete(true)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </ActionButton>
                  </div>
                </>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 px-6 py-5 space-y-6">
              {editMode ? (
                <>
                  {/* Description — always shown in edit mode */}
                  <section>
                    <FieldLabel>Description</FieldLabel>
                    <textarea
                      className={inputClass(true)}
                      rows={3}
                      value={editState.description}
                      onChange={(e) => setEditState((s) => ({ ...s, description: e.target.value }))}
                      placeholder="Optional description"
                    />
                  </section>

                  {/* Content — type-specific */}
                  {showContent && (
                    <section>
                      <FieldLabel>Content</FieldLabel>
                      {showLanguage ? (
                        <CodeEditor
                          value={editState.content}
                          onChange={(val) => setEditState((s) => ({ ...s, content: val }))}
                          language={editState.language}
                        />
                      ) : showMarkdown ? (
                        <MarkdownEditor
                          value={editState.content}
                          onChange={(val) => setEditState((s) => ({ ...s, content: val }))}
                          placeholder="Write markdown content..."
                        />
                      ) : (
                        <textarea
                          className={`${inputClass(true)} font-mono text-xs`}
                          rows={10}
                          value={editState.content}
                          onChange={(e) => setEditState((s) => ({ ...s, content: e.target.value }))}
                          placeholder="Content"
                        />
                      )}
                    </section>
                  )}

                  {/* URL — link type */}
                  {showUrl && (
                    <section>
                      <FieldLabel>URL</FieldLabel>
                      <input
                        className={inputClass()}
                        type="url"
                        value={editState.url}
                        onChange={(e) => setEditState((s) => ({ ...s, url: e.target.value }))}
                        placeholder="https://..."
                      />
                    </section>
                  )}

                  {/* Language — snippet / command */}
                  {showLanguage && (
                    <section>
                      <FieldLabel>Language</FieldLabel>
                      <input
                        className={inputClass()}
                        value={editState.language}
                        onChange={(e) => setEditState((s) => ({ ...s, language: e.target.value }))}
                        placeholder="e.g. typescript"
                      />
                    </section>
                  )}

                  {/* Tags */}
                  <section>
                    <FieldLabel>Tags</FieldLabel>
                    <input
                      className={inputClass()}
                      value={editState.tags}
                      onChange={(e) => setEditState((s) => ({ ...s, tags: e.target.value }))}
                      placeholder="comma, separated, tags"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Separate tags with commas</p>
                  </section>
                </>
              ) : (
                <>
                  {/* Description */}
                  {item.description && (
                    <section>
                      <FieldLabel>Description</FieldLabel>
                      <p className="text-sm text-foreground leading-relaxed">{item.description}</p>
                    </section>
                  )}

                  {/* Content preview */}
                  {item.content && (
                    <section>
                      <FieldLabel>Content</FieldLabel>
                      {showLanguage ? (
                        <CodeEditor
                          value={item.content}
                          language={item.language ?? undefined}
                          readOnly
                        />
                      ) : showMarkdown ? (
                        <MarkdownEditor
                          value={item.content}
                          readOnly
                        />
                      ) : (
                        <div className="rounded-md overflow-hidden border border-border max-h-96 overflow-y-auto">
                          <div className="flex min-w-0">
                            <div
                              className="select-none text-right pr-3 pl-3 py-4 text-xs font-mono leading-5 shrink-0"
                              style={{ color: 'hsl(var(--muted-foreground) / 0.4)', backgroundColor: 'hsl(var(--muted) / 0.6)' }}
                              aria-hidden
                            >
                              {item.content.split('\n').map((_, i) => (
                                <div key={i}>{i + 1}</div>
                              ))}
                            </div>
                            <pre
                              className="flex-1 py-4 pr-4 pl-3 text-xs font-mono leading-5 text-foreground overflow-x-auto whitespace-pre"
                              style={{ backgroundColor: 'hsl(var(--muted) / 0.35)' }}
                            >
                              {item.content}
                            </pre>
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  {/* URL */}
                  {item.url && (
                    <section>
                      <FieldLabel>URL</FieldLabel>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:underline break-all"
                      >
                        {item.url}
                      </a>
                    </section>
                  )}

                  {/* Tags */}
                  {item.tags.length > 0 && (
                    <section>
                      <FieldLabel>Tags</FieldLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-accent text-accent-foreground rounded px-2 py-0.5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Collections */}
                  {item.collections.length > 0 && (
                    <section>
                      <FieldLabel>Collections</FieldLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {item.collections.map((col) => (
                          <span
                            key={col.id}
                            className="inline-flex items-center gap-1 text-xs bg-accent text-accent-foreground rounded px-2 py-0.5"
                          >
                            <FolderOpen className="h-3 w-3" />
                            {col.name}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Details */}
                  <section>
                    <FieldLabel>Details</FieldLabel>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-foreground/60">Created</span>
                        <span className="ml-auto text-foreground">{formatDate(item.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-foreground/60">Updated</span>
                        <span className="ml-auto text-foreground">{formatDate(item.updatedAt)}</span>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>

    <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete item?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The item will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
