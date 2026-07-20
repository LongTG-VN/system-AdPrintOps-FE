'use me';
'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { DecalPriceRequest, PricingMaterial } from '../types/pricing.types';
import { PricingService } from '../services/pricing.service';

interface DecalCalculatorFormProps {
  onCalculate: (payload: DecalPriceRequest) => void;
  loading: boolean;
}

export function DecalCalculatorForm({ onCalculate, loading }: DecalCalculatorFormProps) {
  const [widthM, setWidthM] = useState<number>(0.5);
  const [heightM, setHeightM] = useState<number>(0.5);
  const [quantity, setQuantity] = useState<number>(1);
  const [decalType, setDecalType] = useState<string>('thuong');
  const [hasLamination, setHasLamination] = useState<boolean>(false);

  const [materials, setMaterials] = useState<PricingMaterial[]>([]);

  useEffect(() => {
    PricingService.getPublicActiveMaterials('DECAL')
      .then((data) => {
        if (data && data.length > 0) {
          setMaterials(data);
          setDecalType(data[0].materialCode);
        }
      })
      .catch(() => {
        // Fallback default options
        setMaterials([
          { id: 1, categoryCode: 'DECAL', materialCode: 'thuong', materialName: 'Decal Thường (Chuẩn)', multiplier: 1.0, basePrice: 0, active: true },
          { id: 2, categoryCode: 'DECAL', materialCode: 'trong', materialName: 'Decal Trong / Đẹp (Hệ số 1.5)', multiplier: 1.5, basePrice: 0, active: true },
        ]);
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate({
      widthM,
      heightM,
      quantity,
      decalType,
      hasLamination,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Loại Decal (Vật Liệu)
        </label>
        <select
          value={decalType}
          onChange={(e) => setDecalType(e.target.value)}
          className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
        >
          {materials.map((m) => (
            <option key={m.id} value={m.materialCode}>
              {m.materialName} {m.multiplier > 1 ? `(Hệ số x${m.multiplier})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Ngang (Mét)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={widthM}
            onChange={(e) => setWidthM(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Cao (Mét)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={heightM}
            onChange={(e) => setHeightM(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Số Lượng
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Gia Công Cán Màng
          </label>
          <select
            value={hasLamination ? 'true' : 'false'}
            onChange={(e) => setHasLamination(e.target.value === 'true')}
            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="false">Không cán màng</option>
            <option value="true">Có cán màng (+50.000đ/m²)</option>
          </select>
        </div>
      </div>

      <Button type="submit" disabled={loading} size="lg" className="w-full mt-4">
        {loading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Calculator className="w-5 h-5 mr-2" />}
        Tính Giá Ngay
      </Button>
    </form>
  );
}
