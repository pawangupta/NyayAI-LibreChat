import React from 'react';
import { Info } from 'lucide-react';

export interface RedlineSuggestionProps {
  number?: number;
  clauseLabel: string;
  currentText: string;
  suggestedText: string;
  reason: string;
}

export const RedlineSuggestion: React.FC<RedlineSuggestionProps> = ({
  number = 1,
  clauseLabel,
  currentText,
  suggestedText,
  reason,
}) => {
  return (
    <div className="redline-suggestion">
      <div className="redline-header">
        <div className="redline-number">{number}</div>
        <div className="redline-content">
          <div className="redline-label">{clauseLabel}</div>

          <div style={{ margin: '0.75rem 0' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--error)',
                marginBottom: '0.25rem',
              }}
            >
              CURRENT
            </div>
            <div className="redline-text current">{currentText}</div>
          </div>

          <div style={{ margin: '0.75rem 0' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--success)',
                marginBottom: '0.25rem',
              }}
            >
              SUGGESTED
            </div>
            <div className="redline-text suggested">{suggestedText}</div>
          </div>

          <div className="redline-reason">
            <Info
              size={16}
              strokeWidth={2}
              style={{
                display: 'inline',
                verticalAlign: 'text-bottom',
                marginRight: '0.375rem',
              }}
              aria-hidden="true"
            />
            <strong>Reason:</strong> {reason}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedlineSuggestion;
