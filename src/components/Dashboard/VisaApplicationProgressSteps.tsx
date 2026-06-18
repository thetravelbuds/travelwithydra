import React from 'react';
import type { VisaApplication } from '../../types/visa';
import {
  VISA_PROGRESS_STEPS,
  getVisaApplicationProgressStep,
} from '../../utils/visaApplicationProgress';

interface VisaApplicationProgressStepsProps {
  application: VisaApplication;
  compact?: boolean;
}

const VisaApplicationProgressSteps: React.FC<VisaApplicationProgressStepsProps> = ({
  application,
  compact = false,
}) => {
  const activeStep = getVisaApplicationProgressStep(application);

  return (
    <ol className={`grid ${compact ? 'grid-cols-2 gap-2 sm:grid-cols-4' : 'grid-cols-1 gap-3 sm:grid-cols-4'}`}>
      {VISA_PROGRESS_STEPS.map((step) => {
        const isComplete = step.id < activeStep;
        const isCurrent = step.id === activeStep;

        return (
          <li
            key={step.id}
            className={`rounded-lg border px-3 py-2 text-xs sm:text-sm ${
              isCurrent
                ? 'border-primary-500 bg-primary-50 text-primary-800'
                : isComplete
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-gray-200 bg-gray-50 text-gray-500'
            }`}
          >
            <span className="mr-1 font-semibold">{step.id}.</span>
            {step.label}
          </li>
        );
      })}
    </ol>
  );
};

export default VisaApplicationProgressSteps;
