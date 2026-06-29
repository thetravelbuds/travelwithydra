import type { EvisaCountryFeeRow } from '../../services/evisaFeeStore';
import { adminPost } from './adminFetch';

const evisaFeesService = {
  async listFees(): Promise<{ fees: EvisaCountryFeeRow[]; seeded?: boolean }> {
    return adminPost('admin-evisa-fees', { action: 'list' });
  },

  async seedFees(): Promise<{ fees: EvisaCountryFeeRow[] }> {
    return adminPost('admin-evisa-fees', { action: 'seed' });
  },

  async saveFees(fees: EvisaCountryFeeRow[]): Promise<{ fees: EvisaCountryFeeRow[] }> {
    return adminPost('admin-evisa-fees', { action: 'upsert', fees });
  },
};

export default evisaFeesService;
