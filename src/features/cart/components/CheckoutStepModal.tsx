'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
  ShieldCheck,
  Package,
} from 'lucide-react';
import { useCart } from '@/features/cart/context/CartContext';
import { OrderService } from '@/features/orders/services/order.service';
import { formatCurrency } from '@/shared/lib/utils';
import { DesignTaskSplitModal } from '@/features/design/components/DesignTaskSplitModal';

interface CheckoutStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (orderCode: string) => void;
}

export function CheckoutStepModal({ isOpen, onClose, onOrderCreated }: CheckoutStepModalProps) {
  const { activeCart, totalCartAmount, deleteCart, triggerGreenToast } = useCart();

  const [step, setStep] = useState<1 | 2>(1);
  const [recipientName, setRecipientName] = useState(activeCart.recipientName || '');
  const [recipientPhone, setRecipientPhone] = useState(activeCart.recipientPhone || '');
  const [recipientAddress, setRecipientAddress] = useState(activeCart.recipientAddress || '');
  const [note, setNote] = useState(activeCart.note || '');
  const [paymentOption, setPaymentOption] = useState<'FULL' | 'PARTIAL' | 'UNPAID'>('FULL');
  const [submitting, setSubmitting] = useState(false);
  const [createdOrderCode, setCreatedOrderCode] = useState<string | null>(null);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync inputs when activeCart changes
  useEffect(() => {
    if (isOpen) {
      setRecipientName(activeCart.recipientName || '');
      setRecipientPhone(activeCart.recipientPhone || '');
      setRecipientAddress(activeCart.recipientAddress || '');
      setNote(activeCart.note || '');
      setStep(1);
      setError(null);
    }
  }, [isOpen, activeCart]);

  if (!isOpen) return null;

  const handleNextToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      setError('Vui lòng nhập Tên Khách Hàng.');
      return;
    }
    if (!recipientPhone.trim()) {
      setError('Vui lòng nhập Số Điện Thoại.');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleCheckoutSubmit = async () => {
    if (activeCart.items.length === 0) {
      setError('Giỏ hàng chưa có sản phẩm nào.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const paidAmount =
      paymentOption === 'FULL'
        ? totalCartAmount
        : paymentOption === 'PARTIAL'
        ? Math.round(totalCartAmount * 0.5)
        : 0;

    const paymentStatus =
      paymentOption === 'FULL' || paidAmount >= totalCartAmount
        ? 'PAID'
        : paidAmount > 0
        ? 'PARTIALLY_PAID'
        : 'UNPAID';

    try {
      const order = await OrderService.createOrder({
        totalAmount: totalCartAmount,
        note: note.trim() || `Đơn hàng chốt trực tiếp từ ${activeCart.name}`,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        recipientAddress: recipientAddress.trim(),
        paidAmount: paidAmount,
        paymentStatus: paymentStatus,
        paymentMethod: 'TRANSFER',
        items: activeCart.items.map((item) => ({
          categoryCode: item.categoryCode,
          productName: item.productName,
          widthCm: item.widthCm,
          heightCm: item.heightCm,
          quantity: item.quantity,
          materialCode: item.materialCode,
          calculatedPrice: item.calculatedPrice,
          specificationsJson: item.specificationsJson,
        })),
      });

      deleteCart(activeCart.id);
      setCreatedOrderCode(order.orderCode);
      setIsSplitModalOpen(true);
      triggerGreenToast(`✓ ĐÃ CHỐT THÀNH CÔNG ĐƠN HÀNG ${order.orderCode}!`);
      if (onOrderCreated) {
        onOrderCreated(order.orderCode);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Chốt đơn hàng thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-zinc-200 overflow-hidden relative animate-in zoom-in-95">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/80">
            <div className="flex items-center gap-2 font-bold text-sm">
              <div className="p-1.5 rounded-xl bg-amber-500 text-zinc-950 font-black">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <div className="text-white text-sm font-bold flex items-center gap-2">
                  Xác Nhận & Chốt Đơn Hàng
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                    {step === 1 ? 'BƯỚC 1: KHÁCH HÀNG' : 'BƯỚC 2: CHỐT ĐƠN'}
                  </span>
                </div>
                <div className="text-[11px] text-indigo-200 font-normal">
                  Giỏ: <strong className="text-amber-400">{activeCart.name}</strong> ({activeCart.items.length} món)
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-indigo-300 hover:text-white rounded-xl hover:bg-indigo-900 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="flex items-center justify-between bg-zinc-100 p-2 border-b border-zinc-200 text-xs font-bold">
            <div
              className={`flex-1 py-1.5 text-center rounded-xl transition ${
                step === 1 ? 'bg-amber-500 text-zinc-950 shadow-xs' : 'text-zinc-500'
              }`}
            >
              1. Nhập Thông Tin Khách Hàng
            </div>
            <div className="px-2 text-zinc-400">›</div>
            <div
              className={`flex-1 py-1.5 text-center rounded-xl transition ${
                step === 2 ? 'bg-emerald-600 text-white shadow-xs' : 'text-zinc-500'
              }`}
            >
              2. Kiểm Tra & Chốt Đơn
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 font-bold text-xs">
                ⚠️ {error}
              </div>
            )}

            {/* BƯỚC 1: NHẬP THÔNG TIN KHÁCH HÀNG & CỌC TIỀN */}
            {step === 1 && (
              <form onSubmit={handleNextToStep2} className="space-y-4">
                <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl space-y-3">
                  <div className="font-bold text-amber-950 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <User className="w-4 h-4 text-amber-600" /> Thông Tin Người Nhận Đơn
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                        Tên Khách Hàng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Nhập tên khách hàng"
                        className="w-full px-3 py-2 border border-amber-300 rounded-xl text-xs bg-white text-zinc-900 font-bold focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                        Số Điện Thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="Nhập số điện thoại"
                        className="w-full px-3 py-2 border border-amber-300 rounded-xl text-xs bg-white text-zinc-900 font-mono font-bold focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      Địa Chỉ Giao Nhận (Tùy chọn):
                    </label>
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="Nhập địa chỉ giao nhận (nếu có)"
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs bg-white text-zinc-900 font-medium focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      Ghi Chú Đơn Hàng:
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ghi chú yêu cầu đặc biệt..."
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs bg-white text-zinc-900 font-medium"
                    />
                  </div>
                </div>

                {/* Tùy Chọn Cọc Tiền */}
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold text-zinc-800">Hình Thức Đặt Cọc / Thanh Toán:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentOption('FULL')}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer text-center ${
                        paymentOption === 'FULL'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      🟢 Trả Đủ 100%
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentOption('PARTIAL')}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer text-center ${
                        paymentOption === 'PARTIAL'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      🟠 Cọc 50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentOption('UNPAID')}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer text-center ${
                        paymentOption === 'UNPAID'
                          ? 'bg-zinc-900 text-white shadow-md'
                          : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      🔴 Trả Sau
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 font-bold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-xl text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    TIẾP TỤC BƯỚC 2: XÁC NHẬN CHỐT ĐƠN
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* BƯỚC 2: KIỂM TRA TÓM TẮT & XÁC NHẬN CHỐT ĐƠN */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="font-bold text-emerald-950 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Tóm Tắt Đơn Hàng Trước Khi Chốt
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                      <span className="text-zinc-500 font-semibold">Tên Khách Hàng:</span>
                      <strong className="text-zinc-900 font-bold text-sm">{recipientName}</strong>
                    </div>

                    <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                      <span className="text-zinc-500 font-semibold">Số Điện Thoại:</span>
                      <strong className="text-zinc-900 font-mono font-bold">{recipientPhone}</strong>
                    </div>

                    {recipientAddress && (
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                        <span className="text-zinc-500 font-semibold">Địa Chỉ:</span>
                        <span className="text-zinc-800 font-medium">{recipientAddress}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                      <span className="text-zinc-500 font-semibold">Hình Thức Thanh Toán:</span>
                      <strong className="text-emerald-800 font-bold">
                        {paymentOption === 'FULL' ? 'Trả Đủ 100%' : paymentOption === 'PARTIAL' ? 'Cọc 50%' : 'Trả Sau'}
                      </strong>
                    </div>

                    <div className="pt-1 flex justify-between items-center text-sm font-bold">
                      <span className="text-zinc-700">Tổng Tiền Thanh Toán:</span>
                      <span className="text-emerald-700 font-mono text-base font-black">
                        {formatCurrency(totalCartAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    <div className="text-[11px] font-bold text-zinc-600">
                      Món In Sản Phẩm ({activeCart.items.length} sản phẩm):
                    </div>
                    {activeCart.items.map((item) => (
                      <div key={item.id} className="p-2 bg-white rounded-xl border border-emerald-100 flex justify-between text-[11px]">
                        <div>
                          <strong className="text-zinc-900">{item.productName}</strong>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {item.widthCm}x{item.heightCm}cm • SL: {item.quantity}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-emerald-700">
                          {formatCurrency(item.calculatedPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Quay Lại Sửa Thông Tin
                  </button>

                  <button
                    type="button"
                    onClick={handleCheckoutSubmit}
                    disabled={submitting}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang chốt đơn...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        🚀 XÁC NHẬN & CHỐT ĐƠN HÀNG NGAY ({formatCurrency(totalCartAmount)})
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Tách Món In Corel (.cdr) */}
      <DesignTaskSplitModal
        orderCode={createdOrderCode}
        isOpen={isSplitModalOpen}
        onClose={() => {
          setIsSplitModalOpen(false);
          onClose();
        }}
      />
    </>
  );
}
