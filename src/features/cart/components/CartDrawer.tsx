'use client';

import React, { useState } from 'react';
import {
  ShoppingCart,
  Trash2,
  X,
  CreditCard,
  CheckCircle2,
  Loader2,
  Truck,
  DollarSign,
  Package,
  Plus,
  Minus,
  Sparkles,
  QrCode,
  Banknote,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { OrderService } from '@/features/orders/services/order.service';
import { formatCurrency } from '@/shared/lib/utils';

interface CartDrawerProps {
  onOrderCreated?: (orderCode: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOrderCreated }) => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalCartAmount,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  // Form State
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [note, setNote] = useState('');

  // Payment State: 'FULL' | 'PARTIAL' | 'UNPAID'
  const [paymentOption, setPaymentOption] = useState<'FULL' | 'PARTIAL' | 'UNPAID'>('FULL');
  const [customDeposit, setCustomDeposit] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('TRANSFER');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-calculate deposit if FULL or initial PARTIAL
  const calculatedPaidAmount =
    paymentOption === 'FULL'
      ? totalCartAmount
      : paymentOption === 'PARTIAL'
      ? customDeposit > 0
        ? customDeposit
        : Math.round(totalCartAmount * 0.5)
      : 0;

  const remainingDebt = Math.max(0, totalCartAmount - calculatedPaidAmount);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!recipientName.trim() || !recipientPhone.trim()) {
      setError('Vui lòng nhập Tên người nhận và Số điện thoại khách hàng.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const paymentStatus =
        paymentOption === 'FULL' || calculatedPaidAmount >= totalCartAmount
          ? 'PAID'
          : calculatedPaidAmount > 0
          ? 'PARTIALLY_PAID'
          : 'UNPAID';

      const payload = {
        totalAmount: totalCartAmount,
        note: note || `Đơn hàng giỏ hàng (${cartItems.length} sản phẩm)`,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        recipientAddress: recipientAddress.trim(),
        paidAmount: calculatedPaidAmount,
        paymentStatus: paymentStatus,
        paymentMethod: paymentMethod,
        items: cartItems.map((item) => ({
          categoryCode: item.categoryCode,
          productName: item.productName,
          widthCm: item.widthCm,
          heightCm: item.heightCm,
          quantity: item.quantity,
          materialCode: item.materialCode,
          calculatedPrice: item.calculatedPrice,
          specificationsJson: item.specificationsJson,
        })),
      };

      const order = await OrderService.createOrder(payload);

      clearCart();
      setIsCartOpen(false);
      setRecipientName('');
      setRecipientPhone('');
      setRecipientAddress('');
      setNote('');

      if (onOrderCreated) {
        onOrderCreated(order.orderCode);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Tạo đơn hàng giỏ hàng thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Cart Button Badge */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-zinc-900 hover:bg-zinc-800 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2.5 transition transform hover:scale-105 border border-zinc-700 cursor-pointer"
        title="Xem giỏ hàng"
      >
        <div className="relative">
          <ShoppingCart className="w-6 h-6 text-amber-400" />
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2.5 bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-900 animate-bounce">
              {cartItems.length}
            </span>
          )}
        </div>
        <span className="text-xs font-bold font-mono pr-1">
          Giỏ Hàng {cartItems.length > 0 && `(${formatCurrency(totalCartAmount)})`}
        </span>
      </button>

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-zinc-950 font-bold">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base tracking-tight flex items-center gap-1.5">
                    Giỏ Hàng Đơn In ({cartItems.length} sản phẩm)
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h2>
                  <p className="text-xs text-zinc-400 font-medium">
                    Gom nhiều sản phẩm & tùy chọn thanh toán cọc / đủ
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs text-zinc-900">
              {cartItems.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 space-y-2">
                  <Package className="w-12 h-12 mx-auto text-zinc-300" />
                  <p className="font-semibold text-zinc-700 text-sm">Giỏ hàng của bạn đang trống</p>
                  <p className="text-xs">
                    Hãy tính giá sản phẩm và bấm nút <strong>"Thêm Vào Giỏ Hàng"</strong> để gom đơn.
                  </p>
                </div>
              ) : (
                <>
                  {/* Cart Itemized List */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between font-bold text-zinc-700 text-xs border-b border-zinc-100 pb-1.5">
                      <span>Danh Sách Sản Phẩm In</span>
                      <button
                        type="button"
                        onClick={() => clearCart()}
                        className="text-[11px] text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
                      </button>
                    </div>

                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 flex items-start justify-between gap-3 shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-zinc-900 text-xs truncate">
                            {item.productName}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                            {item.widthCm} x {item.heightCm} cm • VẬT LIỆU: {item.categoryCode}
                          </div>
                          <div className="font-bold text-emerald-700 font-mono mt-1 text-xs">
                            {formatCurrency(item.calculatedPrice)}
                          </div>
                        </div>

                        {/* Quantity Adjuster */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center border border-zinc-300 rounded-lg bg-white overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 font-mono font-bold text-xs">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Customer & Recipient Information */}
                  <form id="cart-checkout-form" onSubmit={handleCheckout} className="space-y-4">
                    <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-3">
                      <div className="font-bold text-purple-950 flex items-center gap-1.5 text-xs">
                        <Truck className="w-4 h-4 text-purple-600" />
                        Thông Tin Khách Hàng / Giao Nhận
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                            Tên Người Nhận <span className="text-red-500">*</span>:
                          </label>
                          <input
                            type="text"
                            required
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            placeholder="Nguyễn Văn A"
                            className="w-full px-3 py-2 border border-purple-200 bg-white rounded-xl text-xs text-zinc-900 font-semibold focus:ring-2 focus:ring-purple-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                            Số Điện Thoại <span className="text-red-500">*</span>:
                          </label>
                          <input
                            type="text"
                            required
                            value={recipientPhone}
                            onChange={(e) => setRecipientPhone(e.target.value)}
                            placeholder="0901234567"
                            className="w-full px-3 py-2 border border-purple-200 bg-white rounded-xl text-xs font-mono font-bold text-zinc-900 focus:ring-2 focus:ring-purple-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                          Địa Chỉ Giao Hàng:
                        </label>
                        <input
                          type="text"
                          value={recipientAddress}
                          onChange={(e) => setRecipientAddress(e.target.value)}
                          placeholder="Số 123 đường ABC, Quận XYZ, TP.HCM"
                          className="w-full px-3 py-2 border border-purple-200 bg-white rounded-xl text-xs text-zinc-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                          Ghi Chú Yêu Cầu Kỹ Thuật:
                        </label>
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Ghi chú cán màng, đóng khoen..."
                          className="w-full px-3 py-2 border border-purple-200 bg-white rounded-xl text-xs text-zinc-900"
                        />
                      </div>
                    </div>

                    {/* Payment Options Selection */}
                    <div className="p-4 bg-white rounded-2xl border border-zinc-200 space-y-3 shadow-sm">
                      <div className="font-bold text-zinc-900 flex items-center gap-1.5 text-xs">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        Hình Thức Thanh Toán
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentOption('FULL')}
                          className={`p-3 rounded-xl text-center border transition cursor-pointer flex flex-col items-center justify-between ${
                            paymentOption === 'FULL'
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-sm'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 mb-1 text-emerald-600" />
                          <span className="text-[11px]">Thanh Toán Đủ</span>
                          <span className="text-[10px] font-mono opacity-80">(100%)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPaymentOption('PARTIAL');
                            if (customDeposit === 0) {
                              setCustomDeposit(Math.round(totalCartAmount * 0.5));
                            }
                          }}
                          className={`p-3 rounded-xl text-center border transition cursor-pointer flex flex-col items-center justify-between ${
                            paymentOption === 'PARTIAL'
                              ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold shadow-sm'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                          }`}
                        >
                          <DollarSign className="w-4 h-4 mb-1 text-amber-600" />
                          <span className="text-[11px]">Trả 1 Phần</span>
                          <span className="text-[10px] font-mono opacity-80">(Đặt Cọc)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentOption('UNPAID')}
                          className={`p-3 rounded-xl text-center border transition cursor-pointer flex flex-col items-center justify-between ${
                            paymentOption === 'UNPAID'
                              ? 'bg-zinc-200 border-zinc-500 text-zinc-950 font-bold shadow-sm'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                          }`}
                        >
                          <Package className="w-4 h-4 mb-1 text-zinc-600" />
                          <span className="text-[11px]">Chưa Trả</span>
                          <span className="text-[10px] font-mono opacity-80">(Trả Sau)</span>
                        </button>
                      </div>

                      {/* Custom Deposit Amount Input */}
                      {paymentOption === 'PARTIAL' && (
                        <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2 mt-2">
                          <label className="block text-[11px] font-semibold text-amber-900">
                            Nhập Số Tiền Đặt Cọc (VNĐ):
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1000}
                              max={totalCartAmount}
                              step={10000}
                              value={customDeposit}
                              onChange={(e) => setCustomDeposit(Number(e.target.value))}
                              className="flex-1 px-3 py-1.5 border border-amber-300 rounded-lg text-xs font-mono font-bold text-amber-950 bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => setCustomDeposit(Math.round(totalCartAmount * 0.5))}
                              className="px-3 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[11px] cursor-pointer"
                            >
                              Cọc 50%
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Payment Method Selector */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs">
                        <span className="font-semibold text-zinc-700">Hình thức nhận tiền:</span>
                        <div className="flex items-center gap-3 font-semibold">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={paymentMethod === 'TRANSFER'}
                              onChange={() => setPaymentMethod('TRANSFER')}
                            />
                            <QrCode className="w-3.5 h-3.5 text-blue-600" /> QR Chuyển Khoản
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={paymentMethod === 'CASH'}
                              onChange={() => setPaymentMethod('CASH')}
                            />
                            <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Tiền Mặt
                          </label>
                        </div>
                      </div>
                    </div>
                  </form>
                </>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}
            </div>

            {/* Footer Summary & Submit Button */}
            {cartItems.length > 0 && (
              <div className="p-5 bg-zinc-900 text-white border-t border-zinc-800 space-y-3 shrink-0">
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-zinc-400">
                    <span>Tổng tiền sản phẩm ({cartItems.length} món):</span>
                    <span className="font-bold text-white">{formatCurrency(totalCartAmount)}</span>
                  </div>

                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Thanh toán ngay / Đã cọc:</span>
                    <span>{formatCurrency(calculatedPaidAmount)}</span>
                  </div>

                  {remainingDebt > 0 && (
                    <div className="flex justify-between text-amber-400 font-bold">
                      <span>Còn nợ chưa thu:</span>
                      <span>{formatCurrency(remainingDebt)}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  form="cart-checkout-form"
                  disabled={submitting}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black rounded-2xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang khởi tạo đơn hàng...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Xác Nhận & Tạo Đơn Hàng ({formatCurrency(calculatedPaidAmount)})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
