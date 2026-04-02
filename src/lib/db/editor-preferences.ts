import { prisma } from '@/lib/prisma';

export interface EditorPreferences {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  theme: string;
}

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 12,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: 'vs-dark',
};

export async function getEditorPreferences(userId: string): Promise<EditorPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { editorPreferences: true },
  });

  if (!user?.editorPreferences) return DEFAULT_EDITOR_PREFERENCES;

  return {
    ...DEFAULT_EDITOR_PREFERENCES,
    ...(user.editorPreferences as Partial<EditorPreferences>),
  };
}

export async function updateEditorPreferences(
  userId: string,
  preferences: Partial<EditorPreferences>,
): Promise<EditorPreferences> {
  const current = await getEditorPreferences(userId);
  const merged = { ...current, ...preferences };

  await prisma.user.update({
    where: { id: userId },
    data: { editorPreferences: merged },
  });

  return merged;
}
