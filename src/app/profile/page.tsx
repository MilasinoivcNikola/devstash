import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getProfileUser, getProfileStats } from '@/lib/db/profile';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ICON_MAP } from '@/lib/constants/item-types';
import { Package, FolderOpen, CheckCircle } from 'lucide-react';
import { ChangePasswordForm } from './ChangePasswordForm';
import { DeleteAccountDialog } from './DeleteAccountDialog';

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ passwordChanged?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');

  const params = await searchParams;
  const passwordChanged = params.passwordChanged === '1';

  const [user, stats] = await Promise.all([
    getProfileUser(session.user.id),
    getProfileStats(session.user.id),
  ]);

  if (!user) redirect('/sign-in');

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account</p>
      </div>

      {/* User Info */}
      <section className="bg-card border border-border rounded-lg p-6 flex items-center gap-5">
        <UserAvatar name={user.name} image={user.image} size={64} />
        <div className="flex flex-col gap-0.5 min-w-0">
          {user.name && (
            <p className="text-lg font-semibold text-foreground truncate">{user.name}</p>
          )}
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Member since {formatDate(user.createdAt)}
          </p>
        </div>
      </section>

      {/* Usage Stats */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-4">Usage</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-md bg-accent flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalItems}</p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-md bg-accent flex items-center justify-center shrink-0">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalCollections}</p>
              <p className="text-sm text-muted-foreground">Collections</p>
            </div>
          </div>
        </div>

        {/* Item type breakdown */}
        <div className="bg-card border border-border rounded-lg divide-y divide-border">
          {stats.itemsByType.map((type) => {
            const Icon = ICON_MAP[type.icon];
            return (
              <div key={type.name} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${type.color}22` }}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" style={{ color: type.color }} />}
                  </div>
                  <span className="text-sm text-foreground capitalize">{type.name}s</span>
                </div>
                <span className="text-sm font-medium text-foreground">{type.count}</span>
              </div>
            );
          })}
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
