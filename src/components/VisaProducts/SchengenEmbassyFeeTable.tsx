import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaInfoCircle } from 'react-icons/fa';
import { SCHENGEN_EMBASSY_FEE_REFERENCE } from '../../config/schengenPricing';

const SchengenEmbassyFeeTable: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`overflow-hidden rounded-xl border border-amber-200 bg-amber-50/80 dark:border-amber-800/40 dark:bg-amber-900/20 ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <FaInfoCircle className="shrink-0 text-amber-700 dark:text-amber-300" />
          <div className="min-w-0">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100">
              Embassy & appointment centre fees
            </h4>
            <p className="text-xs text-amber-800/90 dark:text-amber-200/90">
              Information only — not collected by travelwithydra
            </p>
          </div>
        </div>
        {isOpen ? (
          <FaChevronUp className="shrink-0 text-amber-700" />
        ) : (
          <FaChevronDown className="shrink-0 text-amber-700" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-2 border-t border-amber-200/80 px-4 pb-4 pt-3 dark:border-amber-800/50">
          <p className="text-sm text-amber-900/90 dark:text-amber-100/90">
            You pay these directly at the VFS or appointment centre on the day of your appointment.
          </p>
          {SCHENGEN_EMBASSY_FEE_REFERENCE.map((row) => (
            <div
              key={row.category}
              className="rounded-lg border border-amber-100 bg-white/70 p-3 dark:border-amber-800/40 dark:bg-gray-900/30"
            >
              <p className="font-medium text-gray-900 dark:text-gray-100">{row.category}</p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700 dark:text-gray-300">
                <span>Government fee: €{row.governmentFeeEur.toFixed(2)}</span>
                <span>Centre service fee: €{row.vfsServiceFeeEur.toFixed(2)}</span>
              </div>
              <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400">{row.notes}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SchengenEmbassyFeeTable;
