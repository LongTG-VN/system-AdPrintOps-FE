'use client';

import React from 'react';
import { Calculator } from 'lucide-react';
import { formatCurrency } from '@/shared/lib/utils';
import { DecalPriceResponse } from '../types/pricing.types';

interface PricingResultCardProps {
  result: DecalPriceResponse | null;
}

export function PricingResultCard({ result }: PricingResultCardProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-4">
      <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">
        Thành Tiền Báo Giá
      </div>

      {result ? (
        <div className="my-auto py-6">
          <div className="text-4xl sm:text-5xl font-black text-zinc-950 font-mono tracking-tight">
            {formatCurrency(result.totalPrice)}
          </div>
          <span className="inline-block mt-3 px-3 py-1 bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-full">
            Tạm tính chưa VAT
          </span>
        </div>
      ) : (
        <div className="my-auto py-8 text-zinc-400">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3">
            <Calculator className="w-6 h-6 text-zinc-400" />
          </div>
          <p className="text-sm text-zinc-500 font-medium">
            0 VNĐ
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            (Nhập thông số để xem giá tự động)
          </p>
        </div>
      )}
    </div>
  );
}
