'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardList,
  Palette,
  Calculator,
  ChevronRight,
  Menu,
  X,
  UserCheck,
  Sparkles,
  CheckCircle2,
  HardDrive,
  ShoppingCart,
  LogOut,
} from 'lucide-react';

import { useCart } from '@/features/cart/context/CartContext';
import { useAuth } from '@/features/auth/context/AuthContext';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const employeeNavItems: SidebarItem[] = [
  {
    name: 'Quản Lý Đơn & Xếp Phủ',
    href: '/employee',
    icon: ClipboardList,
  },
  {
    name: 'Quản Lý Giỏ Hàng',
    href: '/employee/cart',
    icon: ShoppingCart,
  },
  {
    name: 'Tệp Thiết Kế Corel',
    href: '/employee/design',
    icon: Palette,
  },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col md:flex-row text-zinc-900 relative font-sans">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-indigo-950 text-white p-4 flex items-center justify-between shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-2 font-bold text-sm tracking-wide">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
            <UserCheck className="w-4 h-4" />
          </div>
          <span>Employee Portal</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-zinc-300 hover:text-white rounded-lg hover:bg-indigo-900 transition"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Left Employee Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-indigo-950 text-white flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Header Brand */}
          <div className="p-5 border-b border-indigo-900/80 flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-zinc-950 shadow-lg shadow-amber-500/20 font-black">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-base tracking-tight text-white flex items-center gap-1">
                AdPrintOps
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h1>
              <p className="text-[11px] text-indigo-300 font-medium">Employee Central Hub</p>
            </div>
          </div>

          {/* User Profile Card */}
          {user && (
            <div className="p-3 mx-3 mt-3 rounded-2xl bg-indigo-900/50 border border-indigo-800/60 flex items-center gap-3">
              <span className="text-xl shrink-0 p-1.5 rounded-xl bg-indigo-950 border border-indigo-700">{user.avatar}</span>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-white truncate">{user.fullName}</div>
                <div className="text-[10px] text-amber-400 font-semibold truncate">{user.roleTitle}</div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-indigo-300/70 uppercase tracking-wider">
              Nhiệm Vụ Sản Xuất
            </div>

            {employeeNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition group ${
                    isActive
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-black'
                      : 'text-indigo-200/80 hover:text-white hover:bg-indigo-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition ${
                        isActive ? 'text-zinc-950' : 'text-indigo-300 group-hover:text-white'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition ${
                      isActive ? 'opacity-100' : ''
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom System Status & Logout */}
        <div className="p-3 border-t border-indigo-900/80 space-y-2">
          <div className="p-3 bg-indigo-900/40 rounded-2xl text-[11px] space-y-1 text-indigo-300 border border-indigo-900/60 font-mono">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5 text-indigo-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Hệ Thống
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">ONLINE</span>
            </div>
            <div className="text-[10px] text-indigo-300 truncate flex items-center gap-1 mt-1">
              <HardDrive className="w-3 h-3 shrink-0" /> D:\Design
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold bg-red-600/80 hover:bg-red-600 text-white transition cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4 text-white" />
            <span>Đăng Xuất Tài Khoản</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
    </div>
  );
}
