'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Printer,
  Lock,
  User,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('employee');
  const [password, setPassword] = useState('123456');
  const [roleType, setRoleType] = useState('employee');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập.');
      return;
    }

    setLoading(true);
    setError(null);

    setTimeout(() => {
      login(username, password, roleType);
      setLoading(false);
      router.push('/employee');
    }, 300);
  };

  const handleQuickSelectRole = (userKey: string, name: string) => {
    setUsername(userKey);
    setPassword('123456');
    setRoleType(userKey);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
        {/* Header Login Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-center relative border-b border-indigo-900/60">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-zinc-950 flex items-center justify-center mx-auto mb-3 shadow-lg font-black">
            <Printer className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            AdPrintOps System <Sparkles className="w-4 h-4 text-amber-400" />
          </h1>
          <p className="text-xs text-indigo-200 mt-1">
            Đăng Nhập Hệ Thống Quản Lý In Ấn & Báo Giá Khoán Doanh Nghiệp
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-semibold text-xs animate-in fade-in">
              ⚠️ {error}
            </div>
          )}

          {/* Quick Login Accounts Selection */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
              Chọn tài khoản đăng nhập nhanh:
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelectRole('employee', 'Kinh Doanh')}
                className={`p-2.5 rounded-xl border text-center font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                  username === 'employee'
                    ? 'bg-amber-100 border-amber-500 text-amber-950 ring-2 ring-amber-500/20'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <span className="text-base">👨‍💼</span>
                <span className="text-[10px]">Kinh Doanh</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelectRole('printer', 'Kỹ Thuật')}
                className={`p-2.5 rounded-xl border text-center font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                  username === 'printer'
                    ? 'bg-indigo-100 border-indigo-500 text-indigo-950 ring-2 ring-indigo-500/20'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <span className="text-base">🖨️</span>
                <span className="text-[10px]">Kỹ Thuật</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelectRole('admin', 'Quản Lý')}
                className={`p-2.5 rounded-xl border text-center font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                  username === 'admin'
                    ? 'bg-purple-100 border-purple-500 text-purple-950 ring-2 ring-purple-500/20'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <span className="text-base">👑</span>
                <span className="text-[10px]">Quản Lý</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-zinc-700 font-bold mb-1">Tên Đăng Nhập / Họ Tên:</label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập (vd: employee, admin)"
                className="w-full pl-9 pr-4 py-2.5 border border-zinc-300 rounded-xl font-semibold text-zinc-900 focus:ring-2 focus:ring-amber-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-700 font-bold mb-1">Mật Khẩu:</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 border border-zinc-300 rounded-xl font-mono text-zinc-900 focus:ring-2 focus:ring-amber-500 text-xs"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Đang xử lý đăng nhập...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  ĐĂNG NHẬP HỆ THỐNG
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="p-4 bg-zinc-50 border-t border-zinc-100 text-center text-[10px] text-zinc-500">
          Chức năng đăng nhập cơ bản — AdPrintOps Workspace
        </div>
      </div>
    </div>
  );
}
