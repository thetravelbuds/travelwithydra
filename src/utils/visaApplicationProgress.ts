import type { VisaApplication } from '../types/visa';

export const VISA_PROGRESS_STEPS = [
  { id: 1, label: 'Application in progress' },
  { id: 2, label: 'Application completed' },
  { id: 3, label: 'Submitted to country' },
  { id: 4, label: 'Decision outcome' },
] as const;

export function isIncompleteDraft(application: VisaApplication): boolean {
  return application.status === 'pending' && application.application_data?.draft === true;
}

/** Map application status to the 1–4 step timeline. */
export function getVisaApplicationProgressStep(application: VisaApplication): number {
  if (isIncompleteDraft(application)) return 1;

  if (application.status === 'approved' || application.status === 'rejected') {
    return 4;
  }

  if (
    application.status === 'processing' ||
    application.status === 'in_review' ||
    (application.status === 'submitted' && application.payment_status === 'paid')
  ) {
    return 3;
  }

  if (application.status === 'submitted' || application.status === 'pending') {
    return 2;
  }

  return 1;
}

export function getVisaApplicationProgressLabel(application: VisaApplication): string {
  const step = getVisaApplicationProgressStep(application);
  const current = VISA_PROGRESS_STEPS.find((s) => s.id === step);
  return current?.label ?? 'Application in progress';
}
