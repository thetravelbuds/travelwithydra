import { getServiceClient, verifyAdmin, jsonResponse, handleOptions } from './admin-shared.mjs';
import { parseBody } from './stripe-shared.mjs';
import { normalizePromoCode } from './visa-payment-calc.mjs';

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
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (isMissingTable(error)) {
          return jsonResponse(200, { codes: [] });
        }
        throw error;
      }

      return jsonResponse(200, { codes: data ?? [] });
    }

    if (action === 'create') {
      const code = normalizePromoCode(body.code);
      if (!code) {
        return jsonResponse(400, { error: 'Code is required' });
      }

      const discountPercent = Number(body.discountPercent ?? 0);
      const waiveAllFees = Boolean(body.waiveAllFees);

      if (!waiveAllFees && (discountPercent < 0 || discountPercent > 100)) {
        return jsonResponse(400, { error: 'Discount must be between 0 and 100' });
      }

      const { data, error } = await supabase
        .from('promo_codes')
        .insert({
          code,
          description: body.description?.trim() || null,
          discount_percent: waiveAllFees ? 100 : discountPercent,
          waive_all_fees: waiveAllFees,
          max_uses: body.maxUses ?? null,
          expires_at: body.expiresAt || null,
          created_by: adminCheck.user.id,
        })
        .select('*')
        .single();

      if (error) {
        if (error.code === '23505') {
          return jsonResponse(400, { error: 'A code with this name already exists' });
        }
        if (isMissingTable(error)) {
          return jsonResponse(503, { error: MISSING_TABLE });
        }
        throw error;
      }

      return jsonResponse(200, { code: data });
    }

    if (action === 'update') {
      const { id } = body;
      if (!id) {
        return jsonResponse(400, { error: 'Code id is required' });
      }

      const updates = {};
      if (body.description !== undefined) updates.description = body.description?.trim() || null;
      if (body.discountPercent !== undefined) {
        updates.discount_percent = Number(body.discountPercent);
      }
      if (body.waiveAllFees !== undefined) {
        updates.waive_all_fees = Boolean(body.waiveAllFees);
        if (updates.waive_all_fees) updates.discount_percent = 100;
      }
      if (body.maxUses !== undefined) updates.max_uses = body.maxUses;
      if (body.expiresAt !== undefined) updates.expires_at = body.expiresAt || null;
      if (body.active !== undefined) updates.active = Boolean(body.active);

      const { data, error } = await supabase
        .from('promo_codes')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return jsonResponse(200, { code: data });
    }

    if (action === 'delete') {
      const { id } = body;
      if (!id) {
        return jsonResponse(400, { error: 'Code id is required' });
      }

      const { error } = await supabase.from('promo_codes').delete().eq('id', id);
      if (error) throw error;
      return jsonResponse(200, { success: true });
    }

    return jsonResponse(400, { error: 'Unknown action' });
  } catch (error) {
    console.error('admin-promo-codes error:', error);
    return jsonResponse(500, { error: error.message || 'Admin promo request failed' });
  }
};
