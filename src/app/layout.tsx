import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/features/cart/context/CartContext';
import { CartManagerModal } from '@/features/cart/components/CartManagerModal';
import { AuthProvider } from '@/features/auth/context/AuthContext';

export const metadata: Metadata = {
  title: 'AdPrintOps - Công Cụ Tính Giá In Ấn & Quảng Cáo Doanh Nghiệp',
  description: 'Hệ thống tính giá tức thì cho In Decal, Tem Bế, Bảng Hiệu Hiflex, Alu, Mica, Card Visit và Tranh Điện LED.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body
        className="antialiased bg-zinc-50 text-zinc-900 selection:bg-zinc-900 selection:text-white"
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        <AuthProvider>
          <CartProvider>
            <main>{children}</main>
            <CartManagerModal />
          </CartProvider>
        </AuthProvider>

        <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-500 font-serif">
          <div className="max-w-6xl mx-auto px-4">
            <p>© 2026 AdPrintOps Enterprise System — Công Cụ Tính Giá Khoán In Ấn & Quảng Cáo.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
