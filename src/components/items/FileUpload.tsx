'use client';

import { useCallback, useRef, useState } from 'react';
import { UploadCloud, X, FileText, Image as ImageIcon } from 'lucide-react';

export interface UploadedFile {
  key: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  previewUrl?: string; // local object URL for image preview
}

interface FileUploadProps {
  itemType: 'file' | 'image';
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
}

const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.gif,.webp,.svg';
const FILE_ACCEPT = '.pdf,.txt,.md,.json,.yaml,.yml,.xml,.csv,.toml,.ini';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({ itemType, value, onChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    (file: File) => {
      setError(null);
      setProgress(0);

      // Revoke previous preview URL
      if (value?.previewUrl) {
        URL.revokeObjectURL(value.previewUrl);
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('itemType', itemType);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        setProgress(null);
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          const previewUrl =
            file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
          onChange({ ...data, previewUrl });
        } else {
          const data = JSON.parse(xhr.responseText);
          setError(data.error ?? 'Upload failed');
        }
      };

      xhr.onerror = () => {
        setProgress(null);
        setError('Upload failed');
      };

      xhr.send(formData);
    },
    [itemType, onChange, value?.previewUrl]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      uploadFile(files[0]);
    },
    [uploadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  function handleClear() {
    if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl);
    onChange(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const accept = itemType === 'image' ? IMAGE_ACCEPT : FILE_ACCEPT;
  const isUploading = progress !== null;

  if (value) {
    return (
      <div className="rounded-md border border-border bg-background overflow-hidden">
        {value.previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value.previewUrl}
            alt={value.fileName}
            className="w-full max-h-48 object-contain bg-muted/30"
          />
        )}
        <div className="flex items-center gap-3 px-3 py-2.5">
          {itemType === 'image' ? (
            <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">{value.fileName}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(value.fileSize)}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            aria-label="Remove file"
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        disabled={isUploading}
        className={`w-full rounded-md border-2 border-dashed px-4 py-8 flex flex-col items-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed ${
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-foreground/30 hover:bg-accent/20'
        }`}
      >
        {isUploading ? (
          <>
            <div className="w-full max-w-xs bg-accent rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Uploading… {progress}%</p>
          </>
        ) : (
          <>
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              <span className="font-medium text-foreground">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              {itemType === 'image' ? 'PNG, JPG, GIF, WEBP, SVG up to 5 MB' : 'PDF, TXT, MD, JSON, YAML, XML, CSV up to 10 MB'}
            </p>
          </>
        )}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
