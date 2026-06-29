import { supabase } from '../supabase/client';
import { v4 as uuidv4 } from 'uuid';
import authService from './auth';
import { getDocumentVaultLimit, hasSubscriptionFeature } from '../../config/subscriptionFeatures';

export interface UserDocumentRecord {
  id: string;
  user_id: string;
  organization_id?: string | null;
  organization_traveler_id?: string | null;
  name: string;
  category: string;
  file_path: string;
  file_type?: string | null;
  file_size?: number | null;
  expiry_date?: string | null;
  created_at: string;
  updated_at?: string;
  signed_url?: string;
}

const BUCKET = 'user-documents';

function mapRow(row: Record<string, unknown>): UserDocumentRecord {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    organization_id: (row.organization_id as string) || null,
    organization_traveler_id: (row.organization_traveler_id as string) || null,
    name: row.name as string,
    category: (row.category as string) || 'General',
    file_path: row.file_path as string,
    file_type: (row.file_type as string) || null,
    file_size: row.file_size != null ? Number(row.file_size) : null,
    expiry_date: (row.expiry_date as string) || null,
    created_at: row.created_at as string,
    updated_at: (row.updated_at as string) || undefined,
  };
}

async function attachSignedUrls(docs: UserDocumentRecord[]): Promise<UserDocumentRecord[]> {
  return Promise.all(
    docs.map(async (doc) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(doc.file_path, 3600);
      return { ...doc, signed_url: data?.signedUrl };
    })
  );
}

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? '';
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    message.includes('user_documents') ||
    message.includes('does not exist')
  );
}

export const documentService = {
  async uploadUserDocument(
    userId: string,
    file: File,
    documentName?: string,
    category = 'General',
    options?: { organizationId?: string; travelerId?: string; expiryDate?: string }
  ) {
    try {
      const { user, error: authError } = await authService.getCurrentUser();
      if (authError || !user) throw authError || new Error('Not authenticated');
      if (user.id !== userId) throw new Error('Not authorized');

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .maybeSingle();

      const tier = profile?.subscription_tier || 'free';
      if (!hasSubscriptionFeature(tier, 'documentVault')) {
        throw new Error('Document storage requires a Premium or Enterprise subscription.');
      }

      const limit = getDocumentVaultLimit(tier);
      const { count } = await supabase
        .from('user_documents')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if ((count ?? 0) >= limit) {
        throw new Error(`Document limit reached (${limit}). Remove old files or upgrade your plan.`);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from('user_documents')
        .insert({
          user_id: userId,
          organization_id: options?.organizationId ?? null,
          organization_traveler_id: options?.travelerId ?? null,
          name: documentName || file.name,
          category,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          expiry_date: options?.expiryDate ?? null,
        })
        .select()
        .single();

      if (insertError) {
        await supabase.storage.from(BUCKET).remove([filePath]);
        if (isMissingTable(insertError)) {
          throw new Error('Document storage is not configured yet. Run the latest Supabase migration.');
        }
        throw insertError;
      }

      const [withUrl] = await attachSignedUrls([mapRow(data as Record<string, unknown>)]);
      return { document: withUrl, error: null };
    } catch (error) {
      return { document: null, error: error as Error };
    }
  },

  async deleteUserDocument(documentId: string) {
    try {
      const { user, error: authError } = await authService.getCurrentUser();
      if (authError || !user) throw authError || new Error('Not authenticated');

      const { data: doc, error: fetchError } = await supabase
        .from('user_documents')
        .select('file_path')
        .eq('id', documentId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      await supabase.storage.from(BUCKET).remove([doc.file_path]);

      const { error: deleteError } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  },

  async getUserDocuments() {
    try {
      const { user, error: authError } = await authService.getCurrentUser();
      if (authError || !user) throw authError || new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (isMissingTable(error)) return { documents: [], error: null };
        throw error;
      }

      const docs = (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
      const withUrls = await attachSignedUrls(docs);
      return { documents: withUrls, error: null };
    } catch (error) {
      return { documents: [], error: error as Error };
    }
  },

  async uploadDocument(tripId: string, userId: string, file: File) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${userId}/trips/${tripId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('trip-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from('trip_documents')
        .insert({
          trip_id: tripId,
          user_id: userId,
          name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return { document: data, error: null };
    } catch (error) {
      return { document: null, error };
    }
  },

  async deleteDocument(documentId: string, userId: string) {
    try {
      const { data: document, error: fetchError } = await supabase
        .from('trip_documents')
        .select('file_path')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      await supabase.storage.from('trip-documents').remove([document.file_path]);

      const { error: deleteError } = await supabase
        .from('trip_documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error };
    }
  },

  async getTripDocuments(tripId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('trip_documents')
        .select('*')
        .eq('trip_id', tripId)
        .eq('user_id', userId);

      if (error) throw error;
      return { documents: data, error: null };
    } catch (error) {
      return { documents: null, error };
    }
  },
};

export default documentService;
