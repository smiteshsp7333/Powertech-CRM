'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, ModuleName, PermissionAction } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (module: ModuleName, action: PermissionAction) => boolean;
  switchRoleDemo: (roleEmail: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('powertech_token');
    const savedUser = localStorage.getItem('powertech_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.removeItem('powertech_token');
        localStorage.removeItem('powertech_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    if (res.success && res.data) {
      const accessToken = res.data.accessToken;
      const userProfile: UserProfile = {
        id: res.data.user.id,
        email: res.data.user.email,
        name: res.data.user.name,
        phone: res.data.user.phone,
        roleId: res.data.user.role.id,
        roleName: res.data.user.role.name,
        isSystem: res.data.user.role.isSystem,
        permissions: res.data.user.role.permissions.map((p: any) => ({
          module: p.module,
          canView: p.canView,
          canCreate: p.canCreate,
          canEdit: p.canEdit,
          canDelete: p.canDelete,
          canExport: p.canExport,
          dataScope: p.dataScope,
        })),
      };

      setToken(accessToken);
      setUser(userProfile);
      localStorage.setItem('powertech_token', accessToken);
      localStorage.setItem('powertech_user', JSON.stringify(userProfile));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('powertech_token');
    localStorage.removeItem('powertech_user');
    window.location.href = '/login';
  };

  const hasPermission = (module: ModuleName, action: PermissionAction): boolean => {
    if (!user) return false;
    if (user.roleName === 'Super Admin' || user.isSystem) return true;

    const perm = user.permissions.find((p) => p.module === module);
    if (!perm) return false;

    switch (action) {
      case 'view':
        return perm.canView;
      case 'create':
        return perm.canCreate;
      case 'edit':
        return perm.canEdit;
      case 'delete':
        return perm.canDelete;
      case 'export':
        return perm.canExport;
      default:
        return false;
    }
  };

  const switchRoleDemo = async (roleEmail: string) => {
    await login(roleEmail, 'Password@123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        hasPermission,
        switchRoleDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
