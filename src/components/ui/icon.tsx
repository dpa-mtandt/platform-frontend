import {
  ShieldCheck,
  GraduationCap,
  BarChart3,
  MessageSquareHeart,
  FileBarChart,
  LayoutGrid,
  Contact,
  Boxes,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  ShieldCheck,
  GraduationCap,
  BarChart3,
  MessageSquareHeart,
  FileBarChart,
  LayoutGrid,
  Contact,
  Boxes,
  UsersRound,
};

/** Render a module's lucide icon by its stored name, falling back to a grid icon. */
export function ModuleIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && MAP[name]) || LayoutGrid;
  return <Icon className={className} />;
}
