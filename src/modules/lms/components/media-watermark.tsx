import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';

// Kept out of the very bottom so it never sits over a video control bar.
const POSITIONS = [
  { top: '9%', left: '6%' },
  { top: '9%', right: '6%' },
  { top: '42%', right: '8%' },
  { top: '62%', left: '8%' },
  { top: '32%', left: '38%' },
] as const;

/**
 * A faint, slowly-drifting overlay stamping the viewer's name + email onto
 * protected media. It does not prevent a screen recording, but it traces any leak
 * back to the account that was watching. Non-interactive (pointer-events-none) so
 * it never blocks the player controls.
 */
export function MediaWatermark() {
  const { profile } = useAuth();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % POSITIONS.length), 7000);
    return () => clearInterval(t);
  }, []);

  if (!profile?.user) return null;
  const label = `${profile.user.name} · ${profile.user.email}`;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <span
        className="absolute whitespace-nowrap rounded bg-black/25 px-2 py-0.5 text-[11px] font-medium text-white/60 backdrop-blur-[1px] transition-all duration-1000 ease-in-out"
        style={POSITIONS[idx]}
      >
        {label}
      </span>
    </div>
  );
}
