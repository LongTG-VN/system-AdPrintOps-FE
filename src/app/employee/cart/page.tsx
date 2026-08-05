'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Loader2,
  Package,
  Sparkles,
  Truck,
  CreditCard,
  DollarSign,
  User,
  Phone,
  Search,
  ArrowRight,
  Calculator,
  Calendar,
  Layers,
  FileText,
  UserCheck,
  AlertCircle,
  Tag,
  Check,
  X,
} from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { useCart, CartData, CartItem } from '@/features/cart/context/CartContext';
import { OrderService } from '@/features/orders/services/order.service';
import { formatCurrency } from '@/shared/lib/utils';
import { PricingFeature } from '@/features/pricing';
import { DesignTaskSplitModal } from '@/features/design/components/DesignTaskSplitModal';

export default function EmployeeCartPage() {
  const {
    carts,
    activeCartId,
    activeCart,
    createCart,
    setActiveCartId,
    updateCart,
    deleteCart,
    removeFromCart,
    updateQuantity,
    updateItem,
    clearCart,
  } = useCart();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Create Cart State (CREATE)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createCartName, setCreateCartName] = useState('');
  const [createRecipientName, setCreateRecipientName] = useState('');
  const [createRecipientPhone, setCreateRecipientPhone] = useState('');
  const [createRecipientAddress, setCreateRecipientAddress] = useState('');
  const [createNote, setCreateNote] = useState('');

  // Modal Edit Cart State (UPDATE)
  const [editingCart, setEditingCart] = useState<CartData | null>(null);
  const [editCartName, setEditCartName] = useState('');
  const [editRecipientName, setEditRecipientName] = useState('');
  const [editRecipientPhone, setEditRecipientPhone] = useState('');
  const [editRecipientAddress, setEditRecipientAddress] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editPaymentOption, setEditPaymentOption] = useState<'FULL' | 'PARTIAL' | 'UNPAID'>('FULL');
  const [editCustomDeposit, setEditCustomDeposit] = useState<number>(0);
  const [editPaymentMethod, setEditPaymentMethod] = useState<'CASH' | 'TRANSFER'>('TRANSFER');

  // Inline Item Edit State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editWidthCm, setEditWidthCm] = useState<number>(100);
  const [editHeightCm, setEditHeightCm] = useState<number>(100);
  const [editQuantity, setEditQuantity] = useState<number>(1);

  // Modal Calculator Popup State (Add item from Pricing Calculator to specific cart)
  const [showPricingPopup, setShowPricingPopup] = useState(false);

  // Status Notification & Split Modal
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [checkoutSubmittingId, setCheckoutSubmittingId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [splitModalOrderCode, setSplitModalOrderCode] = useState<string | null>(null);

  // Filter Carts
  const filteredCarts = carts.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.recipientName.toLowerCase().includes(term) ||
      c.recipientPhone.toLowerCase().includes(term) ||
      c.recipientAddress.toLowerCase().includes(term) ||
      c.items.some((i) => i.productName.toLowerCase().includes(term))
    );
  });

  // Calculate Metrics
  const totalDraftCarts = carts.length;
  const totalDraftItems = carts.reduce((sum, c) => sum + c.items.length, 0);
  const totalDraftValue = carts.reduce(
    (sum, c) => sum + c.items.reduce((s, i) => s + (i.calculatedPrice || 0), 0),
    0
  );

  // Handle Create New Cart for New Customer
  const handleCreateCartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createRecipientName.trim()) {
      alert('Vui lòng nhập Tên Khách Hàng Mới.');
      return;
    }

    const createdId = createCart(
      createCartName,
      createRecipientName,
      createRecipientPhone,
      createRecipientAddress,
      createNote
    );

    setSubmitSuccess(`✓ Đã tạo thành công giỏ hàng mới cho khách "${createRecipientName}"!`);
    setShowCreateModal(false);

    // Reset Form
    setCreateCartName('');
    setCreateRecipientName('');
    setCreateRecipientPhone('');
    setCreateRecipientAddress('');
    setCreateNote('');

    setActiveCartId(createdId);
  };

  // Tự động tạo Giỏ hàng nháp mới & Bật Máy tính Báo giá tức thì
  const handleCreateNewCartAndOpenPricing = () => {
    const draftCount = carts.length + 1;
    const newCartId = createCart(
      `Giỏ Hàng Nháp #${draftCount}`,
      `Khách Hàng Mới #${draftCount}`,
      '',
      '',
      ''
    );
    setActiveCartId(newCartId);
    setShowPricingPopup(true);
    setSubmitSuccess(`✓ Đã tự động tạo Giỏ hàng nháp mới (#${draftCount})! Đã mở Máy tính báo giá.`);
  };

  // Open Edit Modal for a Cart
  const handleOpenEditModal = (cart: CartData) => {
    setEditingCart(cart);
    setEditCartName(cart.name);
    setEditRecipientName(cart.recipientName);
    setEditRecipientPhone(cart.recipientPhone);
    setEditRecipientAddress(cart.recipientAddress);
    setEditNote(cart.note);
    setEditPaymentOption(cart.paymentOption);
    setEditCustomDeposit(cart.customDeposit);
    setEditPaymentMethod(cart.paymentMethod);
  };

  // Save Edit Cart Details
  const handleSaveEditCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCart) return;

    updateCart(editingCart.id, {
      name: editCartName,
      recipientName: editRecipientName,
      recipientPhone: editRecipientPhone,
      recipientAddress: editRecipientAddress,
      note: editNote,
      paymentOption: editPaymentOption,
      customDeposit: editCustomDeposit,
      paymentMethod: editPaymentMethod,
    });

    setSubmitSuccess(`✓ Đã cập nhật thành công thông tin giỏ hàng "${editCartName}"!`);
    setEditingCart(null);
  };

  // Save Item Inline Edit
  const handleSaveItemEdit = (cartId: string, item: CartItem) => {
    const unitPrice = item.calculatedPrice / item.quantity;
    const newPrice = unitPrice * editQuantity;
    updateItem(
      item.id,
      {
        widthCm: editWidthCm,
        heightCm: editHeightCm,
        quantity: editQuantity,
        calculatedPrice: newPrice,
      },
      cartId
    );
    setEditingItemId(null);
  };

  // Checkout Cart to Official Backend Order
  const handleCheckoutCart = async (cart: CartData) => {
    if (!cart.items || cart.items.length === 0) {
      alert('Giỏ hàng này đang trống. Vui lòng thêm sản phẩm trước khi chốt đơn.');
      return;
    }

    if (!cart.recipientName?.trim() || !cart.recipientPhone?.trim()) {
      alert('Vui lòng điền Tên Người Nhận và Số Điện Thoại trước khi chốt đơn.');
      handleOpenEditModal(cart);
      return;
    }

    setCheckoutSubmittingId(cart.id);
    setCheckoutError(null);

    const totalCartAmount = cart.items.reduce((s, i) => s + (i.calculatedPrice || 0), 0);
    const paidAmount =
      cart.paymentOption === 'FULL'
        ? totalCartAmount
        : cart.paymentOption === 'PARTIAL'
        ? cart.customDeposit > 0
          ? cart.customDeposit
          : Math.round(totalCartAmount * 0.5)
        : 0;

    const paymentStatus =
      cart.paymentOption === 'FULL' || paidAmount >= totalCartAmount
        ? 'PAID'
        : paidAmount > 0
        ? 'PARTIALLY_PAID'
        : 'UNPAID';

    try {
      const payload = {
        totalAmount: totalCartAmount,
        note: cart.note || `Đơn hàng từ giỏ ${cart.name} (${cart.items.length} món)`,
        recipientName: cart.recipientName.trim(),
        recipientPhone: cart.recipientPhone.trim(),
        recipientAddress: cart.recipientAddress.trim(),
        paidAmount: paidAmount,
        paymentStatus: paymentStatus,
        paymentMethod: cart.paymentMethod,
        items: cart.items.map((item) => ({
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

      deleteCart(cart.id);
      setSubmitSuccess(
        `✓ Đã chốt thành công giỏ hàng "${cart.name}" thành Đơn hàng ${order.orderCode}! Đã tự động tách ${order.items.length} món để nộp tệp Corel (.cdr).`
      );
      setSplitModalOrderCode(order.orderCode);
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : 'Chốt đơn hàng thất bại.');
    } finally {
      setCheckoutSubmittingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Success Notification Alert */}
      {submitSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <span>{submitSuccess}</span>
          <button
            onClick={() => setSubmitSuccess(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold text-sm cursor-pointer ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search & Action Bar */}
      <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên khách, SĐT, tên giỏ..."
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="button"
            onClick={handleCreateNewCartAndOpenPricing}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-black rounded-xl transition shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-zinc-950" />
            + Tạo Giỏ Hàng Mới & Tính Giá
          </button>
        </div>

        <div className="text-xs font-mono text-zinc-500 shrink-0">
          Hiển thị <strong>{filteredCarts.length}</strong> / <strong>{carts.length}</strong> giỏ hàng
        </div>
      </div>

      {/* Carts Cards Grid (READ & CRUD Actions) */}
      {filteredCarts.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-zinc-300 rounded-3xl text-zinc-400 space-y-3">
          <ShoppingCart className="w-12 h-12 mx-auto text-zinc-300" />
          <p className="font-bold text-zinc-700 text-sm">Chưa tìm thấy giỏ hàng nháp nào</p>
          <button
            type="button"
            onClick={handleCreateNewCartAndOpenPricing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Tạo Giỏ Hàng Mới & Tính Giá Ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCarts.map((cart) => {
            const isSelected = cart.id === activeCartId;
            const totalAmount = cart.items.reduce((s, i) => s + (i.calculatedPrice || 0), 0);

            const paidAmount =
              cart.paymentOption === 'FULL'
                ? totalAmount
                : cart.paymentOption === 'PARTIAL'
                ? cart.customDeposit > 0
                  ? cart.customDeposit
                  : Math.round(totalAmount * 0.5)
                : 0;

            const remainingDebt = Math.max(0, totalAmount - paidAmount);

            return (
              <Card
                key={cart.id}
                className={`p-5 bg-white border rounded-3xl shadow-sm flex flex-col justify-between transition hover:shadow-md ${
                  isSelected ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-zinc-200'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-zinc-100">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-zinc-900 text-sm">{cart.name}</span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 font-bold text-[10px]">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span suppressHydrationWarning className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-zinc-400" />
                        {new Date(cart.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(cart)}
                        className="p-1.5 text-zinc-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                        title="Sửa giỏ hàng & khách hàng"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc chắn muốn xóa giỏ hàng "${cart.name}"?`)) {
                            deleteCart(cart.id);
                          }
                        }}
                        className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                        title="Xóa giỏ hàng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Customer Information Badge */}
                  <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-200/80 text-xs space-y-1">
                    <div className="font-bold text-purple-950 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-purple-600" /> Khách hàng:
                      </span>
                      <strong className="text-purple-900">
                        {cart.recipientName || 'Chưa điền tên'}
                      </strong>
                    </div>
                    {cart.recipientPhone && (
                      <div className="text-[11px] text-zinc-600 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-purple-500" /> {cart.recipientPhone}
                      </div>
                    )}
                    {cart.recipientAddress && (
                      <div className="text-[11px] text-zinc-600 truncate">
                        📍 {cart.recipientAddress}
                      </div>
                    )}
                  </div>

                  {/* Cart Items Summary List */}
                  <div className="space-y-2">
                    <div className="font-bold text-zinc-700 text-xs flex items-center justify-between">
                      <span>Sản phẩm in ({cart.items.length})</span>
                      <span className="font-mono text-emerald-800">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>

                    {cart.items.length === 0 ? (
                      <div className="p-4 text-center text-zinc-400 text-xs bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                        Chưa có món in nào trong giỏ này.
                      </div>
                    ) : (
                      cart.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-zinc-900 truncate">
                              {item.productName}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              {item.widthCm}x{item.heightCm}cm • SL: {item.quantity}
                            </div>
                          </div>

                          <div className="font-mono font-bold text-emerald-700 text-[11px] shrink-0">
                            {formatCurrency(item.calculatedPrice)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Payment Deposit Badge */}
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-600">Thanh toán:</span>
                    {cart.paymentOption === 'FULL' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                        🟢 Đã cọc / Trả đủ 100%
                      </span>
                    ) : cart.paymentOption === 'PARTIAL' ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                        🟠 Cọc {formatCurrency(paidAmount)} (Nợ: {formatCurrency(remainingDebt)})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-900 text-[10px] font-bold">
                        🔴 Chưa trả
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-zinc-100 space-y-2 mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCartId(cart.id);
                        setShowPricingPopup(true);
                      }}
                      className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition border border-indigo-200 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm Món
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(cart)}
                      className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold rounded-xl text-xs transition border border-zinc-200 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Sửa Thông Tin
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCheckoutCart(cart)}
                    disabled={checkoutSubmittingId === cart.id || cart.items.length === 0}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {checkoutSubmittingId === cart.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Đang chốt đơn...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Xác Nhận & Chốt Đơn Hàng ({formatCurrency(paidAmount)})
                      </>
                    )}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal CREATE New Cart for New Customer */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 animate-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 flex items-center justify-between font-bold">
              <div className="flex items-center gap-2 text-sm">
                <ShoppingCart className="w-5 h-5" />
                Tạo Giỏ Hàng Mới Cho Khách Hàng Mới
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-amber-700/20 rounded-lg transition text-zinc-950 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCartSubmit} className="p-5 space-y-4 text-xs text-zinc-900">
              <div>
                <label className="block font-bold text-zinc-800 mb-1">
                  Tên Khách Hàng Mới <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={createRecipientName}
                  onChange={(e) => setCreateRecipientName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-xl font-bold focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Số Điện Thoại:</label>
                  <input
                    type="text"
                    value={createRecipientPhone}
                    onChange={(e) => setCreateRecipientPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Tên Giỏ Hàng:</label>
                  <input
                    type="text"
                    value={createCartName}
                    onChange={(e) => setCreateCartName(e.target.value)}
                    placeholder="Tự tạo theo tên khách"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Địa Chỉ Giao Hàng:</label>
                <input
                  type="text"
                  value={createRecipientAddress}
                  onChange={(e) => setCreateRecipientAddress(e.target.value)}
                  placeholder="Số 123 đường ABC, Quận XYZ..."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Ghi Chú Đơn Hàng:</label>
                <input
                  type="text"
                  value={createNote}
                  onChange={(e) => setCreateNote(e.target.value)}
                  placeholder="Ghi chú đóng khoen, cán màng..."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-xl shadow-md transition cursor-pointer"
                >
                  Tạo Giỏ Khách Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal EDIT Cart Details (UPDATE) */}
      {editingCart && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-5 bg-indigo-950 text-white flex items-center justify-between font-bold shrink-0">
              <div className="flex items-center gap-2 text-sm">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                Chỉnh Sửa Thông Tin Giỏ Hàng: {editingCart.name}
              </div>
              <button
                onClick={() => setEditingCart(null)}
                className="p-1 hover:bg-indigo-900 rounded-lg transition text-white font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCart} className="p-5 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="block font-bold text-zinc-800 mb-1">Tên Giỏ Hàng:</label>
                <input
                  type="text"
                  required
                  value={editCartName}
                  onChange={(e) => setEditCartName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Tên Khách Hàng:</label>
                  <input
                    type="text"
                    value={editRecipientName}
                    onChange={(e) => setEditRecipientName(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Số Điện Thoại:</label>
                  <input
                    type="text"
                    value={editRecipientPhone}
                    onChange={(e) => setEditRecipientPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Địa Chỉ Giao Hàng:</label>
                <input
                  type="text"
                  value={editRecipientAddress}
                  onChange={(e) => setEditRecipientAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Ghi Chú Kỹ Thuật:</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-xl"
                />
              </div>

              {/* Payment Deposit Options */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                <div className="font-bold text-zinc-900">Hình Thức Thanh Toán Cọc</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditPaymentOption('FULL')}
                    className={`p-2.5 rounded-xl border text-center font-semibold text-[11px] ${
                      editPaymentOption === 'FULL'
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-white border-zinc-200 text-zinc-700'
                    }`}
                  >
                    Trả Đủ 100%
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPaymentOption('PARTIAL')}
                    className={`p-2.5 rounded-xl border text-center font-semibold text-[11px] ${
                      editPaymentOption === 'PARTIAL'
                        ? 'bg-amber-100 border-amber-500 text-amber-950 font-bold'
                        : 'bg-white border-zinc-200 text-zinc-700'
                    }`}
                  >
                    Đặt Cọc
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPaymentOption('UNPAID')}
                    className={`p-2.5 rounded-xl border text-center font-semibold text-[11px] ${
                      editPaymentOption === 'UNPAID'
                        ? 'bg-zinc-200 border-zinc-500 text-zinc-950 font-bold'
                        : 'bg-white border-zinc-200 text-zinc-700'
                    }`}
                  >
                    Chưa Trả
                  </button>
                </div>

                {editPaymentOption === 'PARTIAL' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                      Số Tiền Đặt Cọc (VNĐ):
                    </label>
                    <input
                      type="number"
                      value={editCustomDeposit}
                      onChange={(e) => setEditCustomDeposit(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-zinc-300 rounded-lg font-mono font-bold bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingCart(null)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pricing Calculator Popup (Song Song 2 Cột: Máy Tính + Giỏ Hàng) */}
      {showPricingPopup && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 md:p-6">
          <div className="bg-white w-full max-w-6xl h-[92vh] rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 flex flex-col relative animate-in zoom-in-95">
            <div className="p-4 bg-indigo-950 text-white flex items-center justify-between border-b border-indigo-900 shrink-0">
              <div className="font-bold text-sm flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold">
                  <Calculator className="w-4 h-4" />
                </div>
                <span>Máy Tính Báo Giá Món In (Đang Thêm Vào: <strong className="text-amber-400">{activeCart.name}</strong>)</span>
              </div>
              <button
                onClick={() => setShowPricingPopup(false)}
                className="p-1.5 text-indigo-300 hover:text-white rounded-xl hover:bg-indigo-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-zinc-50">
              <PricingFeature hideHeader={true} />
            </div>
          </div>
        </div>
      )}

      {/* Modal Tách Món In Nộp File Corel (.cdr) */}
      <DesignTaskSplitModal
        orderCode={splitModalOrderCode}
        isOpen={!!splitModalOrderCode}
        onClose={() => setSplitModalOrderCode(null)}
      />
    </div>
  );
}
