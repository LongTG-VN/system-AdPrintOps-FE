'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  categoryCode: string;
  productName: string;
  widthCm: number;
  heightCm: number;
  quantity: number;
  materialCode: string;
  calculatedPrice: number;
  specificationsJson?: string;
}

export interface CartData {
  id: string;
  name: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  note: string;
  paymentOption: 'FULL' | 'PARTIAL' | 'UNPAID';
  customDeposit: number;
  paymentMethod: 'CASH' | 'TRANSFER';
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

interface CartContextType {
  carts: CartData[];
  activeCartId: string;
  activeCart: CartData;
  createCart: (
    name?: string,
    recipientName?: string,
    recipientPhone?: string,
    recipientAddress?: string,
    note?: string
  ) => string;
  setActiveCartId: (id: string) => void;
  updateCart: (id: string, updates: Partial<CartData>) => void;
  deleteCart: (id: string) => void;
  addToCart: (item: Omit<CartItem, 'id'>, targetCartId?: string) => void;
  removeFromCart: (itemId: string, targetCartId?: string) => void;
  updateQuantity: (itemId: string, quantity: number, targetCartId?: string) => void;
  updateItem: (itemId: string, itemData: Partial<CartItem>, targetCartId?: string) => void;
  clearCart: (targetCartId?: string) => void;
  cartItems: CartItem[];
  totalCartAmount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isManagerModalOpen: boolean;
  setIsManagerModalOpen: (open: boolean) => void;
  toastMessage: string | null;
  triggerGreenToast: (msg: string) => void;
}

const DEFAULT_CART_ID = 'default-cart';

const createDefaultCart = (): CartData => ({
  id: DEFAULT_CART_ID,
  name: 'Giỏ Hàng Mặc Định #1',
  recipientName: '',
  recipientPhone: '',
  recipientAddress: '',
  note: '',
  paymentOption: 'FULL',
  customDeposit: 0,
  paymentMethod: 'TRANSFER',
  items: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [carts, setCarts] = useState<CartData[]>([createDefaultCart()]);
  const [activeCartId, setActiveCartId] = useState<string>(DEFAULT_CART_ID);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);

  // Load carts from localStorage
  useEffect(() => {
    try {
      const savedCarts = localStorage.getItem('adprintops_carts_v2');
      const savedActiveId = localStorage.getItem('adprintops_active_cart_id');

      if (savedCarts) {
        const parsed: CartData[] = JSON.parse(savedCarts);
        if (parsed && parsed.length > 0) {
          setCarts(parsed);
          if (savedActiveId && parsed.some((c) => c.id === savedActiveId)) {
            setActiveCartId(savedActiveId);
          } else {
            setActiveCartId(parsed[0].id);
          }
          return;
        }
      }

      // Legacy fallback
      const oldCart = localStorage.getItem('adprintops_cart');
      if (oldCart) {
        const oldItems: CartItem[] = JSON.parse(oldCart);
        const initial = createDefaultCart();
        initial.items = oldItems;
        setCarts([initial]);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save carts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('adprintops_carts_v2', JSON.stringify(carts));
      localStorage.setItem('adprintops_active_cart_id', activeCartId);
    } catch {
      // ignore
    }
  }, [carts, activeCartId]);

  const activeCart = carts.find((c) => c.id === activeCartId) || carts[0] || createDefaultCart();

  const createCart = (
    name?: string,
    recipientName = '',
    recipientPhone = '',
    recipientAddress = '',
    note = ''
  ) => {
    const newCartId = `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newCart: CartData = {
      id: newCartId,
      name: name?.trim() || (recipientName ? `Giỏ - Khách ${recipientName}` : `Giỏ Hàng Đơn Mới #${carts.length + 1}`),
      recipientName,
      recipientPhone,
      recipientAddress,
      note,
      paymentOption: 'FULL',
      customDeposit: 0,
      paymentMethod: 'TRANSFER',
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCarts((prev) => [...prev, newCart]);
    setActiveCartId(newCartId);
    return newCartId;
  };

  const updateCart = (id: string, updates: Partial<CartData>) => {
    setCarts((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
  };

  const deleteCart = (id: string) => {
    if (carts.length <= 1) {
      // Clear instead of delete last cart
      updateCart(id, { items: [], recipientName: '', recipientPhone: '', note: '' });
      return;
    }

    const filtered = carts.filter((c) => c.id !== id);
    setCarts(filtered);
    if (activeCartId === id) {
      setActiveCartId(filtered[0].id);
    }
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerGreenToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const addToCart = (item: Omit<CartItem, 'id'>, targetCartId?: string) => {
    const cartToUseId = targetCartId || activeCartId;
    const newItem: CartItem = {
      ...item,
      id: `cart-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    setCarts((prev) =>
      prev.map((c) => {
        if (c.id === cartToUseId) {
          return {
            ...c,
            items: [...c.items, newItem],
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
    triggerGreenToast(`Đã thêm "${item.productName}" vào giỏ hàng thành công!`);
  };

  const removeFromCart = (itemId: string, targetCartId?: string) => {
    const cartToUseId = targetCartId || activeCartId;
    setCarts((prev) =>
      prev.map((c) => {
        if (c.id === cartToUseId) {
          return {
            ...c,
            items: c.items.filter((i) => i.id !== itemId),
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
  };

  const updateQuantity = (itemId: string, quantity: number, targetCartId?: string) => {
    const cartToUseId = targetCartId || activeCartId;
    if (quantity <= 0) {
      removeFromCart(itemId, cartToUseId);
      return;
    }

    setCarts((prev) =>
      prev.map((c) => {
        if (c.id === cartToUseId) {
          return {
            ...c,
            items: c.items.map((item) => {
              if (item.id === itemId) {
                const unitPrice = item.calculatedPrice / item.quantity;
                return {
                  ...item,
                  quantity,
                  calculatedPrice: unitPrice * quantity,
                };
              }
              return item;
            }),
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
  };

  const updateItem = (itemId: string, itemData: Partial<CartItem>, targetCartId?: string) => {
    const cartToUseId = targetCartId || activeCartId;
    setCarts((prev) =>
      prev.map((c) => {
        if (c.id === cartToUseId) {
          return {
            ...c,
            items: c.items.map((i) => (i.id === itemId ? { ...i, ...itemData } : i)),
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
  };

  const clearCart = (targetCartId?: string) => {
    const cartToUseId = targetCartId || activeCartId;
    setCarts((prev) =>
      prev.map((c) => {
        if (c.id === cartToUseId) {
          return {
            ...c,
            items: [],
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );
  };

  const cartItems = activeCart.items || [];
  const totalCartAmount = cartItems.reduce((sum, item) => sum + (item.calculatedPrice || 0), 0);

  return (
    <CartContext.Provider
      value={{
        carts,
        activeCartId,
        activeCart,
        createCart,
        setActiveCartId,
        updateCart,
        deleteCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItem,
        clearCart,
        cartItems,
        totalCartAmount,
        isCartOpen,
        setIsCartOpen,
        isManagerModalOpen,
        setIsManagerModalOpen,
        toastMessage,
        triggerGreenToast,
      }}
    >
      {children}

      {/* Top Right Green Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-emerald-400 font-bold text-xs animate-in slide-in-from-top-4 duration-300">
          <div className="p-1 rounded-full bg-white text-emerald-600 font-black text-sm">
            ✓
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-200">
              THÀNH CÔNG
            </div>
            <div className="text-xs font-semibold">{toastMessage}</div>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 text-emerald-200 hover:text-white rounded-lg font-bold cursor-pointer ml-3 text-sm"
          >
            ✕
          </button>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
