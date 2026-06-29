import { getServiceClient, verifyAdmin, jsonResponse, handleOptions } from './admin-shared.mjs';
import { parseBody } from './stripe-shared.mjs';

const DEFAULT_VISA_FEES = [
  { country_code: 'dz', country_name: 'Algeria', visa_fee_gbp: 89.4, service_fee_gbp: 50 },
  { country_code: 'au', country_name: 'Australia', visa_fee_gbp: 100.88, service_fee_gbp: 50 },
  { country_code: 'az', country_name: 'Azerbaijan', visa_fee_gbp: 22.5, service_fee_gbp: 50 },
  { country_code: 'bh', country_name: 'Bahrain', visa_fee_gbp: 19.8, service_fee_gbp: 50 },
  { country_code: 'bj', country_name: 'Benin', visa_fee_gbp: 37.13, service_fee_gbp: 50 },
  { country_code: 'bt', country_name: 'Bhutan', visa_fee_gbp: 148.5, service_fee_gbp: 50 },
  { country_code: 'br', country_name: 'Brazil', visa_fee_gbp: 69.68, service_fee_gbp: 50 },
  { country_code: 'kh', country_name: 'Cambodia', visa_fee_gbp: 22.65, service_fee_gbp: 50 },
  { country_code: 'cm', country_name: 'Cameroon', visa_fee_gbp: 144.23, service_fee_gbp: 50 },
  { country_code: 'cl', country_name: 'Chile', visa_fee_gbp: 111.3, service_fee_gbp: 50 },
  { country_code: 'cn', country_name: 'China', visa_fee_gbp: 61.5, service_fee_gbp: 50 },
  { country_code: 'cu', country_name: 'Cuba', visa_fee_gbp: 40.5, service_fee_gbp: 50 },
  { country_code: 'eg', country_name: 'Egypt', visa_fee_gbp: 18.75, service_fee_gbp: 50 },
  { country_code: 'et', country_name: 'Ethiopia', visa_fee_gbp: 46.13, service_fee_gbp: 50 },
  { country_code: 'ga', country_name: 'Gabon', visa_fee_gbp: 132, service_fee_gbp: 50 },
  { country_code: 'ge', country_name: 'Georgia', visa_fee_gbp: 27, service_fee_gbp: 50 },
  { country_code: 'gh', country_name: 'Ghana', visa_fee_gbp: 84.75, service_fee_gbp: 50 },
  { country_code: 'gn', country_name: 'Guinea', visa_fee_gbp: 58.5, service_fee_gbp: 50 },
  { country_code: 'hk', country_name: 'Hong Kong', visa_fee_gbp: 0, service_fee_gbp: 50 },
  { country_code: 'id', country_name: 'Indonesia', visa_fee_gbp: 24, service_fee_gbp: 50 },
  { country_code: 'jp', country_name: 'Japan', visa_fee_gbp: 10.5, service_fee_gbp: 50 },
  { country_code: 'jo', country_name: 'Jordan', visa_fee_gbp: 38.7, service_fee_gbp: 50 },
  { country_code: 'ke', country_name: 'Kenya', visa_fee_gbp: 25.5, service_fee_gbp: 50 },
  { country_code: 'la', country_name: 'Laos', visa_fee_gbp: 37.73, service_fee_gbp: 50 },
  { country_code: 'mg', country_name: 'Madagascar', visa_fee_gbp: 8.25, service_fee_gbp: 50 },
  { country_code: 'my', country_name: 'Malaysia', visa_fee_gbp: 0, service_fee_gbp: 50 },
  { country_code: 'mn', country_name: 'Mongolia', visa_fee_gbp: 3.79, service_fee_gbp: 50 },
  { country_code: 'ma', country_name: 'Morocco', visa_fee_gbp: 66, service_fee_gbp: 50 },
  { country_code: 'nz', country_name: 'New Zealand', visa_fee_gbp: 190.35, service_fee_gbp: 50 },
  { country_code: 'ng', country_name: 'Nigeria', visa_fee_gbp: 336, service_fee_gbp: 50 },
  { country_code: 'pg', country_name: 'Papua New Guinea', visa_fee_gbp: 37.5, service_fee_gbp: 50 },
  { country_code: 'ph', country_name: 'Philippines', visa_fee_gbp: 51.75, service_fee_gbp: 50 },
  { country_code: 'ru', country_name: 'Russia', visa_fee_gbp: 41.25, service_fee_gbp: 50 },
  { country_code: 'sa', country_name: 'Saudi Arabia', visa_fee_gbp: 81.15, service_fee_gbp: 50 },
  { country_code: 'kr', country_name: 'South Korea', visa_fee_gbp: 28.05, service_fee_gbp: 50 },
  { country_code: 'lk', country_name: 'Sri Lanka', visa_fee_gbp: 0, service_fee_gbp: 50 },
  { country_code: 'tw', country_name: 'Taiwan', visa_fee_gbp: 0, service_fee_gbp: 50 },
  { country_code: 'tj', country_name: 'Tajikistan', visa_fee_gbp: 23.25, service_fee_gbp: 50 },
  { country_code: 'tz', country_name: 'Tanzania', visa_fee_gbp: 37.5, service_fee_gbp: 50 },
  { country_code: 'tg', country_name: 'Togo', visa_fee_gbp: 35.25, service_fee_gbp: 50 },
  { country_code: 'tr', country_name: 'Turkey', visa_fee_gbp: 35.25, service_fee_gbp: 50 },
  { country_code: 'ae', country_name: 'United Arab Emirates', visa_fee_gbp: 56.25, service_fee_gbp: 50 },
  { country_code: 'ug', country_name: 'Uganda', visa_fee_gbp: 38.25, service_fee_gbp: 50 },
  { country_code: 'gb', country_name: 'United Kingdom', visa_fee_gbp: 132.3, service_fee_gbp: 50 },
  { country_code: 'us', country_name: 'United States', visa_fee_gbp: 141.75, service_fee_gbp: 50 },
  { country_code: 'uy', country_name: 'Uruguay', visa_fee_gbp: 28.5, service_fee_gbp: 50 },
  { country_code: 'uz', country_name: 'Uzbekistan', visa_fee_gbp: 16.5, service_fee_gbp: 50 },
  { country_code: 'vn', country_name: 'Vietnam', visa_fee_gbp: 19.8, service_fee_gbp: 50 },
  { country_code: 'zm', country_name: 'Zambia', visa_fee_gbp: 19.5, service_fee_gbp: 50 },
];

