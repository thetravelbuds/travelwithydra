import supabase from '../supabase/client';
import { VisaApplication } from '../../types/visa';
import authService from './auth';
import { getCountryNameFromCode } from './visaRequirements';

export interface CreateVisaApplicationInput {
  nationalityCode: string;
  destinationCode: string;
  purposeOfVisit?: string;
  entryDate?: string;
  exitDate?: string;
  applicationData?: Record<string, unknown>;
  paymentStatus?: 'pending' | 'paid';
  draftId?: string;
}

/**
 * Service to handle visa application operations
 */
function isMissingApplicationsTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? '';
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    message.includes('visa_applications') ||
    message.includes('does not exist') ||
    message.includes('could not find the table')
  );
}

function mapApplicationRow(row: Record<string, unknown>): VisaApplication {
  const destinationCode = (row.destination_code as string) || (row.destination_id as string) || '';

  return {
    id: row.id as string,
    user_id: row.user_id as string,
    destination_id: destinationCode,
    destination_code: destinationCode,
    destination_name: row.destination_name as string | undefined,
    nationality_code: row.nationality_code as string | undefined,
    status: (row.status as VisaApplication['status']) || 'submitted',
    application_date: (row.application_date as string) || (row.created_at as string),
    documents_uploaded: Boolean(row.documents_uploaded),
    payment_status: (row.payment_status as VisaApplication['payment_status']) || 'pending',
    approval_date: row.approval_date as string | undefined,
    visa_document_url: row.visa_document_url as string | undefined,
    purpose_of_visit: row.purpose_of_visit as string | undefined,
    entry_date: row.entry_date as string | undefined,
    exit_date: row.exit_date as string | undefined,
    application_data: row.application_data as Record<string, unknown> | undefined,
  };
}

export interface SaveDraftApplicationInput {
  draftId?: string;
  nationalityCode: string;
  destinationCode: string;
  currentStep: number;
  applicationData: Record<string, unknown>;
}

const LOCAL_DRAFTS_KEY = 'travelwithydra_visa_drafts';

function draftStorageKey(userId: string, nationality: string, destination: string): string {
  return `${userId}:${nationality.toLowerCase()}:${destination.toLowerCase()}`;
}

function readLocalDrafts(): Record<string, VisaApplication> {
  try {
    const raw = localStorage.getItem(LOCAL_DRAFTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, VisaApplication>) : {};
  } catch {
    return {};
  }
}

function writeLocalDrafts(drafts: Record<string, VisaApplication>) {
  localStorage.setItem(LOCAL_DRAFTS_KEY, JSON.stringify(drafts));
}

function saveLocalDraft(userId: string, input: SaveDraftApplicationInput, draftId?: string): VisaApplication {
  const nationality = input.nationalityCode.toLowerCase();
  const destination = input.destinationCode.toLowerCase();
  const key = draftStorageKey(userId, nationality, destination);
  const drafts = readLocalDrafts();
  const id = draftId ?? drafts[key]?.id ?? `local-draft-${userId}-${nationality}-${destination}`;
  const application: VisaApplication = {
    id,
    user_id: userId,
    destination_id: destination,
    destination_code: destination,
    destination_name: getCountryNameFromCode(destination),
    nationality_code: nationality,
    status: 'pending',
    application_date: drafts[key]?.application_date ?? new Date().toISOString(),
    documents_uploaded: false,
    payment_status: 'pending',
    application_data: {
      ...input.applicationData,
      draft: true,
      currentStep: input.currentStep,
    },
  };
  drafts[key] = application;
  writeLocalDrafts(drafts);
  return application;
}

function removeLocalDraft(userId: string, nationality: string, destination: string) {
  const drafts = readLocalDrafts();
  delete drafts[draftStorageKey(userId, nationality, destination)];
  writeLocalDrafts(drafts);
}

function mergeApplicationsWithLocalDrafts(
  userId: string,
  remote: VisaApplication[]
): VisaApplication[] {
  const drafts = readLocalDrafts();
  const merged = new Map<string, VisaApplication>();

  for (const app of remote) {
    if (!isRemoteDraft(app)) {
      merged.set(app.id, app);
    }
  }

  for (const draft of Object.values(drafts)) {
    if (draft.user_id !== userId) continue;
    const nationality = draft.nationality_code ?? '';
    const destination = draft.destination_code ?? draft.destination_id ?? '';
    const remoteDraft = remote.find(
      (app) =>
        app.status === 'pending' &&
        app.application_data?.draft === true &&
        app.nationality_code?.toLowerCase() === nationality.toLowerCase() &&
        (app.destination_code ?? app.destination_id)?.toLowerCase() === destination.toLowerCase()
    );
    merged.set(remoteDraft?.id ?? draft.id, remoteDraft ?? draft);
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.application_date).getTime() - new Date(a.application_date).getTime()
  );
}

function isRemoteDraft(app: VisaApplication): boolean {
  return app.status === 'pending' && app.application_data?.draft === true;
}

