'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  role: 'NHAN_VIEN_KINH_DOANH' | 'KY_THUAT_IN' | 'QUAN_LY';
  roleTitle: string;
  avatar: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (username: string, password?: string, roleType?: string) => boolean;
  logout: () => void;
}

const STORAGE_KEY = 'adprintops_auth_user_v1';

const DEFAULT_USERS: Record<string, UserProfile> = {
  employee: {
    id: 'usr-001',
    username: 'employee',
    fullName: 'Nguyễn Văn Tuấn',
    role: 'NHAN_VIEN_KINH_DOANH',
    roleTitle: 'Nhân Viên Kinh Doanh & Báo Giá',
    avatar: '👨‍💼',
  },
  printer: {
    id: 'usr-002',
    username: 'printer',
    fullName: 'Trần Văn Hùng',
    role: 'KY_THUAT_IN',
    roleTitle: 'Kỹ Thuật Viên Máy In & Xếp Phủ',
    avatar: '🖨️',
  },
  admin: {
    id: 'usr-003',
    username: 'admin',
    fullName: 'Lê Thị Mai (Quản Lý)',
    role: 'QUAN_LY',
    roleTitle: 'Quản Lý Xưởng In Ấn & Quảng Cáo',
    avatar: '👑',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Tự động đăng nhập mặc định làm Nhân viên Kinh doanh nếu chưa đăng nhập
        setUser(DEFAULT_USERS.employee);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS.employee));
      }
    } catch {
      setUser(DEFAULT_USERS.employee);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (username: string, password = '', roleType = 'employee'): boolean => {
    const cleanUser = username.trim().toLowerCase();
    let profile: UserProfile;

    if (DEFAULT_USERS[cleanUser]) {
      profile = DEFAULT_USERS[cleanUser];
    } else if (DEFAULT_USERS[roleType]) {
      profile = {
        ...DEFAULT_USERS[roleType],
        username: cleanUser || DEFAULT_USERS[roleType].username,
        fullName: username || DEFAULT_USERS[roleType].fullName,
      };
    } else {
      profile = {
        id: `usr-${Date.now()}`,
        username: cleanUser || 'nhanvien',
        fullName: username || 'Nhân Viên Xưởng In',
        role: 'NHAN_VIEN_KINH_DOANH',
        roleTitle: 'Nhân Viên Kinh Doanh & Báo Giá',
        avatar: '👤',
      };
    }

    setUser(profile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
    return true;
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
