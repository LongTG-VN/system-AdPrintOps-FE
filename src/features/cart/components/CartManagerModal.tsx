'use client';

import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Edit3,
  X,
  CheckCircle2,
  Loader2,
  Package,
  Sparkles,
  Truck,
  CreditCard,
  DollarSign,
  User,
  Phone,
  FileText,
  Check,
  ChevronRight,
  ArrowRight,
  Calculator,
} from 'lucide-react';
import { useCart, CartData, CartItem } from '../context/CartContext';
import { OrderService } from '@/features/orders/services/order.service';
import { formatCurrency } from '@/shared/lib/utils';

interface CartManagerModalProps {
  onOrderCreated?: (orderCode: string) => void;
}

export const CartManagerModal: React.FC<CartManagerModalProps> = ({ onOrderCreated }) => {
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
    isManagerModalOpen,
    setIsManagerModalOpen,
  } = useCart();

  // Create new cart modal form state
  const [newCartName, setNewCartName] = useState('');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientPhone, setNewRecipientPhone] = useState('');
  const [newRecipientAddress, setNewRecipientAddress] = useState('');
  const [newNote, setNewNote] = useState('');
  const [showCreateCartForm, setShowCreateCartForm] = useState(true);

  // Edit item inline state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editWidthCm, setEditWidthCm] = useState<number>(100);
  const [editHeightCm, setEditHeightCm] = useState<number>(100);
  const [editQuantity, setEditQuantity] = useState<number>(1);

  // Checkout submission state
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  if (!isManagerModalOpen) return null;

  const currentCartTotal = activeCart.items.reduce((sum, i) => sum + (i.calculatedPrice || 0), 0);

  const calculatedPaidAmount =
    activeCart.paymentOption === 'FULL'
      ? currentCartTotal
      : activeCart.paymentOption === 'PARTIAL'
      ? activeCart.customDeposit > 0
        ? activeCart.customDeposit
        : Math.round(currentCartTotal * 0.5)
      : 0;

  const remainingDebt = Math.max(0, currentCartTotal - calculatedPaidAmount);

  const handleCreateNewCart = (e: React.FormEvent) => {
    e.preventDefault();
    const createdId = createCart(
      newCartName,
      newRecipientName,
      newRecipientPhone,
      newRecipientAddress,
      newNote
    );
    setNewCartName('');
    setNewRecipientName('');
    setNewRecipientPhone('');
    setNewRecipientAddress('');
    setNewNote('');
    setShowCreateCartForm(false);
    setActiveCartId(createdId);
  };

  const handleStartEditItem = (item: CartItem) => {
    setEditingItemId(item.id);
    setEditWidthCm(item.widthCm);
    setEditHeightCm(item.heightCm);
    setEditQuantity(item.quantity);
  };

  const handleSaveItemEdit = (item: CartItem) => {
    const unitPrice = item.calculatedPrice / item.quantity;
    const newPrice = unitPrice * editQuantity;
    updateItem(item.id, {
      widthCm: editWidthCm,
      heightCm: editHeightCm,
      quantity: editQuantity,
      calculatedPrice: newPrice,
    });
    setEditingItemId(null);
  };

  const handleCheckoutCart = async () => {
    if (!activeCart.items || activeCart.items.length === 0) return;

    if (!activeCart.recipientName?.trim() || !activeCart.recipientPhone?.trim()) {
      setCheckoutError('Vui lòng điền Tên Người Nhận và Số Điện Thoại trước khi chốt đơn.');
      return;
    }

    setCheckoutSubmitting(true);
    setCheckoutError(null);

    try {
      const paymentStatus =
        activeCart.paymentOption === 'FULL' || calculatedPaidAmount >= currentCartTotal
          ? 'PAID'
          : calculatedPaidAmount > 0
          ? 'PARTIALLY_PAID'
          : 'UNPAID';

      const payload = {
        totalAmount: currentCartTotal,
        note: activeCart.note || `Đơn hàng từ ${activeCart.name} (${activeCart.items.length} món)`,
        recipientName: activeCart.recipientName.trim(),
        recipientPhone: activeCart.recipientPhone.trim(),
        recipientAddress: activeCart.recipientAddress.trim(),
        paidAmount: calculatedPaidAmount,
        paymentStatus: paymentStatus,
        paymentMethod: activeCart.paymentMethod,
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
      };

      const order = await OrderService.createOrder(payload);

      // Xóa giỏ vừa chốt hoặc chuyển giỏ rỗng
      deleteCart(activeCart.id);
      setIsManagerModalOpen(false);

      if (onOrderCreated) {
        onOrderCreated(order.orderCode);
      }
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : 'Chốt đơn hàng thất bại.');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200 animate-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="p-5 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white flex items-center justify-between border-b border-indigo-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-zinc-950 font-bold shadow-lg">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg tracking-tight flex items-center gap-2">
                Quản Lý Danh Sách Giỏ Hàng (Cart CRUD)
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-indigo-200 font-medium">
                Tạo giỏ mới, phân loại khách hàng, chỉnh sửa thông số món in & chốt đơn hàng
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsManagerModalOpen(false)}
            className="p-2 text-indigo-300 hover:text-white rounded-xl hover:bg-indigo-900/60 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Split Body */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden bg-zinc-50">
          {/* Left Column: List of Carts (READ & CREATE) */}
          <div className="w-full md:w-80 bg-white border-r border-zinc-200 flex flex-col justify-between shrink-0">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <span className="font-bold text-xs text-zinc-900 uppercase tracking-wider">
                Danh Sách Giỏ ({carts.length})
              </span>
              <button
                type="button"
                onClick={() => setShowCreateCartForm(!showCreateCartForm)}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Giỏ Mới
              </button>
            </div>

            {/* Form Create Cart */}
            {showCreateCartForm && (
              <form onSubmit={handleCreateNewCart} className="p-3.5 bg-amber-50/90 border-b border-amber-200 space-y-2.5 text-xs">
                <div className="font-bold text-amber-950 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-amber-600" />
                    Tạo Giỏ Mới Cho Khách Mới
                  </span>
                  <span className="text-[10px] text-amber-800 font-mono font-normal">NEW CUSTOMER</span>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-amber-900 mb-0.5">
                    Tên Khách Hàng Mới <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={newRecipientName}
                    onChange={(e) => setNewRecipientName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs font-bold bg-white text-zinc-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-amber-900 mb-0.5">Số Điện Thoại:</label>
                    <input
                      type="text"
                      value={newRecipientPhone}
                      onChange={(e) => setNewRecipientPhone(e.target.value)}
                      placeholder="0901234567"
                      className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs font-mono font-bold bg-white text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-amber-900 mb-0.5">Tên Giỏ Hàng:</label>
                    <input
                      type="text"
                      value={newCartName}
                      onChange={(e) => setNewCartName(e.target.value)}
                      placeholder="Tự động sinh theo tên"
                      className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs bg-white text-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-amber-900 mb-0.5">Địa Chỉ Giao Hàng:</label>
                  <input
                    type="text"
                    value={newRecipientAddress}
                    onChange={(e) => setNewRecipientAddress(e.target.value)}
                    placeholder="Địa chỉ giao hàng khách mới"
                    className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs bg-white text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-amber-900 mb-0.5">Ghi Chú Yêu Cầu Khách Mới:</label>
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Ghi chú kỹ thuật..."
                    className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg text-xs bg-white text-zinc-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreateCartForm(false)}
                    className="px-2.5 py-1 text-zinc-600 hover:bg-zinc-200 rounded-lg font-medium text-[11px] cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Tạo Giỏ Khách Mới
                  </button>
                </div>
              </form>
            )}

            {/* List of active carts */}
            <div className="p-3 overflow-y-auto flex-1 space-y-2">
              {carts.map((cart) => {
                const isActive = cart.id === activeCartId;
                const total = cart.items.reduce((s, i) => s + (i.calculatedPrice || 0), 0);

                return (
                  <div
                    key={cart.id}
                    onClick={() => setActiveCartId(cart.id)}
                    className={`p-3 rounded-2xl border transition cursor-pointer text-xs flex flex-col justify-between ${
                      isActive
                        ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100/80'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-bold text-zinc-900 truncate flex items-center gap-1.5">
                        <ShoppingCart
                          className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-zinc-400'}`}
                        />
                        {cart.name}
                      </div>
                      {carts.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Xóa giỏ hàng "${cart.name}"?`)) {
                              deleteCart(cart.id);
                            }
                          }}
                          className="p-1 text-zinc-400 hover:text-red-600 rounded cursor-pointer"
                          title="Xóa giỏ hàng này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="mt-2 text-[11px] text-zinc-500 flex items-center justify-between">
                      <span>{cart.items.length} món in</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {formatCurrency(total)}
                      </span>
                    </div>

                    {cart.recipientName && (
                      <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                        👤 {cart.recipientName} {cart.recipientPhone && `• ${cart.recipientPhone}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Cart Detailed View (UPDATE, READ & CHECKOUT) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              {/* Active Cart Title & Name Edit */}
              <div className="p-4 bg-white rounded-2xl border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-800 text-xs font-mono font-bold">
                    GIỎ ĐANG CHỌN
                  </span>
                  <input
                    type="text"
                    value={activeCart.name}
                    onChange={(e) => updateCart(activeCart.id, { name: e.target.value })}
                    className="font-bold text-zinc-900 text-base border-b border-transparent hover:border-zinc-300 focus:border-indigo-600 px-1 py-0.5 rounded transition"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => clearCart(activeCart.id)}
                    className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả món
                  </button>
                </div>
              </div>

              {/* Items List inside Active Cart (UPDATE Items CRUD) */}
              <div className="space-y-3">
                <div className="font-bold text-xs text-zinc-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Sản Phẩm In Trong Giỏ ({activeCart.items.length})</span>
                  <span className="font-mono text-emerald-800">
                    Tổng: {formatCurrency(currentCartTotal)}
                  </span>
                </div>

                {activeCart.items.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-zinc-300 text-zinc-400 space-y-2">
                    <Package className="w-10 h-10 mx-auto text-zinc-300" />
                    <p className="font-semibold text-zinc-700 text-xs">Chưa có sản phẩm nào trong giỏ này</p>
                    <p className="text-[11px]">
                      Sử dụng <strong>Máy Tính Giá</strong> trên bàn làm việc để thêm sản phẩm vào giỏ này.
                    </p>
                  </div>
                ) : (
                  activeCart.items.map((item) => {
                    const isEditing = editingItemId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="p-4 bg-white rounded-2xl border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-zinc-900 text-sm">{item.productName}</div>
                          <div className="text-xs text-zinc-500 font-mono mt-0.5">
                            Hạng mục: <strong>{item.categoryCode}</strong> • Vật liệu: {item.materialCode || 'STD'}
                          </div>

                          {isEditing ? (
                            <div className="mt-3 p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <label className="block text-[10px] font-semibold text-indigo-900">
                                  Ngang (cm):
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={editWidthCm}
                                  onChange={(e) => setEditWidthCm(Number(e.target.value))}
                                  className="w-full px-2 py-1 border border-indigo-300 rounded bg-white font-mono font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-indigo-900">
                                  Cao (cm):
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={editHeightCm}
                                  onChange={(e) => setEditHeightCm(Number(e.target.value))}
                                  className="w-full px-2 py-1 border border-indigo-300 rounded bg-white font-mono font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-indigo-900">
                                  Số lượng:
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={editQuantity}
                                  onChange={(e) => setEditQuantity(Number(e.target.value))}
                                  className="w-full px-2 py-1 border border-indigo-300 rounded bg-white font-mono font-bold"
                                />
                              </div>
                              <div className="col-span-3 flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingItemId(null)}
                                  className="px-2.5 py-1 text-zinc-600 hover:bg-zinc-200 rounded text-[11px]"
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveItemEdit(item)}
                                  className="px-3 py-1 bg-indigo-600 text-white font-bold rounded text-[11px] cursor-pointer"
                                >
                                  Lưu Thay Đổi
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-zinc-700 font-mono mt-1 font-semibold flex items-center gap-3">
                              <span>
                                {item.widthCm} x {item.heightCm} cm
                              </span>
                              <span>• SL: {item.quantity}</span>
                            </div>
                          )}
                        </div>

                        {/* Price & Item Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100">
                          <div className="font-mono font-black text-emerald-700 text-sm">
                            {formatCurrency(item.calculatedPrice)}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditItem(item)}
                              className="p-1.5 text-zinc-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                              title="Chỉnh sửa thông số món"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id, activeCart.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                              title="Xóa món khỏi giỏ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Customer & Recipient Info (UPDATE Metadata) */}
              <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-3 text-xs">
                <div className="font-bold text-purple-950 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-purple-600" />
                  Thông Tin Người Nhận & Đơn Hàng (UPDATE Metadata)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                      Tên Người Nhận <span className="text-red-500">*</span>:
                    </label>
                    <input
                      type="text"
                      value={activeCart.recipientName}
                      onChange={(e) => updateCart(activeCart.id, { recipientName: e.target.value })}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-3 py-2 border border-purple-200 bg-white rounded-xl font-semibold text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                      Số Điện Thoại <span className="text-red-500">*</span>:
                    </label>
                    <input
                      type="text"
                      value={activeCart.recipientPhone}
                      onChange={(e) => updateCart(activeCart.id, { recipientPhone: e.target.value })}
                      placeholder="0901234567"
                      className="w-full px-3 py-2 border border-purple-200 bg-white rounded-xl font-mono font-bold text-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                    Địa Chỉ Giao Hàng:
                  </label>
                  <input
                    type="text"
                    value={activeCart.recipientAddress}
                    onChange={(e) => updateCart(activeCart.id, { recipientAddress: e.target.value })}
                    placeholder="Số 123 đường ABC, Quận XYZ, TP.HCM"
                    className="w-full px-3 py-2 border border-purple-200 bg-white rounded-xl text-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-purple-900 mb-1">
                    Ghi Chú Yêu Cầu Đơn Hàng:
                  </label>
                  <input
                    type="text"
                    value={activeCart.note}
                    onChange={(e) => updateCart(activeCart.id, { note: e.target.value })}
                    placeholder="Ghi chú đóng khoen, cán màng..."
                    className="w-full px-3 py-2 border border-purple-200 bg-white rounded-xl text-zinc-900"
                  />
                </div>
              </div>

              {/* Payment Options (UPDATE Deposit Settings) */}
              <div className="p-4 bg-white rounded-2xl border border-zinc-200 space-y-3 shadow-2xs text-xs">
                <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Phương Thức Thanh Toán Đặt Cọc
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => updateCart(activeCart.id, { paymentOption: 'FULL' })}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center ${
                      activeCart.paymentOption === 'FULL'
                        ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                    }`}
                  >
                    <span>Thanh Toán Đủ</span>
                    <span className="text-[10px] font-mono">(100%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateCart(activeCart.id, {
                        paymentOption: 'PARTIAL',
                        customDeposit:
                          activeCart.customDeposit > 0
                            ? activeCart.customDeposit
                            : Math.round(currentCartTotal * 0.5),
                      });
                    }}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center ${
                      activeCart.paymentOption === 'PARTIAL'
                        ? 'bg-amber-50 border-amber-500 font-bold text-amber-950'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                    }`}
                  >
                    <span>Trả 1 Phần</span>
                    <span className="text-[10px] font-mono">(Đặt Cọc)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateCart(activeCart.id, { paymentOption: 'UNPAID' })}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center ${
                      activeCart.paymentOption === 'UNPAID'
                        ? 'bg-zinc-200 border-zinc-500 font-bold text-zinc-950'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                    }`}
                  >
                    <span>Chưa Thanh Toán</span>
                    <span className="text-[10px] font-mono">(Trả Sau)</span>
                  </button>
                </div>

                {activeCart.paymentOption === 'PARTIAL' && (
                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1.5">
                    <label className="block text-[11px] font-semibold text-amber-900">
                      Số Tiền Đặt Cọc (VNĐ):
                    </label>
                    <input
                      type="number"
                      value={activeCart.customDeposit}
                      onChange={(e) =>
                        updateCart(activeCart.id, { customDeposit: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-xs font-mono font-bold bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Error Message & Checkout Button */}
            <div className="pt-4 border-t border-zinc-200 space-y-3">
              {checkoutError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                  {checkoutError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900 text-white p-4 rounded-2xl shadow-md">
                <div className="text-xs font-mono space-y-0.5">
                  <div>
                    Tổng đơn: <strong>{formatCurrency(currentCartTotal)}</strong>
                  </div>
                  <div className="text-emerald-400 font-bold">
                    Thanh toán ngay: {formatCurrency(calculatedPaidAmount)}
                  </div>
                  {remainingDebt > 0 && (
                    <div className="text-amber-400 font-bold">
                      Còn nợ: {formatCurrency(remainingDebt)}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCheckoutCart}
                  disabled={checkoutSubmitting || activeCart.items.length === 0}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm shrink-0"
                >
                  {checkoutSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang chốt đơn...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Xác Nhận & Chốt Đơn Hàng ({formatCurrency(calculatedPaidAmount)})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
