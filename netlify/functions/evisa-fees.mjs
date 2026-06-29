import { getServiceClient, jsonResponse, handleOptions } from './admin-shared.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('evisa_country_fees')
      .select('country_code, country_name, visa_fee_gbp, service_fee_gbp, updated_at')
      .order('country_name', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        return jsonResponse(200, { fees: [] });
      }
      throw error;
    }

    return jsonResponse(200, { fees: data ?? [] });
  } catch (err) {
    console.error('evisa-fees error:', err);
    return jsonResponse(500, { error: 'Unable to load eVisa fees' });
  }
};
