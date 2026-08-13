'use client';

import React, { useState, useEffect } from 'react';
import { PricingService } from '../services/pricing.service';
import { PricingRule, PricingMaterial, PricingHistory } from '../types/pricing.types';
import { ShieldCheck, History, RefreshCw, Save, Layers, Tag } from 'lucide-react';

interface AdminPricingManagementProps {
  initialTab?: 'rules' | 'materials' | 'history';
}

export const AdminPricingManagement: React.FC<AdminPricingManagementProps> = ({ initialTab = 'rules' }) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'materials' | 'history'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [selectedCategory, setSelectedCategory] = useState<string>('DECAL');

  const [rules, setRules] = useState<PricingRule[]>([]);
  const [materials, setMaterials] = useState<PricingMaterial[]>([]);
  const [histories, setHistories] = useState<PricingHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [message, setMessage] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    return String(err);
  };

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      setLoading(true);
      setMessage(null);
      try {
        if (activeTab === 'rules') {
          const data = await PricingService.getAllRules(selectedCategory);
          if (!ignore) setRules(data);
        } else if (activeTab === 'materials') {
          const data = await PricingService.getAllMaterials(selectedCategory);
          if (!ignore) setMaterials(data);
        } else if (activeTab === 'history') {
          const data = await PricingService.getAuditHistory();
          if (!ignore) setHistories(data);
        }
      } catch (err: unknown) {
        if (!ignore) setMessage(`Không thể tải dữ liệu: ${getErrorMessage(err)}`);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchData();
    return () => {
      ignore = true;
    };
  }, [activeTab, selectedCategory, reloadTrigger]);

  const triggerReload = () => setReloadTrigger((prev) => prev + 1);

  const handleUpdatePrice = async (rule: PricingRule) => {
    try {
      await PricingService.updateRule(rule.id, {
        ...rule,
        pricePerSqm: editPrice,
        updatedBy: 'Admin (UI)',
      });
      setMessage(`Đã cập nhật quy tắc "${rule.ruleName}" thành ${editPrice.toLocaleString()}đ/m²`);
      setEditingId(null);
      triggerReload();
    } catch (err: unknown) {
      setMessage(`Lỗi cập nhật: ${getErrorMessage(err)}`);
    }
  };

  const handleUpdateMultiplier = async (mat: PricingMaterial, newMultiplier: number) => {
    try {
      await PricingService.updateMaterial(mat.id, {
        ...mat,
        multiplier: newMultiplier,
        updatedBy: 'Admin (UI)',
      });
      setMessage(`Đã cập nhật hệ số vật liệu "${mat.materialName}" thành x${newMultiplier}`);
      triggerReload();
    } catch (err: unknown) {
      setMessage(`Lỗi cập nhật: ${getErrorMessage(err)}`);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-white border border-zinc-200 rounded-xl shadow-sm text-zinc-900 mt-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-900 text-white rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
              Quản Lý Bảng Giá & Hệ Số Đơn Giá (Admin)
            </h2>
            <p className="text-xs text-zinc-500">
              Cấu hình trực tiếp quy tắc bậc thang, hệ số vật liệu và xem nhật ký biến động giá
            </p>
          </div>
        </div>

        <button
          onClick={triggerReload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg border border-zinc-200 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Message notification */}
      {message && (
        <div className="mt-4 p-3 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900 flex justify-between items-center">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-zinc-500 hover:text-zinc-900">
            ×
          </button>
        </div>
      )}

      {/* Tabs and Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200">
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'rules' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Quy Tắc Bậc Thang
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'materials' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Chất Liệu & Hệ Số
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'history' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Lịch Sử Đổi Giá
          </button>
        </div>

        {activeTab !== 'history' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-medium">Danh mục:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-zinc-300 text-zinc-900 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-zinc-900"
            >
              <option value="DECAL">Decal (In / Cắt)</option>
              <option value="TEM">In Tem</option>
              <option value="CARD">Card Visit</option>
              <option value="HIFLEX">Bạt Hiflex</option>
              <option value="BANG">Bảng Hiệu Cứng</option>
              <option value="GIAY">In Giấy & Tờ Rơi</option>
              <option value="TRANH">Tranh Điện & Biển Số Nhà</option>
              <option value="KHAC">Phụ Phí Gia Công</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="mt-6">
        {loading ? (
          <div className="flex justify-center items-center py-12 text-zinc-500 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Đang tải dữ liệu cấu hình...
          </div>
        ) : (
          <>
            {/* Tab: Rules */}
            {activeTab === 'rules' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3 font-semibold">Tên Quy Tắc</th>
                      <th className="py-2.5 px-3 font-semibold">Khổ Diện Tích (m²)</th>
                      <th className="py-2.5 px-3 font-semibold">Đơn Giá / m²</th>
                      <th className="py-2.5 px-3 font-semibold">Phí Cán Màng</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {rules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-zinc-50">
                        <td className="py-3 px-3 font-medium text-zinc-900">{rule.ruleName}</td>
                        <td className="py-3 px-3 font-mono text-zinc-600">
                          {rule.minAreaSqm}m² &rarr; {rule.maxAreaSqm ? `${rule.maxAreaSqm}m²` : '&infin;'}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-zinc-900">
                          {editingId === rule.id ? (
                            <input
                              type="number"
                              value={editPrice}
                              onChange={(e) => setEditPrice(Number(e.target.value))}
                              className="w-28 bg-white border border-zinc-300 rounded px-2 py-1 text-xs text-zinc-900"
                            />
                          ) : (
                            `${rule.pricePerSqm.toLocaleString()} đ`
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-zinc-600">
                          +{rule.laminationFeePerSqm.toLocaleString()} đ
                        </td>
                        <td className="py-3 px-3 text-right">
                          {editingId === rule.id ? (
                            <button
                              onClick={() => handleUpdatePrice(rule)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-900 text-white rounded text-xs hover:bg-black font-medium"
                            >
                              <Save className="w-3 h-3" /> Lưu
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingId(rule.id);
                                setEditPrice(rule.pricePerSqm);
                              }}
                              className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded text-xs font-medium border border-zinc-200"
                            >
                              Sửa giá
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {rules.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-400">
                          Chưa có quy tắc đơn giá nào cho danh mục này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab: Materials */}
            {activeTab === 'materials' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3 font-semibold">Mã Vật Liệu</th>
                      <th className="py-2.5 px-3 font-semibold">Tên Vật Liệu</th>
                      <th className="py-2.5 px-3 font-semibold">Hệ Số Giá (Multiplier)</th>
                      <th className="py-2.5 px-3 font-semibold">Cộng Thêm / m²</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {materials.map((mat) => (
                      <tr key={mat.id} className="hover:bg-zinc-50">
                        <td className="py-3 px-3 font-mono font-semibold text-zinc-900">{mat.materialCode}</td>
                        <td className="py-3 px-3 font-medium text-zinc-800">{mat.materialName}</td>
                        <td className="py-3 px-3">
                          <select
                            value={mat.multiplier}
                            onChange={(e) => handleUpdateMultiplier(mat, Number(e.target.value))}
                            className="bg-white border border-zinc-300 rounded px-2 py-1 text-xs text-zinc-900 font-mono"
                          >
                            <option value={1.0}>x1.0 (Chuẩn)</option>
                            <option value={1.2}>x1.2 (+20%)</option>
                            <option value={1.5}>x1.5 (+50%)</option>
                            <option value={2.0}>x2.0 (Gấp đôi)</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 font-mono text-zinc-600">+{mat.basePrice.toLocaleString()} đ</td>
                      </tr>
                    ))}

                    {materials.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-zinc-400">
                          Chưa có vật liệu nào được đăng ký cho danh mục này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab: History */}
            {activeTab === 'history' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3 font-semibold">Thời Gian</th>
                      <th className="py-2.5 px-3 font-semibold">Phân Loại</th>
                      <th className="py-2.5 px-3 font-semibold">Nội Dung Biến Động</th>
                      <th className="py-2.5 px-3 font-semibold">Giá Cũ &rarr; Giá Mới Mới Nhất</th>
                      <th className="py-2.5 px-3 font-semibold">Người Thực Hiện</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {histories.map((h) => {
                      const formatField = (field: string) => {
                        switch (field) {
                          case 'price_per_sqm': return 'Đơn giá / m²';
                          case 'multiplier': return 'Hệ số giá';
                          case 'lamination_fee_per_sqm': return 'Phí cán màng / m²';
                          case 'is_active': return 'Trạng thái hoạt động';
                          case 'rule_name': return 'Tên quy tắc';
                          case 'CREATE': return 'Tạo mới dữ liệu';
                          default: return field;
                        }
                      };

                      return (
                        <tr key={h.id} className="hover:bg-zinc-50 transition-colors">
                          <td className="py-3 px-3 font-mono text-zinc-500 whitespace-nowrap">
                            {new Date(h.createdAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              h.targetType === 'RULE' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {h.targetType === 'RULE' ? 'Quy Tắc Giá' : 'Vật Liệu'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium text-zinc-900">
                            {formatField(h.fieldName)} <span className="text-zinc-400 text-[11px] font-normal">(ID: #{h.targetId})</span>
                          </td>
                          <td className="py-3 px-3 font-mono">
                            {h.oldValue ? (
                              <>
                                <span className="text-zinc-400 line-through mr-1.5">{h.oldValue}</span>
                                &rarr;
                              </>
                            ) : null}
                            <span className="text-zinc-900 font-bold ml-1.5 bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200">
                              {h.newValue}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-zinc-600 font-medium whitespace-nowrap">{h.changedBy}</td>
                        </tr>
                      );
                    })}

                    {histories.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-400">
                          Chưa có nhật ký thay đổi giá nào được ghi nhận.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
