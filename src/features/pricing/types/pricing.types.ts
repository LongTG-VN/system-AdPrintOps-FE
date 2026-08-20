export interface LineItem {
  code: string;
  label: string;
  amount: number;
}

export interface DecalPriceRequest {
  widthM: number;
  heightM: number;
  quantity: number;
  decalType: string;
  hasLamination: boolean;
}

export interface DecalPriceResponse {
  singleAreaSqm: number;
  totalAreaSqm: number;
  ratePerSqm: number;
  laminationCost: number;
  singleUnitPrice: number;
  totalPrice: number;
  category: string;
  pricingNote: string;
  widthCm?: number;
  heightCm?: number;
  quantity?: number;
  materialCode?: string;
  vatIncluded?: boolean;
  lineItems?: LineItem[];
  appliedRules?: string[];
}

export interface CalculatePriceRequest {
  categoryCode: string;
  widthM?: number;
  heightM?: number;
  quantity?: number;
  materialCode?: string;
  hasLamination?: boolean;
  hasDieCut?: boolean;
  boxCount?: number;
  frameTubeSize?: number;
  paperGsm?: number;
  sheetCount?: number;
  customFee?: number;
  cutMode?: string;
  maxSideM?: number;
  rollWidthTac?: number;
  hiflexType?: string;
  marginCm?: number;
  hasLeg?: boolean;
  paperSubtype?: string;
  paperSides?: number;
  tranhType?: string;
  tranhPreset?: string;
  tranhPackage?: string;
  eyeletCount?: number;
  polePocketMode?: string;
  hastagThickness?: string;
  hasCncCut?: boolean;
}

export interface CalculatePriceResponse {
  categoryCode: string;
  vatIncluded: boolean;
  singleAreaSqm: number;
  totalAreaSqm: number;
  ratePerSqm: number;
  laminationCost: number;
  singleUnitPrice: number;
  totalPrice: number;
  currency: string;
  lineItems: LineItem[];
  appliedRules: string[];
  breakdownNote: string;
}

export type PricingTabCategory =
  | 'decal'
  | 'hiflex'
  | 'hastag'
  | 'tem'
  | 'cat'
  | 'card'
  | 'bang'
  | 'giay'
  | 'tranh'
  | 'khac';

export interface PricingRule {
  id: number;
  categoryCode: string;
  ruleName: string;
  minAreaSqm: number;
  maxAreaSqm: number | null;
  pricePerSqm: number;
  laminationFeePerSqm: number;
  active: boolean;
  note?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PricingMaterial {
  id: number;
  categoryCode: string;
  materialCode: string;
  materialName: string;
  multiplier: number;
  basePrice: number;
  active: boolean;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PricingHistory {
  id: number;
  targetType: string;
  targetId: number;
  fieldName: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  createdAt: string;
}
