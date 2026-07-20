import { apiClient } from '@/shared/lib/api-client';
import {
  DecalPriceRequest,
  DecalPriceResponse,
  CalculatePriceRequest,
  CalculatePriceResponse,
  PricingRule,
  PricingMaterial,
  PricingHistory,
} from '../types/pricing.types';

export class PricingService {
  /**
   * Call Backend API to calculate pricing for any category.
   * Endpoint: POST /api/v1/pricing/calculate
   */
  static async calculatePrice(payload: CalculatePriceRequest): Promise<CalculatePriceResponse> {
    return apiClient<CalculatePriceResponse>('/pricing/calculate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Call Backend API to calculate Decal pricing (legacy alias).
   * Endpoint: POST /api/v1/pricing/decal
   */
  static async calculateDecalPrice(payload: DecalPriceRequest): Promise<DecalPriceResponse> {
    return apiClient<DecalPriceResponse>('/pricing/decal', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Public API to fetch active materials dynamically for public calculator.
   * Endpoint: GET /api/v1/pricing/materials
   */
  static async getPublicActiveMaterials(categoryCode: string = 'DECAL'): Promise<PricingMaterial[]> {
    return apiClient<PricingMaterial[]>(`/pricing/materials?categoryCode=${categoryCode.toUpperCase()}`);
  }

  // Admin Rules CRUD
  static async getAllRules(categoryCode?: string): Promise<PricingRule[]> {
    const query = categoryCode ? `?categoryCode=${categoryCode.toUpperCase()}` : '';
    return apiClient<PricingRule[]>(`/admin/pricing/rules${query}`);
  }

  static async createRule(payload: Partial<PricingRule>): Promise<PricingRule> {
    return apiClient<PricingRule>('/admin/pricing/rules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  static async updateRule(id: number, payload: Partial<PricingRule>): Promise<PricingRule> {
    return apiClient<PricingRule>(`/admin/pricing/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // Admin Materials CRUD
  static async getAllMaterials(categoryCode?: string): Promise<PricingMaterial[]> {
    const query = categoryCode ? `?categoryCode=${categoryCode.toUpperCase()}` : '';
    return apiClient<PricingMaterial[]>(`/admin/pricing/materials${query}`);
  }

  static async updateMaterial(id: number, payload: Partial<PricingMaterial>): Promise<PricingMaterial> {
    return apiClient<PricingMaterial>(`/admin/pricing/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // Audit History
  static async getAuditHistory(targetType?: string, targetId?: number): Promise<PricingHistory[]> {
    let query = '';
    if (targetType && targetId) {
      query = `?targetType=${targetType}&targetId=${targetId}`;
    }
    return apiClient<PricingHistory[]>(`/admin/pricing/history${query}`);
  }
}
