'use client';

import React, { useEffect, useState, useCallback, ChangeEvent, useMemo } from 'react';
import {
  UserCheck,
  ClipboardList,
  Palette,
  Printer,
  Clock,
  CheckCircle,
  FileCode,
  Truck,
  Layers,
  ArrowRight,
  Plus,
  Loader2,
  PackageCheck,
  Sparkles,
  Zap,
  Tag,
  Calendar,
  Upload,
  Edit3,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  HardDrive,
  FileUp,
  FileCheck,
  AlertCircle,
  RotateCw,
  Maximize2,
  ShoppingCart,
} from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { PricingFeature } from '@/features/pricing';
import { OrderService } from '@/features/orders/services/order.service';
import { useCart } from '@/features/cart/context/CartContext';
import { DesignTaskSplitModal } from '@/features/design/components/DesignTaskSplitModal';
import {
  OrderResponse,
  DesignTaskResponse,
  ORDER_STATUS_LABELS,
  CreateOrderRequest,
} from '@/features/orders/types/order.types';
import { formatCurrency } from '@/shared/lib/utils';
import Link from 'next/link';

const DESIGN_STORAGE_PATH = 'D:\\Design';

interface NestedPiece {
  id: string;
  orderId: number;
  orderCode: string;
  productName: string;
  w: number;
  h: number;
  x: number;
  y: number;
  rotated: boolean;
  color: string;
}

