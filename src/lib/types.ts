export interface ModuleCard {
  key: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  path?: string | null;
  color?: string | null;
  sortOrder: number;
  isCore: boolean;
  /** External apps (CRM/ERP/HCM) open `externalUrl` in a new tab. */
  isExternal?: boolean;
  externalUrl?: string | null;
}

export interface SessionUser {
  id: string;
  employeeId?: string | null;
  name: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  designation?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  departmentId?: string | null;
  companyId?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
  department?: { id: string; name: string; code?: string | null } | null;
  company?: { id: string; name: string } | null;
}

export interface SessionProfile {
  user: SessionUser;
  roles: string[];
  isSuperAdmin: boolean;
  permissions: string[];
  modules: ModuleCard[];
}

export interface Role {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  isSuperAdmin: boolean;
  permissionCount?: number;
  userCount?: number;
}

export interface Permission {
  id: string;
  key: string;
  name: string;
  moduleKey: string;
  description?: string | null;
}

export interface PermissionGroup {
  module: { key: string; name: string; icon?: string | null; color?: string | null; sortOrder: number };
  permissions: Permission[];
}

export interface AdminUser extends SessionUser {
  managerId?: string | null;
  userRoles?: { role: Role }[];
  access?: { isSuperAdmin: boolean; roles: string[]; permissions: string[]; modules: string[] };
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
