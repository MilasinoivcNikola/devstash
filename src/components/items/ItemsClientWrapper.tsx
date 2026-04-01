'use client';

import { useState } from 'react';
import ItemDrawer from './ItemDrawer';
import type { ItemWithMeta } from '@/lib/db/items';
import { ICON_MAP } from '@/lib/constants/item-types';
import { Star, Pin, Download, Copy, Check, FileText, FileCode, FileArchive, FileImage, FileVideo, FileAudio, File } from 'lucide-react';

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileName: string | null) {
  if (!fileName) return File;
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext)) return FileImage;
  if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return FileVideo;
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) return FileAudio;
  if (['zip', 'tar', 'gz', 'bz2', 'rar', '7z'].includes(ext)) return FileArchive;
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'cs', 'php', 'sh', 'html', 'css', 'json', 'yaml', 'yml', 'toml', 'xml'].includes(ext)) return FileCode;
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'csv', 'xls', 'xlsx'].includes(ext)) return FileText;
  return File;
}

function FileListRow({
  item,
  onClick,
}: {
  item: ItemWithMeta;
  onClick: () => void;
}) {
  const FileIcon = getFileIcon(item.fileName);
  const downloadUrl = item.fileUrl
    ? `/api/download?key=${encodeURIComponent(item.fileUrl)}&download=1`
    : null;

  return (
    <button
      onClick={onClick}
      className="group bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-4 w-full text-left hover:bg-accent/40 transition-colors cursor-pointer"
    >
      <div className="h-9 w-9 rounded-md flex items-center justify-center shrink-0 bg-muted">
        <FileIcon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.fileName ?? item.title}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5 sm:hidden">
          {formatFileSize(item.fileSize)} · {formatDate(item.createdAt)}
        </p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0 hidden sm:block w-20 text-right">
        {formatFileSize(item.fileSize)}
      </span>
      <span className="text-xs text-muted-foreground shrink-0 hidden sm:block w-24 text-right">
        {formatDate(item.createdAt)}
      </span>
      {downloadUrl && (
        <a
          href={downloadUrl}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Download"
        >
          <Download className="h-4 w-4" />
        </a>
      )}
    </button>
  );
}

function ImageThumbnailCard({
  item,
  onClick,
}: {
  item: ItemWithMeta;
  onClick: () => void;
}) {
  const src = item.fileUrl ? `/api/download?key=${encodeURIComponent(item.fileUrl)}` : null;

  return (
    <button
      onClick={onClick}
      className="group bg-card border border-border rounded-lg overflow-hidden w-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="aspect-video overflow-hidden bg-muted">
        {src ? (
          <img
            src={src}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
      </div>
      <div className="px-3 py-2">
        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
        )}
      </div>
    </button>
  );
}

function ClickableItemCard({
  item,
  onClick,
  showTypeBadge,
}: {
  item: ItemWithMeta;
  onClick: () => void;
  showTypeBadge?: boolean;
}) {
  const Icon = ICON_MAP[item.itemType.icon];
  const [copied, setCopied] = useState(false);

  const copyValue = item.content ?? item.url ?? null;

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    if (!copyValue) return;
    navigator.clipboard.writeText(copyValue).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="group bg-card border border-border rounded-lg px-4 py-3 flex items-start gap-3 border-l-[3px] w-full text-left hover:bg-accent/40 transition-colors cursor-pointer"
      style={{ borderLeftColor: item.itemType.color }}
    >
      <div
        className="h-8 w-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: `${item.itemType.color}22` }}
      >
        {Icon && <Icon className="h-4 w-4" style={{ color: item.itemType.color }} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground truncate">{item.title}</span>
          {item.isFavorite && (
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" />
          )}
          {item.isPinned && (
            <Pin className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {showTypeBadge && (
            <span
              className="text-xs rounded px-1.5 py-0.5 font-medium"
              style={{
                backgroundColor: `${item.itemType.color}22`,
                color: item.itemType.color,
              }}
            >
              {item.itemType.name}
            </span>
          )}
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-accent text-accent-foreground rounded px-1.5 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
        <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
        {copyValue && (
          <div
            role="button"
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Copy"
          >
            {copied
              ? <Check className="h-3 w-3 text-green-500" />
              : <Copy className="h-3 w-3" />
            }
          </div>
        )}
      </div>
    </div>
  );
}

interface ItemsGridWrapperProps {
  items: ItemWithMeta[];
  showTypeBadge?: boolean;
  layout?: 'grid' | 'list' | 'gallery' | 'file-list';
}

export function ItemsGridWrapper({ items, showTypeBadge, layout = 'grid' }: ItemsGridWrapperProps) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  return (
    <>
      {layout === 'file-list' && (
        <div className="flex flex-col gap-1.5">
          {items.map((item) => (
            <FileListRow
              key={item.id}
              item={item}
              onClick={() => setActiveItemId(item.id)}
            />
          ))}
        </div>
      )}
      {layout !== 'file-list' && (
        <div
          className={
            layout === 'gallery' || layout === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'
              : 'flex flex-col gap-3'
          }
        >
          {items.map((item) =>
            layout === 'gallery' ? (
              <ImageThumbnailCard
                key={item.id}
                item={item}
                onClick={() => setActiveItemId(item.id)}
              />
            ) : (
              <ClickableItemCard
                key={item.id}
                item={item}
                showTypeBadge={showTypeBadge}
                onClick={() => setActiveItemId(item.id)}
              />
            )
          )}
        </div>
      )}
      <ItemDrawer itemId={activeItemId} onClose={() => setActiveItemId(null)} />
    </>
  );
}
