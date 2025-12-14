import React from 'react';
import { FileSearch, BookOpen, GitCompare, ChevronRight } from 'lucide-react';

export interface QuickAction {
  icon?: React.ReactNode;
  text: string;
  onClick?: () => void;
}

export interface QuickActionsProps {
  actions?: QuickAction[];
}

const defaultActions: QuickAction[] = [
  {
    icon: <FileSearch size={20} strokeWidth={2} aria-hidden="true" />,
    text: 'Analyze risks in detail',
    onClick: () => {},
  },
  {
    icon: <BookOpen size={20} strokeWidth={2} aria-hidden="true" />,
    text: 'Extract specific clauses',
    onClick: () => {},
  },
  {
    icon: <GitCompare size={20} strokeWidth={2} aria-hidden="true" />,
    text: 'Compare against industry benchmarks',
    onClick: () => {},
  },
];

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  const actionList = actions?.length ? actions : defaultActions;

  return (
    <div className="quick-actions">
      <div className="quick-action-label">Need more help? Ask me to:</div>
      {actionList.map((action, index) => (
        <button
          key={`${action.text}-${index}`}
          className="quick-action-item"
          onClick={action.onClick}
          type="button"
        >
          <div className="quick-action-icon">
            {action.icon || <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />}
          </div>
          <span className="quick-action-text">{action.text}</span>
          <ChevronRight size={16} strokeWidth={2} className="quick-action-arrow" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
