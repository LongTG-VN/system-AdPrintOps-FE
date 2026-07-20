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
  Calculator,
  Building2
} from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { CategoryCalculatorForm } from './CategoryCalculatorForm';
import { PricingResultCard } from './PricingResultCard';
import { FeedbackWidget } from './FeedbackWidget';
import { CalculatePriceRequest, DecalPriceResponse, PricingTabCategory } from '../types/pricing.types';
import { PricingService } from '../services/pricing.service';

export function PricingFeature() {
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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-16">
      {/* Header Bar */}
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
              <Building2 className="w-3.5 h-3.5 text-zinc-500" />
              Tính Giá Tự Động
            </span>
          </div>
        </div>
      </header>

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

        {/* Calculator Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <Card>
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-zinc-200">
                <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-zinc-700" />
                  Thông Số ({tabs.find((t) => t.id === activeTab)?.name})
                </h3>
                <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
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

          <div className="lg:col-span-5">
            <Card className="h-full bg-white">
              <PricingResultCard result={result} />
            </Card>
          </div>
        </div>
      </main>

      {/* Floating Feedback Widget (No DB required, opens modal & sends via Gmail) */}
      <FeedbackWidget />
    </div>
  );
}
