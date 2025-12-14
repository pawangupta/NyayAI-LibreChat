import React from 'react';
import { Check, Loader2 } from 'lucide-react';

export type StatusStepState = 'pending' | 'active' | 'complete';

export interface StatusStep {
  label: string;
  status: StatusStepState;
}

export interface ProcessingStatusProps {
  steps: StatusStep[];
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ steps }) => {
  if (!steps?.length) {
    return null;
  }

  return (
    <div className="processing-status">
      {steps.map((step, index) => {
        const isActive = step.status === 'active';
        const isComplete = step.status === 'complete';

        return (
          <div key={`${step.label}-${index}`} className={`status-item ${step.status}`}>
            {isActive ? (
              <Loader2 size={20} strokeWidth={2} className="status-icon spinner" aria-hidden="true" />
            ) : isComplete ? (
              <Check size={20} strokeWidth={2} className="status-icon" aria-hidden="true" />
            ) : (
              <div className="status-icon" aria-hidden="true" />
            )}
            <span>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ProcessingStatus;
