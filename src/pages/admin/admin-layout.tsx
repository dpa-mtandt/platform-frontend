import { NavLink, Outlet } from 'react-router-dom';
import { Building2, ClipboardList, Layers, ScrollText, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/admin/users', label: 'Users', icon: Users, perms: ['platform.users.view'] },
  { to: '/admin/roles', label: 'Roles & Permissions', icon: ShieldCheck, perms: ['platform.roles.view'] },
  { to: '/admin/modules', label: 'Modules', icon: Layers, perms: ['platform.modules.view'] },
  { to: '/admin/organization', label: 'Organization', icon: Building2, perms: ['platform.org.manage'] },
  { to: '/admin/audit', label: 'Audit Log', icon: ScrollText, perms: ['platform.audit.view'] },
];

export default function AdminLayout() {
  const { canAny } = useAuth();
  const visible = TABS.filter((t) => canAny(...t.perms));

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white">
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Administration</h1>
          <p className="text-sm text-slate-500">Manage users, roles, module access and audit.</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200">
        {visible.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              cn(
                '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium',
                isActive ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800',
              )
            }
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
