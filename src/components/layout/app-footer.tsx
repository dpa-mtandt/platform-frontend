/** Shared site footer, rendered at the bottom of every page via the app shell. */
export function AppFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-slate-500 sm:px-6 2xl:max-w-[110rem]">
        <p>© {year} MTANDT Group</p>
        <p className="mt-0.5">Built and Managed by IT Team</p>
      </div>
    </footer>
  );
}
