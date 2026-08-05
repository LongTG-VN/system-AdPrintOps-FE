'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { CalculatePriceRequest, PricingMaterial, PricingTabCategory } from '../types/pricing.types';
import { PricingService } from '../services/pricing.service';

interface CategoryCalculatorFormProps {
  category: PricingTabCategory;
  onCalculate: (payload: CalculatePriceRequest) => void;
  loading: boolean;
}

export function CategoryCalculatorForm({ category, onCalculate, loading }: CategoryCalculatorFormProps) {
  const [widthM, setWidthM] = useState<number>(0.5);
  const [heightM, setHeightM] = useState<number>(0.5);
  const [quantity, setQuantity] = useState<number>(1);
  const [boxCount, setBoxCount] = useState<number>(5);
  const [materialCode, setMaterialCode] = useState<string>('thuong');
  const [hasLamination, setHasLamination] = useState<boolean>(false);
  const [hasDieCut, setHasDieCut] = useState<boolean>(false);

  // Category Specific Inputs matching Cacl/index.html
  const [cutMode, setCutMode] = useState<string>('chuan');
  const [maxSideM, setMaxSideM] = useState<number>(0.3);
  const [rollWidthTac, setRollWidthTac] = useState<number>(6);
  const [tacCount, setTacCount] = useState<number>(5);

  const [hiflexType, setHiflexType] = useState<string>('lua');
  const [frameTubeSize, setFrameTubeSize] = useState<number>(0);
  const [marginCm, setMarginCm] = useState<number>(5);
  const [hasLeg, setHasLeg] = useState<boolean>(false);

  const [giayGroup, setGiayGroup] = useState<string>('giay'); // giay, ep, roi-a4, roi-a5, bangten
  const [giayKho, setGiayKho] = useState<string>('a4'); // a5, a4, a3
  const [giayType, setGiayType] = useState<string>('day1'); // day1, day2, bong1, bong2
  const [epMat, setEpMat] = useState<number>(1);
  const [paperGsm, setPaperGsm] = useState<number>(150);
  const [roiA4Sl, setRoiA4Sl] = useState<number>(500);
  const [roiA5Sl, setRoiA5Sl] = useState<number>(1000);
  const [bangTenLoai, setBangTenLoai] = useState<string>('35k');
  const [bangTenMau, setBangTenMau] = useState<string>('lt5');

  const [tranhType, setTranhType] = useState<string>('tranh_dien');
  const [tranhPreset, setTranhPreset] = useState<string>('A4');
  const [tranhPackage, setTranhPackage] = useState<string>('full');

  const [materials, setMaterials] = useState<PricingMaterial[]>([]);

  useEffect(() => {
    let ignore = false;
    const catCode = category.toUpperCase();

    PricingService.getPublicActiveMaterials(catCode)
      .then((data) => {
        if (!ignore && data && data.length > 0) {
          setMaterials(data);
          setMaterialCode(data[0].materialCode);
        } else if (!ignore) {
          setMaterials([]);
          if (category === 'bang') setMaterialCode('tole-in');
          else if (category === 'khac') setMaterialCode('can');
          else setMaterialCode('thuong');
        }
      })
      .catch(() => {
        if (!ignore) {
          setMaterials([]);
          if (category === 'bang') setMaterialCode('tole-in');
          else if (category === 'khac') setMaterialCode('can');
          else setMaterialCode('thuong');
        }
      });

    return () => {
      ignore = true;
    };
  }, [category]);

  const buildPayload = useCallback((): CalculatePriceRequest => {
    // Map paperSubtype and quantity appropriately for Giay
    let paperSubtypeMapped = 'to_roi_a4';
    const gsmMapped = paperGsm;
    let qtyMapped = quantity;

    if (category === 'giay') {
      if (giayGroup === 'roi-a4') {
        paperSubtypeMapped = 'to_roi_a4';
        qtyMapped = roiA4Sl;
      } else if (giayGroup === 'roi-a5') {
        paperSubtypeMapped = 'to_roi_a5';
        qtyMapped = roiA5Sl;
      } else if (giayGroup === 'ep') {
        paperSubtypeMapped = 'ep_nhua';
      } else if (giayGroup === 'bangten') {
        paperSubtypeMapped = 'bang_ten';
      } else {
        paperSubtypeMapped = 'in_le';
      }
    }

    return {
      categoryCode: category.toUpperCase(),
      widthM: category !== 'card' ? widthM : undefined,
      heightM: category !== 'card' ? heightM : undefined,
      quantity: qtyMapped,
      boxCount: category === 'card' ? boxCount : undefined,
      materialCode: category === 'tranh' && tranhType === 'so_nha'
        ? tranhPackage
        : category === 'giay' && giayGroup === 'giay'
          ? giayType
          : category === 'giay' && giayGroup === 'bangten'
            ? bangTenLoai
            : (materialCode || undefined),
      hasLamination: category === 'decal' || category === 'hiflex' || category === 'khac' ? hasLamination : undefined,
      hasDieCut: category === 'tem' ? hasDieCut : undefined,
      cutMode: category === 'cat' ? cutMode : undefined,
      maxSideM: category === 'cat' && cutMode === 'vien' ? maxSideM : undefined,
      rollWidthTac: category === 'cat' && cutMode === 'le' ? rollWidthTac : undefined,
      sheetCount: category === 'cat' && cutMode === 'le' ? tacCount : undefined,
      hiflexType: category === 'hiflex' ? hiflexType : undefined,
      frameTubeSize: category === 'hiflex' || category === 'bang' ? frameTubeSize : undefined,
      marginCm: category === 'hiflex' ? marginCm : undefined,
      hasLeg: category === 'hiflex' || category === 'bang' ? hasLeg : undefined,
      paperSubtype: category === 'giay' ? paperSubtypeMapped : undefined,
      paperGsm: category === 'giay' && (giayGroup === 'roi-a4' || giayGroup === 'roi-a5') ? gsmMapped : undefined,
      paperSides: category === 'giay' && giayGroup === 'ep' ? epMat : undefined,
      tranhType: category === 'tranh' ? tranhType : undefined,
      tranhPreset: category === 'tranh' ? tranhPreset : category === 'giay' && (giayGroup === 'giay' || giayGroup === 'ep') ? giayKho.toUpperCase() : undefined,
      tranhPackage: category === 'tranh' ? tranhPackage : category === 'giay' && giayGroup === 'bangten' ? bangTenMau : undefined,
    };
  }, [
    category, widthM, heightM, quantity, boxCount, materialCode, hasLamination, hasDieCut,
    cutMode, maxSideM, rollWidthTac, tacCount, hiflexType, frameTubeSize, marginCm, hasLeg,
    giayGroup, giayKho, giayType, epMat, paperGsm, roiA4Sl, roiA5Sl, bangTenLoai, bangTenMau,
    tranhType, tranhPreset, tranhPackage
  ]);

  const lastPayloadRef = React.useRef<string>('');

  // Real-time calculation with payload diff check and 300ms debounce
  useEffect(() => {
    const payload = buildPayload();
    const payloadStr = JSON.stringify(payload);
    if (lastPayloadRef.current === payloadStr) return;

    const timer = setTimeout(() => {
      lastPayloadRef.current = payloadStr;
      onCalculate(payload);
    }, 300);
    return () => clearTimeout(timer);
  }, [buildPayload, onCalculate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildPayload();
    lastPayloadRef.current = JSON.stringify(payload);
    onCalculate(payload);
  };

  const applyPresetDim = (w: number, h: number) => {
    setWidthM(w);
    setHeightM(h);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
      {/* Dimension Presets for quick selection */}
      {category !== 'card' && category !== 'khac' && (
        <div className="flex items-center gap-1.5 flex-wrap pb-1">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Zap className="w-3 h-3 text-zinc-700" /> Nhanh:
          </span>
          <button
            type="button"
            onClick={() => applyPresetDim(0.21, 0.3)}
            className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-mono border border-zinc-200 cursor-pointer"
          >
            A4 (0.21x0.3m)
          </button>
          <button
            type="button"
            onClick={() => applyPresetDim(0.3, 0.42)}
            className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-mono border border-zinc-200 cursor-pointer"
          >
            A3 (0.3x0.42m)
          </button>
          <button
            type="button"
            onClick={() => applyPresetDim(0.42, 0.6)}
            className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-mono border border-zinc-200 cursor-pointer"
          >
            A2 (0.42x0.6m)
          </button>
          <button
            type="button"
            onClick={() => applyPresetDim(1.0, 1.0)}
            className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-mono border border-zinc-200 cursor-pointer"
          >
            1m x 1m
          </button>
          <button
            type="button"
            onClick={() => applyPresetDim(1.0, 2.0)}
            className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-mono border border-zinc-200 cursor-pointer"
          >
            1m x 2m
          </button>
        </div>
      )}

      {/* CARD Specific Input */}
      {category === 'card' && (
        <div className="space-y-2">
          <label className="block font-semibold text-zinc-800">
            Số Hộp Card Visit (100 cái/hộp):
          </label>
          <input
            type="number"
            min={1}
            value={boxCount}
            onChange={(e) => setBoxCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
          />
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-600 leading-relaxed">
            • 1–4 hộp: <strong>70.000đ/hộp</strong><br />
            • Tròn 5 hộp: <strong>40.000đ/hộp (Khuyến mãi)</strong><br />
            • 6–9 hộp: <strong>70.000đ/hộp</strong><br />
            • ≥10 hộp: <strong>24.000đ/hộp</strong>
          </div>
        </div>
      )}

      {/* Standard Width & Height (for Decal, Tem, Cut, Signboard, Hiflex, Tranh, Giay) */}
      {category !== 'card' && category !== 'khac' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-zinc-800 mb-1">
              Ngang (m):
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={widthM}
              onChange={(e) => setWidthM(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-zinc-800 mb-1">
              Cao (m):
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={heightM}
              onChange={(e) => setHeightM(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 font-mono"
            />
          </div>
        </div>
      )}

      {/* DECAL specific options */}
      {category === 'decal' && (
        <div className="space-y-3">
          <div>
            <label className="block font-semibold text-zinc-800 mb-1">Loại Decal:</label>
            <select
              value={materialCode}
              onChange={(e) => setMaterialCode(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900"
            >
              <option value="thuong">Decal in (khổ chuẩn)</option>
              <option value="trong">Decal trong / đẹp (Hệ số x1.5)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="can-decal"
              checked={hasLamination}
              onChange={(e) => setHasLamination(e.target.checked)}
              className="w-4 h-4 text-zinc-900 border-zinc-300 rounded focus:ring-zinc-900 cursor-pointer"
            />
            <label htmlFor="can-decal" className="font-medium text-zinc-800 cursor-pointer">
              Cán màng bảo vệ (+50.000đ/m²)
            </label>
          </div>
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-600 leading-relaxed">
            • Khổ cuộn: 90cm, 100cm, 120cm, 1m5.<br />
            • &lt; 0.1m²: 200k/m² | &lt; 1.0m²: 130k/m².<br />
            • <strong>Khổ &ge; 1.0m² (Khổ 1m): 120.000đ/m²</strong>.<br />
            • &ge; 3m²: 110k/m² | &ge; 5m²: 100k/m² | &ge; 10m²: 90k/m² | &ge; 15m²: 80k/m².
          </div>
        </div>
      )}

      {/* TEM specific options */}
      {category === 'tem' && (
        <div className="space-y-3">
          <div>
            <label className="block font-semibold text-zinc-800 mb-1">Loại Tem:</label>
            <select
              value={hasDieCut ? 'be' : 'khong'}
              onChange={(e) => setHasDieCut(e.target.value === 'be')}
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900"
            >
              <option value="khong">Tem không bế — 100.000đ/m²</option>
              <option value="be">Tem bế hình (0.5m² 100k | 1m² 140k | 2m² 260k | 5m² 550k)</option>
            </select>
          </div>
        </div>
      )}

      {/* CAT (Cut Decal) specific modes & materials */}
      {category === 'cat' && (
        <div className="space-y-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
          <div>
            <label className="block font-semibold text-zinc-800 mb-1">Chất Liệu Cắt Decal Dán Kính:</label>
            <select
              value={materialCode}
              onChange={(e) => setMaterialCode(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900"
            >
              <option value="decal_si">Decal si (3 tháng) khổ 60 — 100.000đ/m²</option>
              <option value="decal_pq">Decal PQ khổ 60 (Dạ quang / 1.5 năm) — 200.000đ/m²</option>
              <option value="decal_in_be">Decal in bế khổ 90/100/120 (8 tháng - 1 năm) — 200.000đ/m²</option>
              <option value="decal_tot_1">Decal tốt 1 lớp khổ 120 (2.5 năm - Nền trắng) — 150.000đ/m²</option>
              <option value="decal_tot_2">Decal tốt 2 lớp khổ 120 (2.5 năm) — 300.000đ/m²</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-zinc-800 mb-1">Kiểu Cắt Decal:</label>
            <select
              value={cutMode}
              onChange={(e) => setCutMode(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900"
            >
              <option value="chuan">Cắt phẳng vô khổ m²</option>
              <option value="vien">Cắt + viền chữ (giá khoán theo cạnh)</option>
              <option value="le">Cắt lẻ theo tấc</option>
            </select>
          </div>

          {cutMode === 'vien' && (
            <div>
              <label className="block font-semibold text-zinc-800 mb-1">Cạnh lớn nhất (m):</label>
              <input
                type="number"
                step="0.05"
                value={maxSideM}
                onChange={(e) => setMaxSideM(parseFloat(e.target.value) || 0.1)}
                className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 font-mono"
              />
              <p className="text-[11px] text-zinc-500 mt-1">≤0.1m: 350k/m² | ≤0.2m: 300k/m² | ≤0.4m: 250k/m² | &gt;0.4m: 200k/m²</p>
            </div>
          )}

          {cutMode === 'le' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Khổ cuộn cắt:</label>
                <select
                  value={rollWidthTac}
                  onChange={(e) => setRollWidthTac(parseInt(e.target.value) || 6)}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900"
                >
                  <option value={6}>Khổ 6 tấc — 10.000đ/tấc</option>
                  <option value={10}>Khổ 1m (10 tấc) — 15.000đ/tấc</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Số tấc:</label>
                <input
                  type="number"
                  min={1}
                  value={tacCount}
                  onChange={(e) => setTacCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 font-mono"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* BANG (Signboard) specific material preset */}
      {category === 'bang' && (
        <div className="space-y-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
          <div>
            <label className="block font-semibold text-zinc-800 mb-1">Vật Liệu & Cách Làm Bảng Hiệu:</label>
            <select
              value={materialCode}
              onChange={(e) => setMaterialCode(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900"
            >
              <option value="tole-in">Tole — In decal dán</option>
              <option value="tole-cat">Tole — Cắt decal dán</option>
              <option value="form-in">Formex — In decal dán</option>
              <option value="form-cat">Formex — Cắt decal dán</option>
              <option value="alu-in">Alu — In decal dán</option>
              <option value="alu-cat">Alu — Cắt decal dán</option>
              <option value="mica-in">Mica — In decal dán</option>
              <option value="mica-cat">Mica — Cắt decal dán</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-zinc-800 mb-1">Khung Sắt Sắt Vuông:</label>
            <select
              value={frameTubeSize}
              onChange={(e) => setFrameTubeSize(parseInt(e.target.value, 10))}
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900"
            >
              <option value={0}>Không có khung sắt (0đ)</option>
              <option value={16}>Vuông 16 — 65.000đ/m</option>
              <option value={20}>Vuông 20 — 85.000đ/m</option>
              <option value={25}>Vuông 25 — 105.000đ/m</option>
            </select>
          </div>

          {frameTubeSize > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="hasLegBang"
                checked={hasLeg}
                onChange={(e) => setHasLeg(e.target.checked)}
                className="w-4 h-4 text-zinc-900 border-zinc-300 rounded focus:ring-zinc-900 cursor-pointer"
              />
              <label htmlFor="hasLegBang" className="font-medium text-zinc-800 cursor-pointer text-sm">
                Gia công thêm 2 chân đứng (+4m sắt)
              </label>
            </div>
          )}

          <div className="p-3 bg-zinc-100 border border-zinc-200 rounded-lg text-xs text-zinc-600 leading-relaxed">
            • Diện tích ≤ 0.06m²: Tính giá khoán Mini<br />
            • Diện tích &lt; 0.5m²: Tính giá khoán Vừa (Mid)<br />
            • Diện tích &ge; 0.5m²: Tính giá khoán Khổ Lớn (Large)
          </div>
        </div>
      )}

      {/* HIFLEX / VAI specific options */}
      {category === 'hiflex' && (
        <div className="space-y-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
          <div>
            <label className="block font-semibold text-zinc-800 mb-1">Loại Bạt Vải:</label>
            <select
              value={hiflexType}
              onChange={(e) => setHiflexType(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900"
            >
              <option value="lua">Lụa thường (Hiflex)</option>
              <option value="xuyen_den">Vải xuyên đèn (Bạt 2 da)</option>
              <option value="decal_dan">Decal dán vải hiflex</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-zinc-800 mb-1">Khung Sắt Sắt Vuông:</label>
              <select
                value={frameTubeSize}
                onChange={(e) => setFrameTubeSize(parseInt(e.target.value, 10))}
                className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900"
              >
                <option value={0}>Không có khung sắt (0đ)</option>
                <option value={16}>Vuông 16 — 65.000đ/m</option>
                <option value={20}>Vuông 20 — 85.000đ/m</option>
                <option value={25}>Vuông 25 — 105.000đ/m</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-zinc-800 mb-1">Căn Khung Biên:</label>
              <select
                value={marginCm}
                onChange={(e) => setMarginCm(parseInt(e.target.value) || 5)}
                className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900"
              >
                <option value={0}>Không căn khung (in sát mép)</option>
                <option value={5}>Căn khung 5cm (+10cm lề)</option>
                <option value={10}>Căn khung 10cm (+20cm lề)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="hasLeg"
              checked={hasLeg}
              onChange={(e) => setHasLeg(e.target.checked)}
              className="w-4 h-4 text-zinc-900 border-zinc-300 rounded focus:ring-zinc-900 cursor-pointer"
            />
            <label htmlFor="hasLeg" className="font-medium text-zinc-800 cursor-pointer">
              Có chân (thêm 2 chân khung × 2m = 4m sắt)
            </label>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="can-hiflex"
              checked={hasLamination}
              onChange={(e) => setHasLamination(e.target.checked)}
              className="w-4 h-4 text-zinc-900 border-zinc-300 rounded focus:ring-zinc-900 cursor-pointer"
            />
            <label htmlFor="can-hiflex" className="font-medium text-zinc-800 cursor-pointer">
              Cán màng (+50.000đ/m²)
            </label>
          </div>
        </div>
      )}

      {/* GIAY specific options matching Cacl optgroups */}
      {category === 'giay' && (
        <div className="space-y-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
          <div>
            <label className="block font-semibold text-zinc-800 mb-1">Loại In Giấy (Optgroups):</label>
            <select
              value={giayGroup}
              onChange={(e) => setGiayGroup(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900"
            >
              <optgroup label="In giấy lẻ & Ép nhựa">
                <option value="giay">In giấy (photocopy / lẻ)</option>
                <option value="ep">Ép nhựa (Plexiglass/Lamination)</option>
              </optgroup>
              <optgroup label="Tờ rơi couche A4">
                <option value="roi-a4">Tờ rơi khổ A4 (21x29.7cm)</option>
              </optgroup>
              <optgroup label="Tờ rơi couche A5">
                <option value="roi-a5">Tờ rơi khổ A5 (14.8x21cm)</option>
              </optgroup>
              <optgroup label="Bảng tên">
                <option value="bangten">Bảng tên đeo ngực</option>
              </optgroup>
            </select>
          </div>

          {giayGroup === 'giay' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-800 mb-1">Khổ giấy:</label>
                  <select value={giayKho} onChange={(e) => setGiayKho(e.target.value)} className="w-full bg-white border border-zinc-300 rounded px-2 py-1.5">
                    <option value="a5">A5</option>
                    <option value="a4">A4</option>
                    <option value="a3">A3</option>
                    <option value="a2">A2</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-800 mb-1">Loại giấy / Mặt:</label>
                  <select value={giayType} onChange={(e) => setGiayType(e.target.value)} className="w-full bg-white border border-zinc-300 rounded px-2 py-1.5">
                    <option value="day1">Dày — 1 mặt</option>
                    <option value="day2">Dày — 2 mặt</option>
                    <option value="bong1">Bóng dày — 1 mặt</option>
                    <option value="bong2">Bóng dày — 2 mặt</option>
                  </select>
                </div>
              </div>
              <div className="p-2.5 bg-zinc-100 border border-zinc-200 rounded-lg text-xs text-zinc-600 leading-relaxed">
                • <strong>A4:</strong> 1 tấm 30k | 2 tấm 50k | từ tấm thứ 3 (+20k/tấm)<br />
                • <strong>A3:</strong> 1 tấm 50k | 2 tấm 80k | từ tấm thứ 3 (+30k/tấm)<br />
                • <strong>A2:</strong> 1 tấm 70k | 2 tấm 110k | từ tấm thứ 3 (+40k/tấm)<br />
                • <strong>A5:</strong> 1 tấm 20k | 2 tấm 35k | từ tấm thứ 3 (+15k/tấm)
              </div>
            </div>
          )}

          {giayGroup === 'ep' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Khổ ép:</label>
                <select value={giayKho} onChange={(e) => setGiayKho(e.target.value)} className="w-full bg-white border border-zinc-300 rounded px-2 py-1.5">
                  <option value="a5">A5</option>
                  <option value="a4">A4</option>
                  <option value="a3">A3</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Số mặt ép:</label>
                <select value={epMat} onChange={(e) => setEpMat(parseInt(e.target.value) || 1)} className="w-full bg-white border border-zinc-300 rounded px-2 py-1.5">
                  <option value={1}>1 mặt</option>
                  <option value={2}>2 mặt</option>
                </select>
              </div>
            </div>
          )}

          {giayGroup === 'roi-a4' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Định lượng giấy:</label>
                <select value={paperGsm} onChange={(e) => setPaperGsm(parseInt(e.target.value) || 150)} className="w-full bg-white border border-zinc-300 rounded px-2 py-1.5">
                  <option value={100}>Couche 100g</option>
                  <option value={150}>Couche 150g</option>
                  <option value={200}>Couche 200g</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Số lượng tờ (Khoán):</label>
                <select value={roiA4Sl} onChange={(e) => setRoiA4Sl(parseInt(e.target.value) || 500)} className="w-full bg-white border border-zinc-300 rounded px-2 py-1.5 font-mono">
                  <option value={500}>500 tờ</option>
                  <option value={1000}>1.000 tờ</option>
                  <option value={2000}>2.000 tờ</option>
                  <option value={3000}>3.000 tờ</option>
                  <option value={5000}>5.000 tờ</option>
                  <option value={10000}>10.000 tờ</option>
                </select>
              </div>
            </div>
          )}

          {giayGroup === 'roi-a5' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Định lượng giấy:</label>
                <select value={paperGsm} onChange={(e) => setPaperGsm(parseInt(e.target.value) || 150)} className="w-full bg-white border border-zinc-300 rounded px-2 py-1.5">
                  <option value={100}>Couche 100g</option>
                  <option value={150}>Couche 150g</option>
                  <option value={200}>Couche 200g</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Số lượng tờ (Khoán):</label>
                <select value={roiA5Sl} onChange={(e) => setRoiA5Sl(parseInt(e.target.value) || 1000)} className="w-full bg-white border border-zinc-300 rounded px-2 py-1.5 font-mono">
                  <option value={1000}>1.000 tờ</option>
                  <option value={2000}>2.000 tờ</option>
                  <option value={4000}>4.000 tờ</option>
                  <option value={6000}>6.000 tờ</option>
                  <option value={10000}>10.000 tờ</option>
                  <option value={20000}>20.000 tờ</option>
                </select>
              </div>
            </div>
          )}

          {giayGroup === 'bangten' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Loại bảng tên:</label>
                <select value={bangTenLoai} onChange={(e) => setBangTenLoai(e.target.value)} className="w-full bg-white border border-zinc-300 rounded px-2 py-1.5">
                  <option value="35k">Loại 35K (Nền trắng)</option>
                  <option value="50k">Loại 50K (Nền màu)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Số màu in:</label>
                <select value={bangTenMau} onChange={(e) => setBangTenMau(e.target.value)} className="w-full bg-white border border-zinc-300 rounded px-2 py-1.5">
                  <option value="lt5">Dưới 5 màu</option>
                  <option value="gt5">Trên 5 màu</option>
                  <option value="gt10">Trên 10 màu</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TRANH specific options */}
      {category === 'tranh' && (
        <div className="space-y-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
          <div>
            <label className="block font-semibold text-zinc-800 mb-1">Phân Loại Tranh / Biển Số Nhà:</label>
            <select
              value={tranhType}
              onChange={(e) => {
                const val = e.target.value;
                setTranhType(val);
                if (val === 'so_nha') {
                  setTranhPreset('30X20');
                  setTranhPackage('anmon');
                } else {
                  setTranhPreset('A4');
                  setTranhPackage('full');
                }
              }}
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900"
            >
              <option value="tranh_dien">Tranh Điện Ultra Slim LED</option>
              <option value="so_nha">Biển Số Nhà 3D (Mica/Inox/Formex)</option>
            </select>
          </div>

          {tranhType === 'tranh_dien' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Khổ Tranh Preset:</label>
                <select
                  value={tranhPreset}
                  onChange={(e) => setTranhPreset(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900"
                >
                  <option value="A4">A4 (20×30cm)</option>
                  <option value="A3">A3 (30×40cm)</option>
                  <option value="A2">A2 (40×60cm)</option>
                  <option value="A1">A1 (60×80cm)</option>
                  <option value="50X70">50×70cm</option>
                  <option value="60X90">60×90cm</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Gói Cấu Hình:</label>
                <select
                  value={tranhPackage}
                  onChange={(e) => setTranhPackage(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900"
                >
                  <option value="full">Trọn bộ (Khung + Đèn + In)</option>
                  <option value="in">Chỉ in (Không khung)</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Kích Thước Số Nhà:</label>
                <select
                  value={tranhPreset}
                  onChange={(e) => setTranhPreset(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900"
                >
                  <option value="25X15">25×15cm</option>
                  <option value="30X20">30×20cm (Khổ chuẩn)</option>
                  <option value="35X25">35×25cm</option>
                  <option value="40X30">40×30cm</option>
                  <option value="60X40">60×40cm</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-zinc-800 mb-1">Loại Số Nhà 3D:</label>
                <select
                  value={tranhPackage}
                  onChange={(e) => setTranhPackage(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900"
                >
                  <option value="anmon">Ăn Mòn</option>
                  <option value="noi">Số Nổi</option>
                  <option value="chunoi">Chữ + Số Nổi</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KHAC / PHU PHI specific option */}
      {category === 'khac' && (
        <div>
          <label className="block font-semibold text-zinc-800 mb-1">Loại Phụ Phí Gia Công:</label>
          <select
            value={materialCode}
            onChange={(e) => setMaterialCode(e.target.value)}
            className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900"
          >
            <option value="can">Phụ phí cán màng (+50.000đ/m²)</option>
            <option value="bang_lua">Bảng lụa có chân (Khoán 650.000đ)</option>
          </select>
        </div>
      )}

      {/* Active Materials Dropdown (when fetched dynamically from DB) */}
      {materials.length > 0 && category !== 'bang' && category !== 'khac' && category !== 'tranh' && (
        <div>
          <label className="block font-semibold text-zinc-800 mb-1">Vật Liệu CSDL:</label>
          <select
            value={materialCode}
            onChange={(e) => setMaterialCode(e.target.value)}
            className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900"
          >
            {materials.map((m) => (
              <option key={m.materialCode} value={m.materialCode}>
                {m.materialName} (Hệ số: x{m.multiplier})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Quantity Input */}
      {category !== 'card' && (giayGroup !== 'roi-a4' && giayGroup !== 'roi-a5') && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block font-semibold text-zinc-800">Số Lượng (Tấm / Cái):</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 5, 10].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantity(q)}
                  className={`px-2 py-0.5 rounded text-xs font-mono border cursor-pointer ${
                    quantity === q
                      ? 'bg-zinc-900 text-white border-zinc-900 font-bold'
                      : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 font-mono"
          />
        </div>
      )}

      {/* Manual Submit Button */}
      <div className="pt-2">
        <Button type="submit" disabled={loading} className="w-full py-2.5">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> đang tính toán...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2 font-semibold">
              <Calculator className="w-4 h-4" /> Tính Giá Ngay
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