export default function EmployeeHubPage() {
  const { carts, cartItems, setIsCartOpen, setIsManagerModalOpen, totalCartAmount, removeFromCart } = useCart();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [designTasks, setDesignTasks] = useState<DesignTaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal Tạo Đơn Hàng Mới State (CREATE)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createCategoryCode, setCreateCategoryCode] = useState<string>('HIFLEX');
  const [createProductName, setCreateProductName] = useState<string>('In Bạt Hiflex Silk');
  const [createWidthCm, setCreateWidthCm] = useState<number>(100);
  const [createHeightCm, setCreateHeightCm] = useState<number>(200);
  const [createQuantity, setCreateQuantity] = useState<number>(1);
  const [createUnitPrice, setCreateUnitPrice] = useState<number>(160000);
  const [createRecipientName, setCreateRecipientName] = useState<string>('');
  const [createRecipientPhone, setCreateRecipientPhone] = useState<string>('');
  const [createRecipientAddress, setCreateRecipientAddress] = useState<string>('');
  const [createNote, setCreateNote] = useState<string>('');
  const [creatingOrder, setCreatingOrder] = useState(false);

  // Modal Nộp File Corel State
  const [selectedTask, setSelectedTask] = useState<DesignTaskResponse | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submittingCorel, setSubmittingCorel] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [splitModalOrderCode, setSplitModalOrderCode] = useState<string | null>(null);

  // Modal Update Order State (UPDATE - RUD)
  const [editingOrder, setEditingOrder] = useState<OrderResponse | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [editTotal, setEditTotal] = useState<number>(0);
  const [editPaidAmount, setEditPaidAmount] = useState<number>(0);
  const [editPaymentStatus, setEditPaymentStatus] = useState<string>('UNPAID');
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>('CASH');
  const [editRecipientName, setEditRecipientName] = useState<string>('');
  const [editRecipientPhone, setEditRecipientPhone] = useState<string>('');
  const [editRecipientAddress, setEditRecipientAddress] = useState<string>('');
  const [editItemSpecs, setEditItemSpecs] = useState<
    { id: number; productName: string; widthCm: number; heightCm: number; quantity: number }[]
  >([]);
  const [updating, setUpdating] = useState(false);

  // Modal Delete Order State (DELETE - RUD)
  const [deletingOrder, setDeletingOrder] = useState<OrderResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal Xếp Phủ Khổ In (2D Nesting Optimizer) State
  const [showNestingModal, setShowNestingModal] = useState(false);
  const [rollWidthCm, setRollWidthCm] = useState<number>(150);
  const [rollLengthCm, setRollLengthCm] = useState<number>(5000);
  const [allowRotation, setAllowRotation] = useState<boolean>(true);
  const [nestingSubmitting, setNestingSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersData, tasksData] = await Promise.all([
        OrderService.getAllOrders(),
        OrderService.getAllDesignTasks(),
      ]);
      setOrders(ordersData);
      setDesignTasks(tasksData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể kết nối danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Đơn hàng đang ở trạng thái "Đợi in" phục vụ xếp phủ
  const waitingForPrintOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'WAITING_FOR_PRINT' || o.status === 'APPROVED_FOR_PRINT'
    );
  }, [orders]);

  // Thuật toán MaxRects 2D Guillotine Bin Packing
  const nestingResult = useMemo(() => {
    const piecesToPlace: {
      orderId: number;
      orderCode: string;
      productName: string;
      w: number;
      h: number;
      id: string;
    }[] = [];

    waitingForPrintOrders.forEach((order) => {
      order.items?.forEach((item, idx) => {
        const w = item.widthCm && item.widthCm > 0 ? item.widthCm : 100;
        const h = item.heightCm && item.heightCm > 0 ? item.heightCm : 100;
        const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
        for (let q = 0; q < qty; q++) {
          piecesToPlace.push({
            orderId: order.id,
            orderCode: order.orderCode,
            productName: item.productName || 'Sản phẩm in',
            w,
            h,
            id: `${order.id}-${idx}-${q}`,
          });
        }
      });
    });

    piecesToPlace.sort((a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h));

    const colorPalette = [
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#8b5cf6',
      '#ec4899',
      '#06b6d4',
      '#84cc16',
      '#6366f1',
    ];

    interface FreeRect {
      x: number;
      y: number;
      w: number;
      h: number;
    }

    const freeRects: FreeRect[] = [{ x: 0, y: 0, w: rollWidthCm, h: 100000 }];
    const placedPieces: NestedPiece[] = [];

    piecesToPlace.forEach((piece, index) => {
      let bestX = 0;
      let bestY = 0;
      let bestW = piece.w;
      let bestH = piece.h;
      let bestRotated = false;
      let bestScoreY = 999999;
      let bestScoreX = 999999;
      let foundSlot = false;

      const orientations = [
        { w: piece.w, h: piece.h, rotated: false },
        ...(allowRotation && piece.w !== piece.h
          ? [{ w: piece.h, h: piece.w, rotated: true }]
          : []),
      ];

      for (const orient of orientations) {
        if (orient.w > rollWidthCm) continue;

        for (const free of freeRects) {
          if (orient.w <= free.w && orient.h <= free.h) {
            const scoreY = free.y + orient.h;
            const scoreX = free.x;

            if (
              scoreY < bestScoreY ||
              (scoreY === bestScoreY && scoreX < bestScoreX)
            ) {
              bestScoreY = scoreY;
              bestScoreX = scoreX;
              bestX = free.x;
              bestY = free.y;
              bestW = orient.w;
              bestH = orient.h;
              bestRotated = orient.rotated;
              foundSlot = true;
            }
          }
        }
      }

      if (!foundSlot) {
        bestW = Math.min(piece.w, rollWidthCm);
        bestH = piece.h;
        bestRotated = false;

        let maxY = 0;
        placedPieces.forEach((p) => {
          if (p.y + p.h > maxY) maxY = p.y + p.h;
        });
        bestX = 0;
        bestY = maxY;
      }

      placedPieces.push({
        id: piece.id,
        orderId: piece.orderId,
        orderCode: piece.orderCode,
        productName: piece.productName,
        w: bestW,
        h: bestH,
        x: bestX,
        y: bestY,
        rotated: bestRotated,
        color: colorPalette[index % colorPalette.length],
      });

      const numFree = freeRects.length;
      for (let i = 0; i < numFree; i++) {
        const free = freeRects[i];
        if (
          bestX < free.x + free.w &&
          bestX + bestW > free.x &&
          bestY < free.y + free.h &&
          bestY + bestH > free.y
        ) {
          if (bestY > free.y && bestY < free.y + free.h) {
            freeRects.push({ x: free.x, y: free.y, w: free.w, h: bestY - free.y });
          }
          if (bestY + bestH < free.y + free.h) {
            freeRects.push({
              x: free.x,
              y: bestY + bestH,
              w: free.w,
              h: free.y + free.h - (bestY + bestH),
            });
          }
          if (bestX > free.x && bestX < free.x + free.w) {
            freeRects.push({ x: free.x, y: free.y, w: bestX - free.x, h: free.h });
          }
          if (bestX + bestW < free.x + free.w) {
            freeRects.push({
              x: bestX + bestW,
              y: free.y,
              w: free.x + free.w - (bestX + bestW),
              h: free.h,
            });
          }

          freeRects.splice(i, 1);
          i--;
        }
      }

      for (let i = 0; i < freeRects.length; i++) {
        for (let j = i + 1; j < freeRects.length; j++) {
          const r1 = freeRects[i];
          const r2 = freeRects[j];
          if (
            r1.x >= r2.x &&
            r1.y >= r2.y &&
            r1.x + r1.w <= r2.x + r2.w &&
            r1.y + r1.h <= r2.y + r2.h
          ) {
            freeRects.splice(i, 1);
            i--;
            break;
          }
          if (
            r2.x >= r1.x &&
            r2.y >= r1.y &&
            r2.x + r2.w <= r1.x + r1.w &&
            r2.y + r2.h <= r1.y + r1.h
          ) {
            freeRects.splice(j, 1);
            j--;
          }
        }
      }

      freeRects.sort((a, b) => a.y - b.y || a.x - b.x);
    });

    let totalRollLength = 0;
    placedPieces.forEach((p) => {
      if (p.y + p.h > totalRollLength) {
        totalRollLength = p.y + p.h;
      }
    });

    const totalUsedPrintAreaSqm = piecesToPlace.reduce(
      (acc, p) => acc + (p.w * p.h) / 10000,
      0
    );
    const totalRollAreaSqm = (rollWidthCm * totalRollLength) / 10000;
    const fullRollCapacityAreaSqm = (rollWidthCm * rollLengthCm) / 10000;

    const efficiencyPct =
      totalRollAreaSqm > 0
        ? Math.min(100, Math.round((totalUsedPrintAreaSqm / totalRollAreaSqm) * 100))
        : 100;
    const wastePct = 100 - efficiencyPct;

    const rollCapacityUsedPct =
      rollLengthCm > 0
        ? Math.min(100, Math.round((totalRollLength / rollLengthCm) * 100))
        : 0;

    const remainingRollLengthCm = Math.max(0, rollLengthCm - totalRollLength);
    const isOverflow = totalRollLength > rollLengthCm;

    return {
      placedPieces,
      totalRollLength,
      totalUsedPrintAreaSqm,
      totalRollAreaSqm,
      fullRollCapacityAreaSqm,
      efficiencyPct,
      wastePct,
      rollCapacityUsedPct,
      remainingRollLengthCm,
      isOverflow,
    };
  }, [waitingForPrintOrders, rollWidthCm, rollLengthCm, allowRotation]);

  // Xử lý Tạo Đơn Hàng Mới Trực Tiếp (CREATE)
  const handleCreateNewOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingOrder(true);

    try {
      const calculatedPrice = createUnitPrice * createQuantity;
      const payload: CreateOrderRequest = {
        totalAmount: calculatedPrice,
        note: createNote,
        items: [
          {
            categoryCode: createCategoryCode,
            productName: createProductName,
            widthCm: createWidthCm,
            heightCm: createHeightCm,
            quantity: createQuantity,
            materialCode: createCategoryCode.toLowerCase(),
            calculatedPrice: calculatedPrice,
          },
        ],
      };

      const created = await OrderService.createOrder(payload);

      // Cập nhật thông tin người nhận nếu có
      if (createRecipientName || createRecipientPhone || createRecipientAddress) {
        await OrderService.updateOrder(created.id, {
          recipientName: createRecipientName,
          recipientPhone: createRecipientPhone,
          recipientAddress: createRecipientAddress,
        });
      }

      setSubmitSuccess(`✓ Đã tạo thành công đơn hàng ${created.orderCode} (Trạng thái: Xác nhận đơn)!`);
      setShowCreateModal(false);
      // Reset form
      setCreateProductName('In Bạt Hiflex Silk');
      setCreateWidthCm(100);
      setCreateHeightCm(200);
      setCreateQuantity(1);
      setCreateUnitPrice(160000);
      setCreateRecipientName('');
      setCreateRecipientPhone('');
      setCreateRecipientAddress('');
      setCreateNote('');
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Tạo đơn hàng thất bại.');
    } finally {
      setCreatingOrder(false);
    }
  };

  // Xử lý Chuyển Toàn Bộ Đơn Đang Xếp Phủ Sang "Đang In"
  const handleConfirmNestingAndStartPrint = async () => {
    if (waitingForPrintOrders.length === 0) return;

    setNestingSubmitting(true);
    try {
      await Promise.all(
        waitingForPrintOrders.map((order) =>
          OrderService.updateOrder(order.id, { status: 'PRINTING' })
        )
      );

      setSubmitSuccess(
        `✓ Đã tối ưu xếp phủ và chuyển ${waitingForPrintOrders.length} đơn hàng sang trạng thái "Đang in" (PRINTING)!`
      );
      setShowNestingModal(false);
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Chuyển trạng thái Đang in thất bại.');
    } finally {
      setNestingSubmitting(false);
    }
  };

  // Xử lý chuyển đơn sang "Chờ giao"
  const handleMarkAsWaitingForDelivery = async (order: OrderResponse) => {
    try {
      await OrderService.updateOrder(order.id, { status: 'WAITING_FOR_DELIVERY' });
      setSubmitSuccess(`✓ Đơn hàng ${order.orderCode} đã in xong (Chuyển sang "Chờ Giao")!`);
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Chuyển sang Chờ Giao thất bại.');
    }
  };

  // Xử lý chuyển đơn sang "Xong đơn"
  const handleMarkAsCompleted = async (order: OrderResponse) => {
    try {
      await OrderService.updateOrder(order.id, { status: 'COMPLETED' });
      setSubmitSuccess(`✓ Đơn hàng ${order.orderCode} đã giao thành công (Chuyển sang "Xong Đơn")!`);
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Chuyển sang Xong Đơn thất bại.');
    }
  };

  // Xử lý Mở Modal Nộp File Corel
  const handleOpenCorelModal = (order: OrderResponse, task?: DesignTaskResponse) => {
    setSelectedOrder(order);
    if (task) {
      setSelectedTask(task);
    } else {
      const itemIds = order.items?.map((i) => i.id) || [];
      const foundTask = designTasks.find((t) => itemIds.includes(t.orderItemId));
      setSelectedTask(foundTask || null);
    }
    setSelectedFile(null);
    setSubmitSuccess(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadCorel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedFile) {
      alert('Vui lòng chọn một tệp Corel (.cdr) trước khi nộp.');
      return;
    }

    setSubmittingCorel(true);
    try {
      if (selectedTask) {
        await OrderService.uploadMultipartFile(selectedTask.id, selectedFile, 'SOURCE_COREL');
        await OrderService.updateDesignTaskStatus(
          selectedTask.id,
          'WAITING_FOR_PRINT',
          'Đã nộp tệp Corel hoàn chỉnh, sẵn sàng đợi in'
        );
      }

      await OrderService.updateOrder(selectedOrder.id, {
        status: 'WAITING_FOR_PRINT',
      });

      setSubmitSuccess(
        `✓ Đã lưu tệp Corel (${selectedFile.name}) vào ${DESIGN_STORAGE_PATH} thành công! Đơn hàng đã chuyển sang trạng thái "Đợi in".`
      );
      setSelectedOrder(null);
      setSelectedTask(null);
      setSelectedFile(null);
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi nộp tệp Corel.');
    } finally {
      setSubmittingCorel(false);
    }
  };

  // Xử lý Edit Modal (UPDATE - RUD)
  const handleOpenEditModal = (order: OrderResponse, defaultNextStatus?: string) => {
    setEditingOrder(order);
    setEditStatus(defaultNextStatus || order.status || 'CONFIRMED');
    setEditNote(order.note || '');
    setEditTotal(order.totalAmount || 0);
    setEditPaidAmount(order.paidAmount || 0);
    setEditPaymentStatus(order.paymentStatus || 'UNPAID');
    setEditPaymentMethod(order.paymentMethod || 'CASH');
    setEditRecipientName(order.recipientName || '');
    setEditRecipientPhone(order.recipientPhone || '');
    setEditRecipientAddress(order.recipientAddress || '');
    setEditItemSpecs(
      order.items?.map((item) => ({
        id: item.id,
        productName: item.productName || 'Sản phẩm in',
        widthCm: item.widthCm || 100,
        heightCm: item.heightCm || 100,
        quantity: item.quantity || 1,
      })) || []
    );
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    setUpdating(true);
    try {
      await OrderService.updateOrder(editingOrder.id, {
        status: editStatus,
        note: editNote,
        totalAmount: editTotal,
        recipientName: editRecipientName,
        recipientPhone: editRecipientPhone,
        recipientAddress: editRecipientAddress,
        paidAmount: editPaidAmount,
        paymentStatus: editPaymentStatus,
        paymentMethod: editPaymentMethod,
        items: editItemSpecs.map((i) => ({
          widthCm: Number(i.widthCm),
          heightCm: Number(i.heightCm),
          quantity: Number(i.quantity),
        })),
      });
      setEditingOrder(null);
      setSubmitSuccess(`✓ Đã cập nhật thành công thông tin & thanh toán cho đơn ${editingOrder.orderCode}!`);
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Cập nhật thất bại.');
    } finally {
      setUpdating(false);
    }
  };

  // Xử lý Delete Modal (DELETE - RUD)
  const handleConfirmDelete = async () => {
    if (!deletingOrder) return;

    setDeleting(true);
    try {
      await OrderService.deleteOrder(deletingOrder.id);
      setDeletingOrder(null);
      setSubmitSuccess(`✓ Đã xóa thành công đơn hàng ${deletingOrder.orderCode}!`);
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Xóa đơn hàng thất bại.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtering orders
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus;
    const matchesSearch =
      order.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items?.some((i) => i.productName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.recipientPhone?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-300">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            Chờ xác nhận (Nháp)
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-300">
            <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
            Xác nhận đơn
          </span>
        );
      case 'DESIGNING':
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Thiết kế
          </span>
        );
      case 'WAITING_FOR_PRINT':
      case 'APPROVED_FOR_PRINT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-900 border border-sky-300">
            <FileCode className="w-3.5 h-3.5 text-sky-600" />
            Đợi in
          </span>
        );
      case 'PRINTING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-300">
            <Printer className="w-3.5 h-3.5 text-purple-600" />
            Đang in
          </span>
        );
      case 'WAITING_FOR_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-900 border border-indigo-300">
            <Truck className="w-3.5 h-3.5 text-indigo-600" />
            Chờ Giao
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Xong đơn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-300">
            <AlertCircle className="w-3.5 h-3.5 text-zinc-500" />
            {ORDER_STATUS_LABELS[status] || status}
          </span>
        );
    }
  };

  const getPaymentBadge = (paymentStatus?: string, paidAmount?: number, remainingAmount?: number) => {
    if (paymentStatus === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
          🟢 Thanh toán đủ 100%
        </span>
      );
    } else if (paymentStatus === 'PARTIALLY_PAID') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
          🟠 Cọc: {formatCurrency(paidAmount || 0)} (Nợ: {formatCurrency(remainingAmount || 0)})
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-800 border border-red-300">
          🔴 Chưa thanh toán
        </span>
      );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Cart Management Banner Widget */}
      {cartItems.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-100/50 to-orange-500/10 border-2 border-amber-400/60 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500 text-zinc-950 rounded-2xl shadow-md font-bold shrink-0">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-amber-950 text-sm flex items-center gap-2">
                Quản Lý Giỏ Hàng Đang Chờ Chốt Đơn ({cartItems.length} sản phẩm)
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[10px] font-mono font-bold">
                  DRAFT CART
                </span>
              </div>
              <p className="text-xs text-amber-900 mt-0.5 font-medium">
                Tổng tạm tính sản phẩm trong giỏ:{' '}
                <strong className="font-mono font-bold text-emerald-800 text-sm">
                  {formatCurrency(totalCartAmount)}
                </strong>
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {cartItems.slice(0, 3).map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-amber-300/80 rounded-xl text-[11px] font-semibold text-zinc-800 shadow-2xs"
                  >
                    • {item.productName} ({item.widthCm}x{item.heightCm}cm):{' '}
                    <span className="font-mono font-bold text-emerald-700">
                      {formatCurrency(item.calculatedPrice)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-zinc-400 hover:text-red-600 font-bold ml-1 cursor-pointer"
                      title="Xóa món"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {cartItems.length > 3 && (
                  <span className="text-[11px] font-bold text-amber-900">
                    + {cartItems.length - 3} món khác...
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              🚀 Mở Giỏ Hàng & Tiến Hành Thanh Toán
            </button>
          </div>
        </div>
      )}

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

      {/* Filter and Search Control Bar với nút Tạo Đơn & Xếp Phủ 2D */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm theo Mã đơn, Sản phẩm, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 text-zinc-900"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 no-scrollbar">
          <Filter className="w-4 h-4 text-zinc-500 shrink-0 mr-1" />
          {[
            { code: 'ALL', name: 'Tất Cả' },
            { code: 'PENDING', name: 'Chờ Xác Nhận' },
            { code: 'DESIGNING', name: 'Thiết Kế' },
            { code: 'WAITING_FOR_PRINT', name: 'Đợi In' },
            { code: 'PRINTING', name: 'Đang In' },
            { code: 'WAITING_FOR_DELIVERY', name: 'Chờ Giao' },
            { code: 'COMPLETED', name: 'Xong Đơn' },
          ].map((tab) => (
            <button
              key={tab.code}
              onClick={() => setFilterStatus(tab.code)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                filterStatus === tab.code
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Order Cards Grid (READ & RUD) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-zinc-700" />
          <p className="text-sm font-medium">Đang tải dữ liệu sản phẩm đơn hàng...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
          {error}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
          <PackageCheck className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-zinc-800">Không tìm thấy đơn hàng nào</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
            Bấm "Tạo Đơn Hàng Mới" để thêm đơn hàng trực tiếp tại xưởng.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo Đơn Hàng Mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const itemIds = order.items?.map((i) => i.id) || [];
            const relatedTask = designTasks.find((t) => itemIds.includes(t.orderItemId));
            const corelFiles = relatedTask?.files?.filter((f) => f.fileType === 'SOURCE_COREL') || [];
            const hasCorelFile = corelFiles.length > 0;

            return (
              <Card
                key={order.id}
                className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-sm flex flex-col justify-between hover:border-indigo-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between pb-3 mb-3 border-b border-zinc-100">
                    <div>
                      <span className="text-xs font-mono font-bold text-zinc-900 block">
                        {order.orderCode}
                      </span>
                      <div className="mt-1">
                        {getPaymentBadge(order.paymentStatus, order.paidAmount, order.remainingAmount)}
                      </div>
                      <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  {/* Order Items specs & Per-Item Corel Upload */}
                  <div className="space-y-3 mb-4">
                    {order.items?.map((item) => {
                      const itemTask = designTasks.find((t) => t.orderItemId === item.id);
                      const itemCorelFiles = itemTask?.files?.filter((f) => f.fileType === 'SOURCE_COREL') || [];

                      return (
                        <div key={item.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-2">
                          <div className="font-semibold text-zinc-900 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-bold">
                              <Tag className="w-3.5 h-3.5 text-zinc-500" />
                              {item.productName}
                            </span>
                            <span className="font-mono text-zinc-700 font-bold">
                              {formatCurrency(item.calculatedPrice)}
                            </span>
                          </div>

                          <div className="text-[11px] text-zinc-600 grid grid-cols-2 gap-1 font-mono">
                            {item.widthCm && item.heightCm && (
                              <div>Kích thước: {item.widthCm} x {item.heightCm} cm</div>
                            )}
                            <div>Số lượng: {item.quantity}</div>
                            {item.materialCode && (
                              <div>Vật liệu: {item.materialCode}</div>
                            )}
                            <div>Hạng mục: {item.categoryCode}</div>
                          </div>

                          {/* Per-Item Corel Upload Button & Status */}
                          <div className="pt-2 border-t border-zinc-200/80 flex items-center justify-between gap-2">
                            {itemCorelFiles.length > 0 ? (
                              <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 truncate">
                                🟢 Corel: {itemCorelFiles[0].fileName}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                                🟡 Chưa nộp file Corel
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => setSplitModalOrderCode(order.orderCode)}
                              className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 text-amber-300 font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition shrink-0 shadow-2xs"
                            >
                              <Upload className="w-3 h-3 text-amber-400" />
                              {itemCorelFiles.length > 0 ? 'Đổi File' : '📁 Nộp File Corel'}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Recipient Delivery Info */}
                    {(order.recipientName || order.recipientPhone || order.recipientAddress) && (
                      <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-xs space-y-1 text-purple-950 font-mono">
                        <div className="font-bold text-purple-900 flex items-center gap-1.5 font-sans">
                          <Truck className="w-3.5 h-3.5 text-purple-600" /> Thông tin giao nhận:
                        </div>
                        {order.recipientName && <div>• Người nhận: <strong>{order.recipientName}</strong></div>}
                        {order.recipientPhone && <div>• SĐT: <strong>{order.recipientPhone}</strong></div>}
                        {order.recipientAddress && <div>• Địa chỉ: {order.recipientAddress}</div>}
                      </div>
                    )}

                    {order.note && (
                      <p className="text-xs text-zinc-600 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                        Ghi chú: {order.note}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  {/* Dynamic Action Buttons per Status */}
                  <div className="mb-3">
                    {order.status === 'CONFIRMED' ? (
                      <button
                        onClick={() => handleOpenEditModal(order, 'DESIGNING')}
                        className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer transition animate-pulse"
                      >
                        <Edit3 className="w-4 h-4" />
                        Xác Nhận & Cập Nhật Đơn (Chuyển "Thiết Kế")
                      </button>
                    ) : order.status === 'DESIGNING' ? (
                      <button
                        onClick={() => setSplitModalOrderCode(order.orderCode)}
                        className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-sm cursor-pointer transition animate-pulse"
                      >
                        <Upload className="w-4 h-4 text-zinc-950" />
                        🎨 Tách Món & Nộp File Corel (.cdr) Tất Cả Sản Phẩm
                      </button>
                    ) : order.status === 'WAITING_FOR_PRINT' || order.status === 'APPROVED_FOR_PRINT' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowNestingModal(true)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer transition"
                        >
                          <Layers className="w-4 h-4" />
                          Xếp Phủ 2D
                        </button>
                        <button
                          onClick={() => handleOpenCorelModal(order, relatedTask)}
                          className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 cursor-pointer transition"
                          title="Nộp lại file Corel"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      </div>
                    ) : order.status === 'PRINTING' ? (
                      <button
                        onClick={() => handleMarkAsWaitingForDelivery(order)}
                        className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm cursor-pointer transition"
                      >
                        <Truck className="w-4 h-4 text-purple-200" />
                        Xác Nhận In Xong (Chuyển "Chờ Giao")
                      </button>
                    ) : order.status === 'WAITING_FOR_DELIVERY' ? (
                      <button
                        onClick={() => handleMarkAsCompleted(order)}
                        className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm cursor-pointer transition"
                      >
                        <CheckCircle className="w-4 h-4 text-sky-200" />
                        Xác Nhận Giao Hàng (Chuyển "Xong Đơn")
                      </button>
                    ) : (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        Đã Giao Xong — Hoàn Tất ("Xong Đơn")
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <div className="text-xs font-mono font-bold text-zinc-950">
                      Tổng: {formatCurrency(order.totalAmount)}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(order)}
                        className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                        title="Chỉnh sửa đơn hàng (Update)"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingOrder(order)}
                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                        title="Xóa đơn hàng (Delete)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Popup Máy Tính Giá Báo Giá & Tạo Đơn Hàng Tự Động (CREATE) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-50 rounded-3xl shadow-2xl max-w-6xl w-full flex flex-col max-h-[92vh] overflow-hidden border border-zinc-200 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-600 text-white">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    Máy Tính Giá Báo Giá & Tạo Đơn Hàng Mới
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">
                    Chọn sản phẩm in, nhập thông số kích thước/số lượng để tự động tính đơn giá và tạo đơn hàng.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body with full Pricing Calculator Feature */}
            <div className="p-6 overflow-y-auto flex-1 bg-zinc-100/70">
              <PricingFeature
                hideHeader={true}
                onOrderCreated={(orderCode) => {
                  setSubmitSuccess(`✓ Đã tạo thành công đơn hàng ${orderCode} (Trạng thái: Xác nhận đơn)!`);
                  setShowCreateModal(false);
                  fetchData();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Order (UPDATE - RUD) */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-zinc-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                Cập Nhật Đơn Hàng ({editingOrder.orderCode})
              </h3>
              <button
                onClick={() => setEditingOrder(null)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUpdate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Mã Đơn Hàng:</label>
                  <input
                    type="text"
                    disabled
                    value={editingOrder.orderCode}
                    className="w-full px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-lg font-mono font-bold text-zinc-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Trạng Thái Đơn Hàng:</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 font-semibold text-zinc-900"
                  >
                    <option value="CONFIRMED">Xác nhận đơn</option>
                    <option value="DESIGNING">Thiết kế</option>
                    <option value="WAITING_FOR_PRINT">Đợi in</option>
                    <option value="PRINTING">Đang in</option>
                    <option value="WAITING_FOR_DELIVERY">Chờ Giao</option>
                    <option value="COMPLETED">Xong đơn</option>
                  </select>
                </div>
              </div>

              {/* Item Specs editing */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
                <div className="font-bold text-zinc-900 text-xs border-b border-zinc-200 pb-2">
                  Chỉnh Sửa Kích Thước & Số Lượng Sản Phẩm
                </div>
                {editItemSpecs.map((item, idx) => (
                  <div key={item.id} className="space-y-2">
                    <div className="font-semibold text-zinc-800 text-[11px]">• {item.productName}</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-zinc-600 mb-0.5">Ngang (cm):</label>
                        <input
                          type="number"
                          min={1}
                          value={item.widthCm}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value));
                            setEditItemSpecs((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, widthCm: val } : it))
                            );
                          }}
                          className="w-full px-2 py-1.5 border border-zinc-300 rounded-lg text-xs font-mono font-bold text-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-600 mb-0.5">Cao (cm):</label>
                        <input
                          type="number"
                          min={1}
                          value={item.heightCm}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value));
                            setEditItemSpecs((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, heightCm: val } : it))
                            );
                          }}
                          className="w-full px-2 py-1.5 border border-zinc-300 rounded-lg text-xs font-mono font-bold text-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-600 mb-0.5">Số Lượng:</label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value));
                            setEditItemSpecs((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, quantity: val } : it))
                            );
                          }}
                          className="w-full px-2 py-1.5 border border-zinc-300 rounded-lg text-xs font-mono font-bold text-zinc-900"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recipient info editing */}
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 space-y-3">
                <div className="font-bold text-purple-900 flex items-center gap-1.5 text-xs">
                  <Truck className="w-4 h-4 text-purple-600" />
                  Thông Tin Người Nhận / Giao Hàng (Không bắt buộc)
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-purple-900 mb-1">Tên Người Nhận:</label>
                    <input
                      type="text"
                      value={editRecipientName}
                      onChange={(e) => setEditRecipientName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-3 py-1.5 border border-purple-200 bg-white rounded-lg text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-purple-900 mb-1">Số Điện Thoại:</label>
                    <input
                      type="text"
                      value={editRecipientPhone}
                      onChange={(e) => setEditRecipientPhone(e.target.value)}
                      placeholder="0901234567"
                      className="w-full px-3 py-1.5 border border-purple-200 bg-white rounded-lg font-mono text-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-purple-900 mb-1">Địa Chỉ Giao Hàng:</label>
                  <input
                    type="text"
                    value={editRecipientAddress}
                    onChange={(e) => setEditRecipientAddress(e.target.value)}
                    placeholder="Số 123 đường ABC, Q.1, TP.HCM"
                    className="w-full px-3 py-1.5 border border-purple-200 bg-white rounded-lg text-zinc-900"
                  />
                </div>
              </div>

              {/* Payment & Debt Editing */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
                <div className="font-bold text-emerald-950 flex items-center justify-between text-xs">
                  <span>Thanh Toán & Nợ Công Đơn Hàng</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditPaidAmount(editTotal);
                      setEditPaymentStatus('PAID');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition cursor-pointer"
                  >
                    🟢 Xác Nhận Đã Thu Đủ 100%
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-emerald-900 mb-1">Tổng Tiền Đơn (VNĐ):</label>
                    <input
                      type="number"
                      value={editTotal}
                      onChange={(e) => setEditTotal(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-emerald-200 bg-white rounded-lg font-mono font-bold text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-emerald-900 mb-1">Đã Thanh Toán / Cọc (VNĐ):</label>
                    <input
                      type="number"
                      value={editPaidAmount}
                      onChange={(e) => {
                        const paid = Number(e.target.value);
                        setEditPaidAmount(paid);
                        if (paid >= editTotal && editTotal > 0) setEditPaymentStatus('PAID');
                        else if (paid > 0) setEditPaymentStatus('PARTIALLY_PAID');
                        else setEditPaymentStatus('UNPAID');
                      }}
                      className="w-full px-3 py-1.5 border border-emerald-200 bg-white rounded-lg font-mono font-bold text-zinc-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                  <span className="text-zinc-600">Còn nợ chưa thu:</span>
                  <span className="font-bold text-amber-700">
                    {formatCurrency(Math.max(0, editTotal - editPaidAmount))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Ghi Chú Đơn Hàng:</label>
                <textarea
                  rows={2}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-zinc-900"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 rounded-xl text-zinc-600 hover:bg-zinc-100 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete Order (DELETE - RUD) */}
      {deletingOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-zinc-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100">
              <h3 className="text-base font-bold text-red-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Xác Nhận Xóa Đơn Hàng
              </h3>
              <button
                onClick={() => setDeletingOrder(null)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-700">
              <p>
                Bạn có chắc chắn muốn xóa đơn hàng{' '}
                <strong className="font-mono text-zinc-900">{deletingOrder.orderCode}</strong> không?
              </p>
              <div className="p-3 bg-red-50 rounded-xl text-red-800 text-[11px] font-medium border border-red-200 leading-relaxed">
                ⚠️ Hành động này sẽ xóa toàn bộ sản phẩm in và các nhiệm vụ thiết kế liên quan. Thao tác này không thể hoàn tác!
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingOrder(null)}
                className="px-4 py-2 rounded-xl text-zinc-600 hover:bg-zinc-100 font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xóa Đơn Hàng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xếp Phủ Khổ In (2D Nesting Optimizer) */}
      {showNestingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[92vh] overflow-hidden border border-zinc-200 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    Xếp Phủ Tối Ưu Khổ In 2D (MaxRects Bin Packing)
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">
                    Tự động xếp kín các mẫu in trên cuộn vải bạt để tiết kiệm nguyên liệu tối đa.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowNestingModal(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Control Column */}
                <div className="space-y-4">
                  <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200 space-y-4">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-indigo-600" />
                      1. Cấu Hình Cuộn Vải / In
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">
                          Chiều Ngang Cuộn (cm):
                        </label>
                        <input
                          type="number"
                          min={10}
                          max={1000}
                          value={rollWidthCm}
                          onChange={(e) => setRollWidthCm(Math.max(10, Number(e.target.value)))}
                          className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:ring-2 focus:ring-zinc-900 font-mono"
                          placeholder="Nhập chiều ngang cm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">
                          Chiều Dài Cuộn (m):
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={rollLengthCm / 100}
                          onChange={(e) => setRollLengthCm(Math.max(100, Number(e.target.value) * 100))}
                          className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:ring-2 focus:ring-zinc-900 font-mono"
                          placeholder="Nhập chiều dài m"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                        <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                        Cho Phép Tự Động Xoay 90°:
                      </label>
                      <input
                        type="checkbox"
                        checked={allowRotation}
                        onChange={(e) => setAllowRotation(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Indicators */}
                  <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                      2. Chỉ Số Tối Ưu Hóa
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                        <div className="text-[10px] text-blue-700 font-semibold uppercase">Hiệu Suất Dàn</div>
                        <div className="text-2xl font-black text-blue-950 font-mono">
                          {nestingResult.efficiencyPct}%
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                        <div className="text-[10px] text-purple-700 font-semibold uppercase">Tỷ Lệ Xả Cuộn</div>
                        <div className="text-2xl font-black text-purple-950 font-mono">
                          {nestingResult.rollCapacityUsedPct}%
                        </div>
                      </div>
                    </div>

                    <div className="text-xs space-y-2 font-mono pt-2 border-t border-zinc-100 text-zinc-700">
                      <div className="flex justify-between">
                        <span>Dài tiêu tốn / Tổng cuộn:</span>
                        <span className="font-bold text-zinc-900">
                          {(nestingResult.totalRollLength / 100).toFixed(2)}m / {(rollLengthCm / 100).toFixed(2)}m
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>Cuộn vải còn dư lại:</span>
                        <span className="font-bold text-emerald-600">
                          {(nestingResult.remainingRollLengthCm / 100).toFixed(2)}m
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Canvas Display Column */}
                <div className="lg:col-span-2 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <Maximize2 className="w-4 h-4 text-emerald-600" />
                      Sơ Đồ Trực Quan Bản Dàn Khổ In MaxRects ({nestingResult.placedPieces.length} Mẫu)
                    </h4>
                  </div>

                  <div className="flex-1 min-h-[350px] max-h-[500px] overflow-y-auto border-2 border-dashed border-zinc-300 rounded-2xl p-4 bg-zinc-100 relative no-scrollbar">
                    {nestingResult.placedPieces.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-zinc-400 py-16">
                        <Layers className="w-12 h-12 mb-2" />
                        <p className="text-xs font-semibold">Chưa có đơn hàng nào ở trạng thái "Đợi In"</p>
                      </div>
                    ) : (
                      <div
                        className="relative bg-white border border-zinc-400 rounded-xl shadow-inner mx-auto transition-all"
                        style={{
                          width: '100%',
                          maxWidth: '560px',
                          height: `${Math.max(300, nestingResult.totalRollLength * (560 / rollWidthCm))}px`,
                        }}
                      >
                        {/* Scale Marker */}
                        <div className="absolute top-2 left-2 text-[9px] font-mono font-bold text-zinc-400 bg-white/80 px-1 rounded">
                          ← Khổ cuộn vải: {rollWidthCm} cm →
                        </div>

                        {/* Nested Pieces */}
                        {nestingResult.placedPieces.map((piece) => {
                          const scale = 560 / rollWidthCm;
                          return (
                            <div
                              key={piece.id}
                              className="absolute rounded-lg border-2 border-white text-white font-mono text-[10px] p-1 flex flex-col justify-between overflow-hidden shadow-sm transition-all hover:scale-[1.02] hover:z-10 cursor-pointer"
                              style={{
                                left: `${piece.x * scale}px`,
                                top: `${piece.y * scale}px`,
                                width: `${piece.w * scale}px`,
                                height: `${piece.h * scale}px`,
                                backgroundColor: piece.color,
                              }}
                              title={`${piece.orderCode}: ${piece.productName} (${piece.w}x${piece.h} cm)`}
                            >
                              <div className="font-bold truncate leading-tight">
                                {piece.orderCode}
                              </div>
                              <div className="text-[9px] font-bold opacity-90 truncate">
                                {piece.w}x{piece.h}cm {piece.rotated ? '🔄' : ''}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-zinc-200 flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-medium">
                Xác nhận sơ đồ xếp phủ sẽ chuyển tất cả đơn "Đợi in" ➔ "Đang in"
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNestingModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-600 hover:bg-zinc-100 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  disabled={nestingSubmitting || waitingForPrintOrders.length === 0}
                  onClick={handleConfirmNestingAndStartPrint}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {nestingSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      Xác Nhận Xếp Phủ & Chuyển Đang In ({waitingForPrintOrders.length} Đơn)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nộp File Corel (.cdr) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-zinc-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-amber-600" />
                Nộp Tệp CorelDRAW (.cdr) Cho Đơn Hàng
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadCorel} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Mã Đơn Hàng:</label>
                <input
                  type="text"
                  disabled
                  value={selectedOrder.orderCode}
                  className="w-full px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-lg font-mono font-bold text-zinc-800"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  Tải Tệp Corel (.cdr) Từ Máy Tính:
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".cdr,.pdf,.ai,.eps,.zip,.rar"
                    onChange={handleFileChange}
                    className="hidden"
                    id="employee-corel-input"
                  />
                  <label
                    htmlFor="employee-corel-input"
                    className="w-full flex items-center justify-center gap-2 p-3.5 border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-xl bg-amber-50/50 hover:bg-amber-100/50 text-zinc-800 cursor-pointer transition"
                  >
                    <FileUp className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold">
                      {selectedFile ? selectedFile.name : 'Bấm vào đây để chọn tệp .cdr từ máy tính'}
                    </span>
                  </label>
                </div>
                {selectedFile && (
                  <p className="mt-1 text-[11px] text-emerald-600 font-medium">
                    ✓ Đã chọn: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  Thư mục lưu trữ trên máy chủ:
                </label>
                <div className="w-full flex items-center gap-2 px-3 py-2 border border-zinc-200 bg-zinc-100 rounded-lg text-zinc-800 font-mono">
                  <HardDrive className="w-4 h-4 text-blue-600" />
                  {DESIGN_STORAGE_PATH}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-xl text-zinc-600 hover:bg-zinc-100 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingCorel || !selectedFile}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {submittingCorel ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang nộp...
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      Xác Nhận Nộp & Chuyển "Đợi In"
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tách Sản Phẩm Nộp File Thiết Kế Corel (.cdr) */}
      <DesignTaskSplitModal
        orderCode={splitModalOrderCode}
        isOpen={!!splitModalOrderCode}
        onClose={() => {
          setSplitModalOrderCode(null);
          fetchData();
        }}
      />
    </div>
  );
}
