import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ExternalLink, LayoutGrid, LogOut, Menu, ShieldCheck, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { ModuleIcon } from '@/components/ui/icon';
import { MtandtLogo } from '@/components/ui/mtandt-logo';
import { BrandBackground } from '@/components/layout/brand-background';
import { AppFooter } from '@/components/layout/app-footer';
import { cn, initials } from '@/lib/utils';

export default function AppShell() {
  const { profile, logout, hasModule } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Close the mobile nav whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const modules = (profile?.modules ?? []).filter((m) => m.key !== 'PLATFORM');
  const primaryRole = profile?.roles[0];

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const desktopNavClass = ({ isActive }: { isActive: boolean }) =>
    cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium', isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900');
  const mobileNavClass = ({ isActive }: { isActive: boolean }) =>
    cn('flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium', isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50');

  return (
    <div className="relative flex min-h-screen flex-col">
      <BrandBackground />
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center gap-3 px-4 sm:gap-5 sm:px-6 2xl:max-w-[110rem]">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="-ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Brand — natural ratio, height tuned so SINCE 1974 stays legible */}
          <Link to="/" className="flex shrink-0 items-center py-1">
            <MtandtLogo className="h-10 w-auto object-contain sm:h-12" />
          </Link>

          {/* Module nav — desktop */}
          <nav className="ml-1 hidden items-center gap-1 md:flex">
            <NavLink to="/" end className={desktopNavClass}>
              <LayoutGrid className="h-4 w-4" /> Home
            </NavLink>
            {modules.map((m) =>
              m.isExternal && m.externalUrl ? (
                <a key={m.key} href={m.externalUrl} target="_blank" rel="noopener noreferrer" className={desktopNavClass({ isActive: false })}>
                  <ModuleIcon name={m.icon} className="h-4 w-4" /> {m.name}
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
              ) : (
                <NavLink key={m.key} to={m.path || '/'} className={desktopNavClass}>
                  <ModuleIcon name={m.icon} className="h-4 w-4" /> {m.name}
                </NavLink>
              ),
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {hasModule('PLATFORM') && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  cn('hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium sm:flex', isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')
                }
              >
                <ShieldCheck className="h-4 w-4" /> Admin
              </NavLink>
            )}

            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-slate-100"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-800 text-xs font-semibold text-white">
                  {profile ? initials(profile.user.name) : '?'}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-medium leading-tight text-slate-900">{profile?.user.name}</span>
                  <span className="block text-xs leading-tight text-slate-400">{primaryRole}</span>
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-sm font-medium text-slate-900">{profile?.user.name}</p>
                    <p className="truncate text-xs text-slate-500">{profile?.user.email}</p>
                  </div>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <UserIcon className="h-4 w-4" /> My profile
                  </Link>
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Module nav — mobile drawer */}
        {mobileOpen && (
          <nav className="space-y-0.5 border-t border-slate-200 bg-white px-3 py-2 md:hidden">
            <NavLink to="/" end onClick={() => setMobileOpen(false)} className={mobileNavClass}>
              <LayoutGrid className="h-4 w-4" /> Home
            </NavLink>
            {modules.map((m) =>
              m.isExternal && m.externalUrl ? (
                <a key={m.key} href={m.externalUrl} target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className={mobileNavClass({ isActive: false })}>
                  <ModuleIcon name={m.icon} className="h-4 w-4" /> {m.name}
                  <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-50" />
                </a>
              ) : (
                <NavLink key={m.key} to={m.path || '/'} onClick={() => setMobileOpen(false)} className={mobileNavClass}>
                  <ModuleIcon name={m.icon} className="h-4 w-4" /> {m.name}
                </NavLink>
              ),
            )}
            {hasModule('PLATFORM') && (
              <NavLink
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn('flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium', isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50')
                }
              >
                <ShieldCheck className="h-4 w-4" /> Admin
              </NavLink>
            )}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 2xl:max-w-[110rem]">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}
