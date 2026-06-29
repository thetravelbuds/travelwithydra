import React from 'react';
import type { ServiceFeeBreakdown } from '../../config/visaServiceFee';
import { PLATFORM_NAME } from '../../config/brand';

interface ServiceFeePricingLinesProps {
  breakdown: ServiceFeeBreakdown;
  currencySymbol?: string;
  subscriptionTierLabel?: string;
}

const ServiceFeePricingLines: React.FC<ServiceFeePricingLinesProps> = ({
  breakdown,
  currencySymbol = '£',
  subscriptionTierLabel,
}) => {
  const {
    firstApplicantFee,
    additionalApplicantFee,
    additionalApplicantCount,
    additionalApplicantDiscountPercent,
    subscriptionDiscountPercent,
    undiscountedTotal,
    total,
    baseFeeGbp,
  } = breakdown;

  const hasSavings = undiscountedTotal > total;

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-base text-gray-600 dark:text-gray-400">
            {PLATFORM_NAME} visa service — 1st applicant
          </p>
          {subscriptionDiscountPercent > 0 && (
            <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900/40 dark:text-green-200">
              {subscriptionDiscountPercent}% {subscriptionTierLabel || 'member'} off
            </span>
          )}
        </div>
        <p className="shrink-0 text-base font-medium text-gray-700 dark:text-gray-300">
          {currencySymbol}
          {firstApplicantFee.toFixed(2)}
        </p>
      </div>

      {additionalApplicantCount > 0 && (
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-base text-gray-600 dark:text-gray-400">
              {PLATFORM_NAME} visa service — {additionalApplicantCount} additional applicant
              {additionalApplicantCount === 1 ? '' : 's'}
            </p>
            <span className="mt-1 inline-block rounded-full bg-teal-100 px-2 py-0.5 text-xs text-teal-800 dark:bg-teal-900/40 dark:text-teal-200">
              {additionalApplicantDiscountPercent}% off each (was {currencySymbol}
              {baseFeeGbp.toFixed(2)})
            </span>
          </div>
          <p className="shrink-0 text-base font-medium text-gray-700 dark:text-gray-300">
            {currencySymbol}
            {(additionalApplicantFee * additionalApplicantCount).toFixed(2)}
          </p>
        </div>
      )}

      {hasSavings && (
        <div className="flex items-center justify-between gap-4 border-t border-dashed border-gray-200 pt-2 dark:border-gray-600">
          <p className="text-sm text-gray-500 dark:text-gray-400">Service fee subtotal</p>
          <div className="text-right">
            <span className="mr-2 text-sm text-gray-400 line-through">
              {currencySymbol}
              {undiscountedTotal.toFixed(2)}
            </span>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {currencySymbol}
              {total.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceFeePricingLines;
