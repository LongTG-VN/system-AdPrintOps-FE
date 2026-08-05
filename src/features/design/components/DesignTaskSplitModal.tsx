'use client';

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import {
  FileCode,
  Upload,
  CheckCircle2,
  Loader2,
  X,
  FileCheck,
  AlertCircle,
  HardDrive,
  Layers,
  Sparkles,
  Tag,
  Package,
} from 'lucide-react';
import { OrderService } from '@/features/orders/services/order.service';
import { OrderResponse, DesignTaskResponse, OrderItemResponse } from '@/features/orders/types/order.types';

interface DesignTaskSplitModalProps {
  orderCode: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DesignTaskSplitModal({ orderCode, isOpen, onClose }: DesignTaskSplitModalProps) {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [designTasks, setDesignTasks] = useState<DesignTaskResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Per-task selected file & upload status state map: { taskId: File }
  const [selectedFiles, setSelectedFiles] = useState<Record<number, File>>({});
  const [uploadingTasks, setUploadingTasks] = useState<Record<number, boolean>>({});
  const [uploadSuccessTasks, setUploadSuccessTasks] = useState<Record<number, string>>({});

  const loadOrderAndTasks = useCallback(async () => {
    if (!orderCode) return;
    setLoading(true);
    setError(null);
    try {
      const fetchedOrder = await OrderService.getOrderByCode(orderCode);
      setOrder(fetchedOrder);

      const allTasks = await OrderService.getAllDesignTasks();
      // Filter tasks belonging to this order's items
      const itemIds = new Set(fetchedOrder.items.map((i) => i.id));
      const orderTasks = allTasks.filter((t) => itemIds.has(t.orderItemId));
      setDesignTasks(orderTasks);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu đơn hàng và file thiết kế.');
    } finally {
      setLoading(false);
    }
  }, [orderCode]);

  useEffect(() => {
    if (isOpen && orderCode) {
      loadOrderAndTasks();
    }
  }, [isOpen, orderCode, loadOrderAndTasks]);

  if (!isOpen || !orderCode) return null;

  const handleFileSelect = (taskId: number, file: File) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [taskId]: file,
    }));
  };

  const handleUploadSingleTaskFile = async (task: DesignTaskResponse, item: OrderItemResponse) => {
    const file = selectedFiles[task.id];
    if (!file) {
      alert(`Vui lòng chọn tệp Corel (.cdr) cho sản phẩm "${item.productName}".`);
      return;
    }

    setUploadingTasks((prev) => ({ ...prev, [task.id]: true }));
    try {
      await OrderService.uploadMultipartFile(task.id, file, 'SOURCE_COREL');
      await OrderService.updateDesignTaskStatus(
        task.id,
        'WAITING_FOR_PRINT',
        `Đã nộp tệp Corel cho ${item.productName}`
      );

      setUploadSuccessTasks((prev) => ({
        ...prev,
        [task.id]: `✓ Đã nộp thành công tệp "${file.name}" cho món ${item.productName}!`,
      }));

      // Reload tasks to show updated attached files
      await loadOrderAndTasks();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Upload tệp thiết kế thất bại.');
    } finally {
      setUploadingTasks((prev) => ({ ...prev, [task.id]: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 flex flex-col animate-in zoom-in-95">
        {/* Header Modal */}
        <div className="p-5 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white flex items-center justify-between border-b border-indigo-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-zinc-950 font-black shadow-lg">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-lg tracking-tight flex items-center gap-2">
                Tách Sản Phẩm Nộp File Thiết Kế Corel (.cdr)
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-indigo-200 font-medium">
                Đơn Hàng: <strong className="text-amber-300 font-mono">{orderCode}</strong> • Tách từng món in độc lập để nhét file
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-indigo-300 hover:text-white rounded-xl hover:bg-indigo-900 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Split Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50 space-y-4 text-xs">
          {loading ? (
            <div className="p-12 text-center text-zinc-500 font-bold flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              Đang tách hồ sơ sản phẩm & file thiết kế...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          ) : !order || order.items.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 font-bold bg-white rounded-2xl border border-dashed">
              Không tìm thấy sản phẩm nào trong đơn hàng.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl font-bold text-amber-950 flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-600" />
                  Đơn hàng đã tách thành <strong>{order.items.length} món in</strong> độc lập
                </span>
                <span className="font-mono text-amber-800 font-normal">D:\Design\SOURCE_COREL</span>
              </div>

              {/* Grid of Separated Items */}
              <div className="grid grid-cols-1 gap-4">
                {order.items.map((item, index) => {
                  // Match task for this item
                  const task = designTasks.find((t) => t.orderItemId === item.id);
                  const isUploading = task ? uploadingTasks[task.id] : false;
                  const successMsg = task ? uploadSuccessTasks[task.id] : null;
                  const selectedFile = task ? selectedFiles[task.id] : null;

                  return (
                    <div
                      key={item.id}
                      className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-2xs space-y-3"
                    >
                      {/* Item Header */}
                      <div className="flex items-start justify-between border-b border-zinc-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-indigo-950 text-amber-400 font-black text-xs flex items-center justify-center font-mono shrink-0">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900 text-sm">{item.productName}</div>
                            <div className="text-[11px] text-zinc-500 font-mono">
                              Khổ in: {item.widthCm} x {item.heightCm} cm • Số lượng: {item.quantity} • MãVL: {item.materialCode || item.categoryCode}
                            </div>
                          </div>
                        </div>

                        {task && (
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                              task.files && task.files.length > 0
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {task.files && task.files.length > 0
                              ? `🟢 Đã có ${task.files.length} File Corel`
                              : '🟡 Đợi nhét file Corel'}
                          </span>
                        )}
                      </div>

                      {/* Existing Attached Files List */}
                      {task && task.files && task.files.length > 0 && (
                        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1.5">
                          <div className="font-bold text-zinc-700 text-[11px]">Tệp thiết kế đã nhét:</div>
                          {task.files.map((file) => (
                            <div
                              key={file.id}
                              className="p-2 bg-white rounded-lg border border-zinc-200 text-[11px] font-mono flex items-center justify-between text-zinc-800"
                            >
                              <span className="truncate font-semibold text-emerald-800">
                                📄 {file.fileName} (V{file.versionNumber})
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                {(file.fileSizeBytes / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Success Alert */}
                      {successMsg && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl font-bold text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{successMsg}</span>
                        </div>
                      )}

                      {/* File Upload Input & Submit */}
                      {task && (
                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                          <label className="flex-1 w-full flex items-center gap-2 px-3 py-2 bg-zinc-50 hover:bg-zinc-100 border border-dashed border-zinc-300 rounded-xl cursor-pointer transition text-xs font-semibold text-zinc-700 truncate">
                            <Upload className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span className="truncate font-mono">
                              {selectedFile ? selectedFile.name : 'Click để chọn tệp Corel (.cdr, .pdf, .zip)...'}
                            </span>
                            <input
                              type="file"
                              accept=".cdr,.pdf,.ai,.eps,.zip,.rar,.png,.jpg,.tif"
                              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  handleFileSelect(task.id, e.target.files[0]);
                                }
                              }}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => handleUploadSingleTaskFile(task, item)}
                            disabled={isUploading || !selectedFile}
                            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang nhét file...
                              </>
                            ) : (
                              <>
                                <FileCheck className="w-4 h-4" />
                                📁 Nhét File Món #{index + 1}
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-4 bg-zinc-100 border-t border-zinc-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
          >
            ✓ Hoàn Tất & Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
