import { Admin } from '../types';

export const isAdminRole = (admin?: Pick<Admin, 'role'> | null): boolean => admin?.role === 'admin';

export const getAdminDisplayName = (admin?: Partial<Admin> | null): string => (
  admin?.full_name?.trim() ||
  admin?.nickname?.trim() ||
  admin?.email?.trim() ||
  admin?.phone?.trim() ||
  'Admin'
);

export const getAdminInitial = (admin?: Partial<Admin> | null): string => (
  getAdminDisplayName(admin).charAt(0).toUpperCase() || 'A'
);
