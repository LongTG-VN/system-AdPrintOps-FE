'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  Printer, 
  Tag, 
  Scissors, 
  IdCard, 
  Layout, 
  Flag, 
  FileText, 
  Image as ImageIcon, 
  PlusCircle, 
  Calculator,
  Building2,
  FileCode
} from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/features/cart/context/CartContext';
import { formatCurrency } from '@/shared/lib/utils';
import { CategoryCalculatorForm } from './CategoryCalculatorForm';
import { PricingResultCard } from './PricingResultCard';
import { FeedbackWidget } from './FeedbackWidget';
import { CalculatePriceRequest, DecalPriceResponse, PricingTabCategory } from '../types/pricing.types';
import { PricingService } from '../services/pricing.service';

import { OrderService } from '@/features/orders/services/order.service';
import { CheckCircle2, Loader2, User, Phone } from 'lucide-react';

import { DesignTaskSplitModal } from '@/features/design/components/DesignTaskSplitModal';
import { CheckoutStepModal } from '@/features/cart/components/CheckoutStepModal';

function LiveCartPanel() {
  const { activeCart, removeFromCart, totalCartAmount } = useCart();
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  return (
    <div className="pt-3 border-t border-zinc-100 space-y-3 text-xs text-left">
      <div className="flex items-center justify-between font-bold text-zinc-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
        <span className="flex items-center gap-1.5 font-bold">
          <ShoppingCart className="w-4 h-4 text-amber-600" />
          Giỏ Hàng Trực Tiếp ({activeCart.items.length} món)
        </span>
        <span className="font-mono text-emerald-700 font-black text-sm">
          {formatCurrency(totalCartAmount)}
        </span>
      </div>

      {activeCart.items.length === 0 ? (
        <div className="p-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-200 text-center text-[11px] text-zinc-400">
          Chưa có món in nào. Tính giá & bấm <strong>"Thêm Vào Giỏ Hàng"</strong>.
        </div>
      ) : (
        <>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {activeCart.items.map((item) => (
              <div
                key={item.id}
                className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-zinc-900 truncate text-[11px]">{item.productName}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {item.widthCm}x{item.heightCm}cm • SL: {item.quantity}
                  </div>
                </div>
                <div className="font-mono font-bold text-emerald-700 text-[11px] shrink-0">
                  {formatCurrency(item.calculatedPrice)}
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="text-zinc-400 hover:text-red-600 font-bold ml-1 cursor-pointer text-xs"
                  title="Xóa món"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsCheckoutModalOpen(true)}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            🚀 TIẾP TỤC: XÁC NHẬN & CHỐT ĐƠN HÀNG ({formatCurrency(totalCartAmount)})
          </button>
        </>
      )}

      {/* Modal Chốt Đơn Chuyên Biệt Step-by-Step */}
      <CheckoutStepModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
      />
    </div>
  );
}

interface PricingFeatureProps {
  onOrderCreated?: (orderCode: string) => void;
  hideHeader?: boolean;
}

export function PricingFeature({ onOrderCreated, hideHeader = false }: PricingFeatureProps = {}) {
  const [activeTab, setActiveTab] = useState<PricingTabCategory>('decal');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DecalPriceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = useCallback(async (payload: CalculatePriceRequest) => {
    setLoading(true);
    setError(null);
    try {
      const data = await PricingService.calculatePrice(payload);
      setResult({
        singleAreaSqm: data.singleAreaSqm,
        totalAreaSqm: data.totalAreaSqm,
        ratePerSqm: data.ratePerSqm,
        laminationCost: data.laminationCost,
        singleUnitPrice: data.singleUnitPrice,
        totalPrice: data.totalPrice,
        category: data.categoryCode,
        pricingNote: data.breakdownNote,
        widthCm: payload.widthM ? Math.round(payload.widthM * 100) : 100,
        heightCm: payload.heightM ? Math.round(payload.heightM * 100) : 100,
        quantity: payload.quantity || 1,
        materialCode: payload.materialCode || 'DECAL_STD',
        vatIncluded: data.vatIncluded,
        lineItems: data.lineItems,
        appliedRules: data.appliedRules,
      });
    } catch (err: unknown) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Không thể lấy báo giá từ hệ thống.');
    } finally {
      setLoading(false);
    }
  }, []);

  const tabs = [
    { id: 'decal' as PricingTabCategory, name: 'In Decal', icon: Printer },
    { id: 'tem' as PricingTabCategory, name: 'In Tem', icon: Tag },
    { id: 'cat' as PricingTabCategory, name: 'Cắt Decal', icon: Scissors },
    { id: 'card' as PricingTabCategory, name: 'Card Visit', icon: IdCard },
    { id: 'bang' as PricingTabCategory, name: 'Bảng Hiệu', icon: Layout },
    { id: 'hiflex' as PricingTabCategory, name: 'Bạt Hiflex', icon: Flag },
    { id: 'giay' as PricingTabCategory, name: 'In Giấy', icon: FileText },
    { id: 'tranh' as PricingTabCategory, name: 'Tranh Điện', icon: ImageIcon },
    { id: 'khac' as PricingTabCategory, name: 'Phụ Phí', icon: PlusCircle },
  ];

  return (
    <div className={hideHeader ? "bg-transparent text-zinc-900" : "min-h-screen bg-zinc-50 text-zinc-900 pb-16"}>
      {/* Header Bar */}
      {!hideHeader && (
        <header className="border-b border-zinc-200 bg-white sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-bold text-xs tracking-wider">
                AP
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight text-zinc-900 leading-none">AdPrintOps</h1>
                <p className="text-[10px] text-zinc-500 font-medium">Bảng Báo Giá In Ấn & Quảng Cáo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/employee"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm transition"
              >
                <Building2 className="w-3.5 h-3.5" />
                Quản Lý Đơn Employee
              </Link>
              <Link
                href="/employee/design"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
              >
                <FileCode className="w-3.5 h-3.5" />
                Nộp File Corel
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* Segmented Minimalist Tabs */}
        <div className="bg-white p-1.5 rounded-xl border border-zinc-200 shadow-sm mb-6">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setResult(null);
                    setError(null);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Calculator Main Grid: 2 Columns Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-7">
            <Card>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200">
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-zinc-700" />
                  Thông Số ({tabs.find((t) => t.id === activeTab)?.name})
                </h3>
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                  /api/v1/pricing/{activeTab}
                </span>
              </div>

              <CategoryCalculatorForm key={activeTab} category={activeTab} onCalculate={handleCalculate} loading={loading} />

              {error && (
                <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {error}
                </div>
              )}
            </Card>
          </div>

          <div className="md:col-span-5">
            <Card className="h-full bg-white flex flex-col justify-between p-4 space-y-3">
              <PricingResultCard result={result} onOrderCreated={onOrderCreated} />
              <LiveCartPanel />
            </Card>
          </div>
        </div>
      </main>

      {/* Floating Feedback Widget (No DB required, opens modal & sends via Gmail) */}
      <FeedbackWidget />
    </div>
  );
}
