'use client';

import React, { useEffect, useState, useCallback, ChangeEvent } from 'react';
import {
  FileCode,
  Upload,
  CheckCircle,
  Clock,
  Printer,
  FileCheck,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Tag,
  Calendar,
  ExternalLink,
  HardDrive,
  FileUp,
} from 'lucide-react';
import { Card } from '@/shared/components/ui/card';
import { OrderService } from '@/features/orders/services/order.service';
import { DesignTaskResponse } from '@/features/orders/types/order.types';
import Link from 'next/link';

const DESIGN_STORAGE_PATH = 'D:\\Design';

export default function EmployeeDesignManagementPage() {
  const [tasks, setTasks] = useState<DesignTaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State cho Nộp tệp Corel
  const [selectedTask, setSelectedTask] = useState<DesignTaskResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await OrderService.getAllDesignTasks();
      setTasks(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể kết nối danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    OrderService.getAllDesignTasks()
      .then((data) => {
        if (active) setTasks(data);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Không thể kết nối danh sách đơn hàng.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleOpenUploadModal = (task: DesignTaskResponse) => {
    setSelectedTask(task);
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
    if (!selectedTask || !selectedFile) {
      alert('Vui lòng chọn một tệp thiết kế trước khi nộp.');
      return;
    }

    setSubmitting(true);
    try {
      await OrderService.uploadMultipartFile(selectedTask.id, selectedFile, 'SOURCE_COREL');
      await OrderService.updateDesignTaskStatus(
        selectedTask.id,
        'WAITING_FOR_PRINT',
        'Đã nộp tệp Corel hoàn chỉnh, sẵn sàng đợi in'
      );

      setSubmitSuccess(`Đã lưu tệp Corel (${selectedFile.name}) vào ${DESIGN_STORAGE_PATH} thành công!`);
      setSelectedTask(null);
      setSelectedFile(null);
      fetchTasks();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi khi nộp tệp Corel');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-300">
            <CheckCircle className="w-3.5 h-3.5 text-zinc-600" />
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-300">
            <FileCode className="w-3.5 h-3.5 text-blue-600" />
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
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            In xong
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-300">
            <AlertCircle className="w-3.5 h-3.5 text-zinc-500" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-900/50">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Quản Lý Tệp Thiết Kế Corel (.cdr) <FileCode className="w-6 h-6 text-amber-400" />
          </h1>
          <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
            Tách từng sản phẩm và nộp tệp thiết kế gốc CorelDRAW vào thư mục lưu trữ {DESIGN_STORAGE_PATH}.
          </p>
        </div>

        <button
          onClick={fetchTasks}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-xl text-xs shadow-md transition cursor-pointer shrink-0"
        >
          Tải Lại Danh Sách
        </button>
      </div>

      <main>
        {submitSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            {submitSuccess}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-zinc-700" />
            <p className="text-sm font-medium">Đang tải danh sách nhiệm vụ thiết kế...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-bold">
            {error}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm">
            <Printer className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-zinc-800">Chưa có nhiệm vụ thiết kế nào</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
              Vào trang Quản Lý Đơn Hàng để tạo đơn đầu tiên, sau đó quay lại nộp tệp Corel tại đây.
            </p>
            <Link
              href="/employee"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-950 text-white text-xs font-bold rounded-xl hover:bg-indigo-900 transition"
            >
              Về Trang Quản Lý Đơn Hàng
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => {
              const corelFiles = task.files?.filter((f) => f.fileType === 'SOURCE_COREL') || [];
              const hasCorelFile = corelFiles.length > 0;

              return (
                <Card key={task.id} className="p-5 bg-white border border-zinc-200 rounded-3xl shadow-xs flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-zinc-100">
                      <div>
                        <span className="text-xs font-mono font-bold text-zinc-900 block">
                          {task.taskCode}
                        </span>
                        <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          {new Date(task.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div>{getStatusBadge(task.status)}</div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="text-xs font-bold text-zinc-800 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-indigo-600" />
                        {task.designerNote || 'Sản phẩm in ấn'}
                      </div>

                      {hasCorelFile && (
                        <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs">
                          <div className="font-bold text-blue-900 flex items-center gap-1.5 mb-1.5">
                            <FileCode className="w-4 h-4 text-blue-600" />
                            Tệp Corel đã nộp:
                          </div>
                          {corelFiles.map((file) => {
                            const isUrl = file.filePath?.startsWith('http');
                            return (
                              <div key={file.id} className="mt-1 space-y-1">
                                <div className="text-zinc-800 font-mono font-bold text-[11px]">
                                  • {file.fileName} (v{file.versionNumber})
                                </div>
                                {isUrl ? (
                                  <a
                                    href={file.filePath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-blue-300 text-blue-700 font-bold rounded-lg hover:bg-blue-50 transition text-[11px] mt-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Mở tệp đính kèm
                                  </a>
                                ) : (
                                  <div className="text-zinc-500 font-mono text-[10px]">
                                    📁 {file.filePath}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-xs text-zinc-500 font-mono font-semibold">
                      Mã Item: #{task.orderItemId}
                    </span>

                    <button
                      onClick={() => handleOpenUploadModal(task)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        hasCorelFile
                          ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-200'
                          : 'bg-indigo-950 text-white hover:bg-indigo-900 shadow-sm'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      {hasCorelFile ? 'Nộp Lại Tệp Corel' : 'Nộp Tệp Corel (.cdr)'}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal Nộp Tệp Corel */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-zinc-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                Nộp Tệp Thiết Kế CorelDRAW (.cdr)
              </h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadCorel} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Mã Đơn / Task:
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedTask.taskCode}
                  className="w-full px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-xl font-mono font-bold text-zinc-800"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Chọn Tệp từ máy tính (.cdr, .pdf, .zip):
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".cdr,.pdf,.ai,.psd,.zip,.rar"
                    onChange={handleFileChange}
                    className="hidden"
                    id="corel-file-input-page"
                  />
                  <label
                    htmlFor="corel-file-input-page"
                    className="w-full flex items-center justify-center gap-2 p-3.5 border-2 border-dashed border-zinc-300 hover:border-zinc-500 rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-zinc-700 cursor-pointer transition"
                  >
                    <FileUp className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold">
                      {selectedFile ? selectedFile.name : 'Bấm vào đây để chọn tệp .cdr từ máy tính'}
                    </span>
                  </label>
                </div>
                {selectedFile && (
                  <p className="mt-1 text-[11px] text-emerald-600 font-bold">
                    ✓ Đã chọn tệp: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  Thư mục lưu trên máy chủ:
                </label>
                <div className="w-full flex items-center gap-2 px-3 py-2 border border-zinc-200 bg-zinc-100 rounded-xl text-zinc-800 font-mono">
                  <HardDrive className="w-4 h-4 text-indigo-600" />
                  {DESIGN_STORAGE_PATH}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 rounded-xl text-zinc-600 hover:bg-zinc-100 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedFile}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang nộp...
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4 text-amber-400" />
                      Xác Nhận Nộp Tệp
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
