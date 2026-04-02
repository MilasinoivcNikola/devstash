'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { toast } from 'sonner';
import type { EditorPreferences } from '@/lib/db/editor-preferences';
import { updateEditorPreferencesAction } from '@/app/settings/actions';

interface EditorPreferencesContextValue {
  preferences: EditorPreferences;
  updatePreference: <K extends keyof EditorPreferences>(
    key: K,
    value: EditorPreferences[K],
  ) => Promise<void>;
}

const EditorPreferencesContext = createContext<EditorPreferencesContextValue | null>(null);

export function EditorPreferencesProvider({
  initialPreferences,
  children,
}: {
  initialPreferences: EditorPreferences;
  children: ReactNode;
}) {
  const [preferences, setPreferences] = useState<EditorPreferences>(initialPreferences);

  const updatePreference = useCallback(
    async <K extends keyof EditorPreferences>(key: K, value: EditorPreferences[K]) => {
      const previous = preferences;
      const updated = { ...preferences, [key]: value };
      setPreferences(updated);

      const result = await updateEditorPreferencesAction({ [key]: value });
      if (result.success && result.data) {
        setPreferences(result.data);
        toast.success('Editor preference saved');
      } else {
        setPreferences(previous);
        toast.error(result.error ?? 'Failed to save preference');
      }
    },
    [preferences],
  );

  return (
    <EditorPreferencesContext.Provider value={{ preferences, updatePreference }}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}

export function useEditorPreferences(): EditorPreferencesContextValue {
  const ctx = useContext(EditorPreferencesContext);
  if (!ctx) {
    throw new Error('useEditorPreferences must be used within EditorPreferencesProvider');
  }
  return ctx;
}
