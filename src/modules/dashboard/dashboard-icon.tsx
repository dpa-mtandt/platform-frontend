import { BarChart3, Contact, Landmark, LayoutDashboard, TrendingUp, Truck, Users, type LucideIcon } from 'lucide-react';

const MAP: Record<string, LucideIcon> = { Truck, TrendingUp, Landmark, Users, Contact, BarChart3, LayoutDashboard };

export const DASHBOARD_ICON_OPTIONS = ['BarChart3', 'Truck', 'TrendingUp', 'Landmark', 'Users', 'Contact', 'LayoutDashboard'];

export function DashboardIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && MAP[name]) || LayoutDashboard;
  return <Icon className={className} />;
}