const MISSING_TABLE = 'Database table not found. Run supabase/ADMIN_SETUP_RUN_IN_SQL_EDITOR.sql in Supabase SQL Editor, then retry.';

function isMissingTable(error) {
  return error?.code === '42P01' || String(error?.message || '').includes('does not exist');
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return jsonResponse(401, { error: 'Missing authorization token' });
    }

    const adminCheck = await verifyAdmin(token);
    if (!adminCheck.ok) {
      return jsonResponse(adminCheck.status, { error: adminCheck.message });
    }

    const supabase = getServiceClient();
    const body = parseBody(event);
    const action = body.action || 'list';

    if (action === 'list') {
      const { data, error } = await supabase
        .from('evisa_country_fees')
        .select('*')
        .order('country_name', { ascending: true });

      if (error) {
        if (isMissingTable(error)) {
          return jsonResponse(200, { fees: DEFAULT_VISA_FEES, seeded: false, tableMissing: true });
        }
        throw error;
      }

      if (!data?.length) {
        return jsonResponse(200, { fees: DEFAULT_VISA_FEES, seeded: false });
      }

      return jsonResponse(200, { fees: data });
    }

    if (action === 'seed') {
      const { error } = await supabase.from('evisa_country_fees').upsert(
        DEFAULT_VISA_FEES.map((row) => ({
          ...row,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'country_code' }
      );

      if (error) {
        if (isMissingTable(error)) {
          return jsonResponse(503, { error: MISSING_TABLE });
        }
        throw error;
      }

      const { data } = await supabase
        .from('evisa_country_fees')
        .select('*')
        .order('country_name', { ascending: true });

      return jsonResponse(200, { fees: data ?? [], seeded: true });
    }

    if (action === 'upsert') {
      const fees = Array.isArray(body.fees) ? body.fees : [];
      if (!fees.length) {
        return jsonResponse(400, { error: 'No fees provided' });
      }

      const rows = fees.map((row) => ({
        country_code: String(row.country_code || '').toLowerCase().trim(),
        country_name: String(row.country_name || '').trim(),
        visa_fee_gbp: Number(row.visa_fee_gbp ?? row.visaFeeGbp ?? 0),
        service_fee_gbp: Number(row.service_fee_gbp ?? row.serviceFeeGbp ?? 0),
        updated_at: new Date().toISOString(),
      }));

      for (const row of rows) {
        if (!row.country_code || !row.country_name) {
          return jsonResponse(400, { error: 'Each row needs country_code and country_name' });
        }
        if (row.visa_fee_gbp < 0 || row.service_fee_gbp < 0) {
          return jsonResponse(400, { error: 'Fees cannot be negative' });
        }
      }

      const { error } = await supabase.from('evisa_country_fees').upsert(rows, {
        onConflict: 'country_code',
      });

      if (error) {
        if (isMissingTable(error)) {
          return jsonResponse(503, { error: MISSING_TABLE });
        }
        throw error;
      }

      const { data } = await supabase
        .from('evisa_country_fees')
        .select('*')
        .order('country_name', { ascending: true });

      return jsonResponse(200, { fees: data ?? [] });
    }

    return jsonResponse(400, { error: 'Unknown action' });
  } catch (err) {
    console.error('admin-evisa-fees error:', err);
    return jsonResponse(500, { error: err.message || 'Server error' });
  }
};
