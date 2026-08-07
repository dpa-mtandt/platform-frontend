import { useState } from 'react';
import { KeyRound, Save } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { apiErrorMessage, formatDate, initials } from '@/lib/utils';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/components/ui/primitives';

export default function ProfilePage() {
  const { profile, refreshProfile, logout } = useAuth();
  const [name, setName] = useState(profile?.user.name ?? '');
  const [designation, setDesignation] = useState(profile?.user.designation ?? '');
  const [phone, setPhone] = useState(profile?.user.phone ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  if (!profile) return null;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg('');
    try {
      await api.patch('/auth/me', { name, designation, phone });
      await refreshProfile();
      setProfileMsg('Saved');
    } catch (err) {
      setProfileMsg(apiErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPw(true);
    setPwMsg('');
    setPwErr('');
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setPwMsg('Password changed. Please sign in again.');
      setTimeout(() => void logout(), 1200);
    } catch (err) {
      setPwErr(apiErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">My profile</h1>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Identity */}
        <Card className="md:col-span-1">
          <CardContent className="flex flex-col items-center py-8 text-center">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-slate-800 text-2xl font-semibold text-white">
              {initials(profile.user.name)}
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{profile.user.name}</h2>
            <p className="text-sm text-slate-500">{profile.user.email}</p>
            {profile.user.designation && <p className="mt-1 text-sm text-slate-400">{profile.user.designation}</p>}
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {profile.isSuperAdmin && <Badge tone="violet">Super Admin</Badge>}
              {profile.roles.map((r) => (
                <Badge key={r}>{r}</Badge>
              ))}
            </div>
            <div className="mt-4 w-full border-t border-slate-100 pt-4 text-left text-sm">
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Last login</span>
                <span className="text-slate-600">{formatDate(profile.user.lastLoginAt)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Modules</span>
                <span className="text-slate-600">{profile.modules.length}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Permissions</span>
                <span className="text-slate-600">{profile.isSuperAdmin ? 'All' : profile.permissions.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editable */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveProfile} className="space-y-4">
                <div>
                  <Label>Full name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Designation</Label>
                    <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Sales Executive" />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button type="submit" loading={savingProfile}>
                    <Save className="h-4 w-4" /> Save changes
                  </Button>
                  {profileMsg && <span className="text-sm text-emerald-600">{profileMsg}</span>}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={changePassword} className="space-y-4">
                <div>
                  <Label>Current password</Label>
                  <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                </div>
                <div>
                  <Label>New password</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  <p className="mt-1 text-xs text-slate-400">At least 8 characters with upper, lower and a number.</p>
                </div>
                {pwErr && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{pwErr}</p>}
                {pwMsg && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{pwMsg}</p>}
                <Button type="submit" variant="secondary" loading={savingPw}>
                  <KeyRound className="h-4 w-4" /> Update password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
