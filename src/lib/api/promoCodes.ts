import type { PromoCodeRecord } from '../../config/promoCodes';
import { adminPost } from './adminFetch';

export interface ValidatePromoResult {
  valid: boolean;
  promo?: {
    code: string;
    promoId: string;
    discountPercent: number;
    waiveAllFees: boolean;
    description?: string | null;
  };
  error?: string;
}

export interface CreatePaymentIntentResult {
  clientSecret?: string;
  amountPence: number;
  amountGbp: number;
  waived?: boolean;
  breakdown?: {
    visaFees: number;
    serviceFee: number;
    appointmentFee: number;
    travelInsurance: number;
    expressFee: number;
    promoSavings: number;
    total: number;
  };
}

class PromoCodesService {
  async validateCode(code: string, applicationId?: string): Promise<ValidatePromoResult> {
    return adminPost('validate-promo', { code, applicationId });
  }

  async listCodes(): Promise<{ codes: PromoCodeRecord[] }> {
    return adminPost('admin-promo-codes', { action: 'list' });
  }

  async createCode(input: {
    code: string;
    description?: string;
    discountPercent: number;
    waiveAllFees?: boolean;
    maxUses?: number | null;
    expiresAt?: string | null;
  }): Promise<{ code: PromoCodeRecord }> {
    return adminPost('admin-promo-codes', { action: 'create', ...input });
  }

  async updateCode(
    id: string,
    input: Partial<{
      description: string;
      discountPercent: number;
      waiveAllFees: boolean;
      maxUses: number | null;
      expiresAt: string | null;
      active: boolean;
    }>
  ): Promise<{ code: PromoCodeRecord }> {
    return adminPost('admin-promo-codes', { action: 'update', id, ...input });
  }

  async deleteCode(id: string): Promise<{ success: boolean }> {
    return adminPost('admin-promo-codes', { action: 'delete', id });
  }
}

export const promoCodesService = new PromoCodesService();

export default promoCodesService;
