'use client';

import React, { useState } from 'react';
import { Calculator, FilePlus, CheckCircle2, Loader2, ArrowRight, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/shared/lib/utils';
import { DecalPriceResponse } from '../types/pricing.types';
import { OrderService } from '@/features/orders/services/order.service';
import { useCart } from '@/features/cart/context/CartContext';
import Link from 'next/link';

interface PricingResultCardProps {
  result: DecalPriceResponse | null;
  onOrderCreated?: (orderCode: string) => void;
}

export function PricingResultCard({ result, onOrderCreated }: PricingResultCardProps) {
  const [creating, setCreating] = useState(false);
  const [createdOrderCode, setCreatedOrderCode] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    if (!result) return;
    addToCart({
      categoryCode: result.category || 'DECAL',
      productName: `Sản phẩm ${result.category || 'In Ấn'} (${result.widthCm || 100}x${result.heightCm || 100} cm)`,
      widthCm: result.widthCm || 100,
      heightCm: result.heightCm || 100,
      quantity: result.quantity || 1,
      materialCode: result.materialCode || 'DECAL_STD',
      calculatedPrice: result.totalPrice,
      specificationsJson: JSON.stringify({
        singleAreaSqm: result.singleAreaSqm,
        totalAreaSqm: result.totalAreaSqm,
        ratePerSqm: result.ratePerSqm,
        laminationCost: result.laminationCost,
        lineItems: result.lineItems,
      }),
    });
  };

  const handleCreateOrder = async () => {
    if (!result) return;
    setCreating(true);
    setCreateError(null);
    try {
      const order = await OrderService.createOrder({
        totalAmount: result.totalPrice,
        note: `Đơn hàng báo giá tự động cho sản phẩm: ${result.category || 'IN AN'}`,
        items: [
          {
            categoryCode: result.category || 'DECAL',
            productName: `Sản phẩm ${result.category || 'In Ấn'} (${result.widthCm || 100}x${result.heightCm || 100} cm)`,
            widthCm: result.widthCm || 100,
            heightCm: result.heightCm || 100,
            quantity: result.quantity || 1,
            materialCode: result.materialCode || 'DECAL_STD',
            calculatedPrice: result.totalPrice,
            specificationsJson: JSON.stringify({
              singleAreaSqm: result.singleAreaSqm,
              totalAreaSqm: result.totalAreaSqm,
              ratePerSqm: result.ratePerSqm,
              laminationCost: result.laminationCost,
              lineItems: result.lineItems,
            }),
          },
        ],
      });
      setCreatedOrderCode(order.orderCode);
      if (onOrderCreated) {
        onOrderCreated(order.orderCode);
      }
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Không thể tạo đơn hàng');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between h-full min-h-[340px] text-center p-4">
      <div className="w-full">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">
          Thành Tiền Báo Giá
        </div>

        {result ? (
          <div className="py-4">
            <div className="text-4xl sm:text-5xl font-black text-zinc-950 font-mono tracking-tight">
              {formatCurrency(result.totalPrice)}
            </div>
            <span className="inline-block mt-3 px-3 py-1 bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-full">
              Tạm tính chưa VAT
            </span>
          </div>
        ) : (
          <div className="py-8 text-zinc-400">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3">
              <Calculator className="w-6 h-6 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-500 font-medium">0 VNĐ</p>
            <p className="text-xs text-zinc-400 mt-1">
              (Nhập thông số để xem giá tự động)
            </p>
          </div>
        )}
      </div>

      {result && (
        <div className="w-full pt-4 border-t border-zinc-100">
          {createdOrderCode ? (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs text-left">
              <div className="flex items-center gap-2 font-semibold mb-1 text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Đã tạo đơn hàng (Trạng thái: Xác nhận đơn)!
              </div>
              <p className="font-mono text-zinc-700 font-bold mb-2">Mã đơn: {createdOrderCode}</p>
              <div className="flex flex-col gap-1 mt-2">
                <Link
                  href="/employee"
                  className="inline-flex items-center gap-1.5 font-semibold text-zinc-900 hover:text-zinc-700 underline"
                >
                  Quản lý đơn hàng Employee <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                Thêm Vào Giỏ Hàng
              </button>

              {createError && (
                <p className="mt-2 text-xs text-red-600 font-medium">{createError}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
