import React from 'react';
import { AdminPricingManagement } from '@/features/pricing';

export const metadata = {
  title: 'Quản Lý Bảng Giá & Đơn Giá | AdPrintOps Admin',
  description: 'Giao diện quản trị quy tắc bậc thang và hệ số đơn giá vật liệu in ấn',
};

export default function AdminPricingPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 py-8 px-4" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      <AdminPricingManagement />
    </main>
  );
}
