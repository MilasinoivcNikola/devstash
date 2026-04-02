import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getProfileUser } from '@/lib/db/profile';
import { CheckCircle } from 'lucide-react';
import { ChangePasswordForm } from './ChangePasswordForm';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { EditorPreferencesForm } from './EditorPreferencesForm';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ passwordChanged?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const params = await searchParams;
  const passwordChanged = params.passwordChanged === '1';

  const user = await getProfileUser(session.user.id);
  if (!user) redirect('/sign-in');

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account settings</p>
      </div>

      {/* Editor Preferences */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-4">Editor</h2>
        <div className="border border-border rounded-lg p-4">
          <EditorPreferencesForm />
        </div>
      </section>

      {/* Account Actions */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-4">Account</h2>
        <div className="flex flex-col gap-4">
          {passwordChanged && (
            <div className="flex items-center gap-2 text-sm text-emerald-500">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Password changed successfully.
            </div>
          )}

          {user.hasPassword && <ChangePasswordForm />}

          <div className="border border-destructive/30 rounded-lg p-4 flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Delete Account</p>
            <p className="text-xs text-muted-foreground">
              Permanently remove your account and all data. This cannot be undone.
            </p>
            <div className="mt-2">
              <DeleteAccountDialog />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