const visaApplicationsService = {
  async saveDraftApplication(
    input: SaveDraftApplicationInput
  ): Promise<{ application: VisaApplication | null; error: Error | null }> {
    try {
      const { user, error: authError } = await authService.getCurrentUser();
      if (authError || !user) {
        return { application: null, error: authError || new Error('Not authenticated') };
      }

      const destinationName = getCountryNameFromCode(input.destinationCode);
      const nationality = input.nationalityCode.toLowerCase();
      const destination = input.destinationCode.toLowerCase();

      const applicationData = {
        ...input.applicationData,
        draft: true,
        currentStep: input.currentStep,
      };

      const row = {
        nationality_code: nationality,
        destination_code: destination,
        destination_name: destinationName,
        status: 'pending' as const,
        payment_status: 'pending' as const,
        documents_uploaded: false,
        application_data: applicationData,
        updated_at: new Date().toISOString(),
      };

      let draftId = input.draftId;
      const localDraft = saveLocalDraft(user.id, input, draftId);

      if (!draftId) {
        const { data: existing } = await supabase
          .from('visa_applications')
          .select('id')
          .eq('user_id', user.id)
          .eq('nationality_code', nationality)
          .eq('destination_code', destination)
          .eq('status', 'pending')
          .maybeSingle();

        if (existing?.id) {
          draftId = existing.id as string;
        }
      }

      if (draftId) {
        const { data, error } = await supabase
          .from('visa_applications')
          .update(row)
          .eq('id', draftId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (!error && data) {
          saveLocalDraft(user.id, input, data.id as string);
          return { application: mapApplicationRow(data as Record<string, unknown>), error: null };
        }
      }

      const { data, error } = await supabase
        .from('visa_applications')
        .insert({
          user_id: user.id,
          ...row,
        })
        .select()
        .single();

      if (!error && data) {
        saveLocalDraft(user.id, input, data.id as string);
        return { application: mapApplicationRow(data as Record<string, unknown>), error: null };
      }

      if (isMissingApplicationsTable(error)) {
        return { application: localDraft, error: null };
      }

      return { application: localDraft, error: null };
    } catch (error) {
      return { application: null, error: error as Error };
    }
  },

  async createApplication(
    input: CreateVisaApplicationInput
  ): Promise<{ application: VisaApplication | null; error: Error | null }> {
    try {
      const { user, error: authError } = await authService.getCurrentUser();
      if (authError || !user) {
        return { application: null, error: authError || new Error('Not authenticated') };
      }

      const destinationName = getCountryNameFromCode(input.destinationCode);

      const finalizedData = {
        ...(input.applicationData ?? {}),
        draft: false,
      };

      if (input.draftId) {
        const { data, error } = await supabase
          .from('visa_applications')
          .update({
            nationality_code: input.nationalityCode.toLowerCase(),
            destination_code: input.destinationCode.toLowerCase(),
            destination_name: destinationName,
            purpose_of_visit: input.purposeOfVisit ?? null,
            entry_date: input.entryDate ?? null,
            exit_date: input.exitDate ?? null,
            application_data: finalizedData,
            payment_status: input.paymentStatus ?? 'pending',
            status: 'submitted',
            documents_uploaded: Boolean(input.applicationData),
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.draftId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error || !data) {
          return { application: null, error: error ?? new Error('Failed to finalize application') };
        }
        removeLocalDraft(
          user.id,
          input.nationalityCode.toLowerCase(),
          input.destinationCode.toLowerCase()
        );
        return { application: mapApplicationRow(data as Record<string, unknown>), error: null };
      }

      const { data, error } = await supabase
        .from('visa_applications')
        .insert({
          user_id: user.id,
          nationality_code: input.nationalityCode.toLowerCase(),
          destination_code: input.destinationCode.toLowerCase(),
          destination_name: destinationName,
          purpose_of_visit: input.purposeOfVisit ?? null,
          entry_date: input.entryDate ?? null,
          exit_date: input.exitDate ?? null,
          application_data: finalizedData,
          payment_status: input.paymentStatus ?? 'pending',
          status: 'submitted',
          documents_uploaded: Boolean(input.applicationData),
        })
        .select()
        .single();

      if (error || !data) {
        return { application: null, error: error ?? new Error('Failed to create application') };
      }

      return { application: data as VisaApplication, error: null };
    } catch (error) {
      return { application: null, error: error as Error };
    }
  },

  async markPaymentPaid(
    applicationId: string,
    transactionId?: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await supabase
        .from('visa_applications')
        .update({
          payment_status: 'paid',
          status: 'processing',
          transaction_id: transactionId ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      return { success: !error, error: error ?? null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  },

  /**
   * Get all visa applications for a specific user
   * @param userId - The user ID
   * @returns Promise with the applications or error
   */
  async getUserApplications(userId: string): Promise<{ 
    applications: VisaApplication[] | null; 
    error: Error | null 
  }> {
    try {
      const { data, error } = await supabase
        .from('visa_applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        if (isMissingApplicationsTable(error)) {
          const localOnly = mergeApplicationsWithLocalDrafts(userId, []);
          return { applications: localOnly, error: null };
        }
        console.error('Error fetching visa applications:', error);
        const localOnly = mergeApplicationsWithLocalDrafts(userId, []);
        if (localOnly.length > 0) {
          return { applications: localOnly, error: null };
        }
        return { applications: null, error };
      }

      const applications = (data ?? []).map((row) => mapApplicationRow(row as Record<string, unknown>));
      return { applications: mergeApplicationsWithLocalDrafts(userId, applications), error: null };
    } catch (error) {
      console.error('Unexpected error fetching visa applications:', error);
      return { applications: null, error: error as Error };
    }
  },

  /**
   * Get a specific visa application
   * @param applicationId - The application ID
   * @returns Promise with the application or error
   */
  async getApplicationById(applicationId: string): Promise<{ 
    application: VisaApplication | null; 
    error: Error | null 
  }> {
    try {
      const { data, error } = await supabase
        .from('visa_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (error) {
        console.error('Error fetching visa application:', error);
        return { application: null, error };
      }

      return { application: mapApplicationRow(data as Record<string, unknown>), error: null };
    } catch (error) {
      console.error('Unexpected error fetching visa application:', error);
      return { application: null, error: error as Error };
    }
  },

  /**
   * Update the status of a visa application
   * @param applicationId - The application ID
   * @param status - The new status
   * @returns Promise with the updated application or error
   */
  async updateApplicationStatus(
    applicationId: string, 
    status: 'submitted' | 'in_review' | 'approved' | 'rejected' | 'processing' | 'pending'
  ): Promise<{ 
    success: boolean; 
    error: Error | null 
  }> {
    try {
      const { error } = await supabase
        .from('visa_applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) {
        console.error('Error updating visa application status:', error);
        return { success: false, error };
      }

      if (['in_review', 'approved', 'rejected'].includes(status)) {
        try {
          const { data: appRow } = await supabase
            .from('visa_applications')
            .select('user_id, destination_name, destination_code')
            .eq('id', applicationId)
            .maybeSingle();

          if (appRow?.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email, full_name')
              .eq('id', appRow.user_id)
              .maybeSingle();

            if (profile?.email) {
              const { default: transactionalEmailService } = await import('./transactionalEmail');
              const destination =
                appRow.destination_name ||
                getCountryNameFromCode(appRow.destination_code || '') ||
                appRow.destination_code ||
                'your destination';

              await transactionalEmailService.sendApplicationStatusUpdate({
                status: status as 'in_review' | 'approved' | 'rejected',
                name: profile.full_name || 'there',
                email: profile.email,
                destination,
                application_id: applicationId,
              });
            }
          }
        } catch (emailError) {
          console.warn('Application status email failed:', emailError);
        }
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Unexpected error updating visa application status:', error);
      return { success: false, error: error as Error };
    }
  },

  async getAllApplicationsForAdmin(): Promise<{
    applications: VisaApplication[] | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('visa_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (isMissingApplicationsTable(error)) {
          const localDrafts = Object.values(readLocalDrafts());
          return { applications: localDrafts, error: null };
        }
        return { applications: null, error };
      }

      const remote = (data ?? []).map((row) => mapApplicationRow(row as Record<string, unknown>));
      const localDrafts = Object.values(readLocalDrafts());
      const byId = new Map<string, VisaApplication>();
      for (const app of [...remote, ...localDrafts]) {
        byId.set(app.id, app);
      }
      return { applications: Array.from(byId.values()), error: null };
    } catch (error) {
      return { applications: null, error: error as Error };
    }
  },

  /**
   * Upload a visa document for an approved application
   * @param applicationId - The application ID
   * @param document - The visa document file
   * @returns Promise with the upload status or error
   */
  async uploadVisaDocument(applicationId: string, document: File): Promise<{ 
    url: string | null; 
    error: Error | null 
  }> {
    try {
      // Create a file path for the visa document
      const filePath = `visa_documents/${applicationId}/${document.name}`;
      
      // Upload the document
      const { error: uploadError } = await supabase.storage
        .from('visa_documents')
        .upload(filePath, document);

      if (uploadError) {
        console.error('Error uploading visa document:', uploadError);
        return { url: null, error: uploadError };
      }

      // Get the public URL for the uploaded document
      const { data } = supabase.storage
        .from('visa_documents')
        .getPublicUrl(filePath);

      // Update the application to include the document URL
      const { error: updateError } = await supabase
        .from('visa_applications')
        .update({ 
          visa_document_url: data.publicUrl,
          approval_date: new Date().toISOString() 
        })
        .eq('id', applicationId);

      if (updateError) {
        console.error('Error updating visa application with document URL:', updateError);
        return { url: null, error: updateError };
      }

      return { url: data.publicUrl, error: null };
    } catch (error) {
      console.error('Unexpected error uploading visa document:', error);
      return { url: null, error: error as Error };
    }
  },

  /**
   * Download a visa document
   * @param url - The visa document URL
   * @returns Promise with the download status or error
   */
  async downloadVisaDocument(url: string): Promise<{ 
    success: boolean; 
    error: Error | null 
  }> {
    try {
      // Create an anchor element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = url.split('/').pop() || 'visa-document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true, error: null };
    } catch (error) {
      console.error('Error downloading visa document:', error);
      return { success: false, error: error as Error };
    }
  }
};

export default visaApplicationsService; 