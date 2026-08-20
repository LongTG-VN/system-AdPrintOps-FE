'use client';

import React, { useState, useCallback } from 'react';
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
  Sparkles,
  Calculator,
  Settings,
  History
} from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { CategoryCalculatorForm } from './CategoryCalculatorForm';
import { PricingResultCard } from './PricingResultCard';
import { AdminPricingManagement } from './AdminPricingManagement';
import { FeedbackWidget } from './FeedbackWidget';
import { CalculatePriceRequest, DecalPriceResponse, PricingTabCategory } from '../types/pricing.types';
import { PricingService } from '../services/pricing.service';

interface PricingFeatureProps {
  onOrderCreated?: (orderCode: string) => void;
  hideHeader?: boolean;
}

export function PricingFeature({ onOrderCreated, hideHeader = false }: PricingFeatureProps = {}) {
  const [viewMode, setViewMode] = useState<'calc' | 'manage' | 'history'>('calc');
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
    { id: 'hiflex' as PricingTabCategory, name: 'In Bạt (Hiflex)', icon: Flag },
    { id: 'hastag' as PricingTabCategory, name: 'Hastag', icon: Sparkles },
    { id: 'tem' as PricingTabCategory, name: 'In Tem', icon: Tag },
    { id: 'cat' as PricingTabCategory, name: 'Cắt Decal', icon: Scissors },
    { id: 'card' as PricingTabCategory, name: 'Card Visit', icon: IdCard },
    { id: 'bang' as PricingTabCategory, name: 'Bảng Hiệu', icon: Layout },
    { id: 'giay' as PricingTabCategory, name: 'In Giấy', icon: FileText },
    { id: 'tranh' as PricingTabCategory, name: 'Tranh Điện', icon: ImageIcon },
    { id: 'khac' as PricingTabCategory, name: 'Phụ Phí', icon: PlusCircle },
  ];

  return (
    <div className={hideHeader ? "bg-transparent text-zinc-900" : "min-h-screen bg-zinc-50 text-zinc-900 pb-16"}>
      {/* Top Header Bar */}
      {!hideHeader ? (
        <header className="border-b border-zinc-200 bg-white sticky top-0 z-10 shadow-2xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white font-bold text-xs tracking-wider">
                AP
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight text-zinc-900 leading-none">AdPrintOps</h1>
                <p className="text-[10px] text-zinc-500 font-medium">Hệ Thống Tính Giá & Quản Lý Bảng Giá In Ấn</p>
              </div>
            </div>

            {/* Mode Navigation Switcher */}
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
              <button
                type="button"
                onClick={() => setViewMode('calc')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                  viewMode === 'calc'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                Tính Giá Tự Động
              </button>
              <button
                type="button"
                onClick={() => setViewMode('manage')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                  viewMode === 'manage'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                Quản Lý Bảng Giá
              </button>
              <button
                type="button"
                onClick={() => setViewMode('history')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                  viewMode === 'history'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                }`}
              >
                <History className="w-3.5 h-3.5 text-amber-500" />
                Lịch Sử Chỉnh Giá
              </button>
            </div>
          </div>
        </header>
      ) : (
        /* Embedded Sub-Header Navigation Switcher */
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-200">
          <div className="text-xs font-semibold text-zinc-500">Chế độ xem:</div>
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-zinc-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('calc')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                viewMode === 'calc'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              Tính Giá Tự Động
            </button>
            <button
              type="button"
              onClick={() => setViewMode('manage')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                viewMode === 'manage'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Quản Lý Bảng Giá
            </button>
            <button
              type="button"
              onClick={() => setViewMode('history')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                viewMode === 'history'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <History className="w-3.5 h-3.5 text-amber-500" />
              Lịch Sử Chỉnh Giá
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {viewMode === 'calc' ? (
          <>
            {/* Segmented Minimalist Category Tabs */}
            <div className="bg-white p-1.5 rounded-xl border border-zinc-200 shadow-xs mb-6">
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
                          ? 'bg-zinc-900 text-white shadow-xs'
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
                </Card>
              </div>
            </div>
          </>
        ) : (
          /* Admin Pricing Management & Audit History Views */
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
            <AdminPricingManagement initialTab={viewMode === 'history' ? 'history' : 'rules'} />
          </div>
        )}
      </main>

      {/* Floating Feedback Widget */}
      <FeedbackWidget />
    </div>
  );
}
