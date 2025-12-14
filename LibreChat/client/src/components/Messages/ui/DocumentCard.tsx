import React from 'react';
import { FileText, Check } from 'lucide-react';
import { cn } from '~/utils';

export type DocumentStatus = 'uploading' | 'uploaded' | 'processing' | 'complete';

export interface DocumentCardProps {
  fileName: string;
  fileSize?: string;
  fileType?: string;
  pageCount?: number;
  status?: DocumentStatus;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  fileName,
  fileSize,
  fileType = 'PDF',
  pageCount,
  status = 'uploaded',
}) => {
  const isUploading = status === 'uploading';
  const isComplete = status === 'complete';

  return (
    <div
      className={cn('document-uploaded', {
        uploading: isUploading,
      })}
      aria-live="polite"
    >
      <div className="document-icon">
        <FileText size={24} strokeWidth={2} aria-hidden="true" />
      </div>
      <div className="document-info">
        <div className="document-name" title={fileName}>
          {fileName}
        </div>
        <div className="document-meta">
          {fileType}
          {fileSize ? ` • ${fileSize}` : ''}
          {pageCount ? ` • ${pageCount} pages` : ''}
        </div>
      </div>
      {isComplete && (
        <Check
          size={20}
          strokeWidth={2}
          style={{ color: 'var(--success)' }}
          role="img"
          aria-label="Upload complete"
        />
      )}
    </div>
  );
};

export default DocumentCard;
