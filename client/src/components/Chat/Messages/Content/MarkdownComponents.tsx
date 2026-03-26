import React, { memo, useMemo, useRef, useEffect } from 'react';
import { FileSearch, Gavel, Scale } from 'lucide-react';
import { useRecoilValue } from 'recoil';
import { useToastContext } from '@librechat/client';
import { PermissionTypes, Permissions, dataService } from 'librechat-data-provider';
import CodeBlock from '~/components/Messages/Content/CodeBlock';
import useHasAccess from '~/hooks/Roles/useHasAccess';
import { useFileDownload } from '~/data-provider';
import { useCodeBlockContext } from '~/Providers';
import { handleDoubleClick } from '~/utils';
import { useLocalize } from '~/hooks';
import store from '~/store';

type TCodeProps = {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
};

export const code: React.ElementType = memo(({ className, children }: TCodeProps) => {
  const canRunCode = useHasAccess({
    permissionType: PermissionTypes.RUN_CODE,
    permission: Permissions.USE,
  });
  const match = /language-(\w+)/.exec(className ?? '');
  const lang = match && match[1];
  const isMath = lang === 'math';
  const isSingleLine = typeof children === 'string' && children.split('\n').length === 1;

  const { getNextIndex, resetCounter } = useCodeBlockContext();
  const blockIndex = useRef(getNextIndex(isMath || isSingleLine)).current;

  useEffect(() => {
    resetCounter();
  }, [children, resetCounter]);

  if (isMath) {
    return <>{children}</>;
  } else if (isSingleLine) {
    return (
      <code onDoubleClick={handleDoubleClick} className={className}>
        {children}
      </code>
    );
  } else {
    return (
      <CodeBlock
        lang={lang ?? 'text'}
        codeChildren={children}
        blockIndex={blockIndex}
        allowExecution={canRunCode}
      />
    );
  }
});

export const codeNoExecution: React.ElementType = memo(({ className, children }: TCodeProps) => {
  const match = /language-(\w+)/.exec(className ?? '');
  const lang = match && match[1];

  if (lang === 'math') {
    return children;
  } else if (typeof children === 'string' && children.split('\n').length === 1) {
    return (
      <code onDoubleClick={handleDoubleClick} className={className}>
        {children}
      </code>
    );
  } else {
    return <CodeBlock lang={lang ?? 'text'} codeChildren={children} allowExecution={false} />;
  }
});

type TAnchorProps = {
  href: string;
  children: React.ReactNode;
};

export const a: React.ElementType = memo(({ href, children }: TAnchorProps) => {
  const user = useRecoilValue(store.user);
  const { showToast } = useToastContext();
  const localize = useLocalize();

  const {
    file_id = '',
    filename = '',
    filepath,
  } = useMemo(() => {
    const pattern = new RegExp(`(?:files|outputs)/${user?.id}/([^\\s]+)`);
    const match = href.match(pattern);
    if (match && match[0]) {
      const path = match[0];
      const parts = path.split('/');
      const name = parts.pop();
      const file_id = parts.pop();
      return { file_id, filename: name, filepath: path };
    }
    return { file_id: '', filename: '', filepath: '' };
  }, [user?.id, href]);

  const { refetch: downloadFile } = useFileDownload(user?.id ?? '', file_id);
  const props: { target?: string; onClick?: React.MouseEventHandler } = { target: '_new' };

  if (!file_id || !filename) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  const handleDownload = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    try {
      const stream = await downloadFile();
      if (stream.data == null || stream.data === '') {
        console.error('Error downloading file: No data found');
        showToast({
          status: 'error',
          message: localize('com_ui_download_error'),
        });
        return;
      }
      const link = document.createElement('a');
      link.href = stream.data;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(stream.data);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  props.onClick = handleDownload;
  props.target = '_blank';

  const domainServerBaseUrl = dataService.getDomainServerBaseUrl();

  return (
    <a
      href={
        filepath?.startsWith('files/')
          ? `${domainServerBaseUrl}/${filepath}`
          : `${domainServerBaseUrl}/files/${filepath}`
      }
      {...props}
    >
      {children}
    </a>
  );
});

type TParagraphProps = {
  children: React.ReactNode;
};

export const p: React.ElementType = memo(({ children }: TParagraphProps) => {
  return <p className="mb-2 whitespace-pre-wrap">{children}</p>;
});

type THeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  children: React.ReactNode;
};

function extractHeadingText(children: React.ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(extractHeadingText).join('');
  }

  if (React.isValidElement(children)) {
    return extractHeadingText(children.props.children);
  }

  return '';
}

function normalizeHeadingText(text: string): string {
  return text.replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s+/g, ' ').trim();
}

function BrandHeadingIcon() {
  return (
    <span className="mr-3 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-md align-[-0.18em] shadow-sm ring-1 ring-black/5 dark:ring-white/10">
      <img
        src="/assets/NyayAI.svg"
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover dark:hidden"
        draggable={false}
      />
      <img
        src="/assets/NyayAI_Dark.png"
        alt=""
        aria-hidden="true"
        className="hidden h-full w-full object-cover dark:block"
        draggable={false}
      />
    </span>
  );
}

function SectionHeadingIcon({
  type,
}: {
  type:
    | 'issues'
    | 'case-law'
    | 'executive-summary'
    | 'recommendations'
    | 'clause-preview'
    | 'comprehensive-report';
}) {
  const Icon =
    type === 'issues' || type === 'clause-preview' || type === 'comprehensive-report'
      ? FileSearch
      : type === 'case-law'
        ? Scale
        : Gavel;

  return (
    <span className="mr-2 inline-flex align-[-0.14em] text-[#214e6a] dark:text-[#d4b46b]">
      <Icon className="h-[1.05em] w-[1.05em]" strokeWidth={2.1} />
    </span>
  );
}

function renderHeading(
  Tag: 'h1' | 'h2',
  { children, className, ...props }: THeadingProps,
) {
  const rawText = extractHeadingText(children);
  const text = normalizeHeadingText(rawText);

  if (text === 'NyayAI Legal Research Report') {
    return (
      <Tag className={className} {...props}>
        <span className="inline-flex items-center">
          <BrandHeadingIcon />
          <span>{text}</span>
        </span>
      </Tag>
    );
  }

  if (text === 'Legal Issues Identified') {
    return (
      <Tag className={className} {...props}>
        <span className="inline-flex items-center">
          <SectionHeadingIcon type="issues" />
          <span>{text}</span>
        </span>
      </Tag>
    );
  }

  if (text === 'Case Law') {
    return (
      <Tag className={className} {...props}>
        <span className="inline-flex items-center">
          <SectionHeadingIcon type="case-law" />
          <span>{text}</span>
        </span>
      </Tag>
    );
  }

  if (text === 'NyayAI Contract Review Report' || text === 'Contract Review Report') {
    return (
      <Tag className={className} {...props}>
        <span className="inline-flex items-center">
          <BrandHeadingIcon />
          <span>{text}</span>
        </span>
      </Tag>
    );
  }

  if (text === 'Executive Summary') {
    return (
      <Tag className={className} {...props}>
        <span className="inline-flex items-center">
          <SectionHeadingIcon type="executive-summary" />
          <span>{text}</span>
        </span>
      </Tag>
    );
  }

  if (text === 'Key Recommendations') {
    return (
      <Tag className={className} {...props}>
        <span className="inline-flex items-center">
          <SectionHeadingIcon type="recommendations" />
          <span>{text}</span>
        </span>
      </Tag>
    );
  }

  if (text === 'Clause Preview') {
    return (
      <Tag className={className} {...props}>
        <span className="inline-flex items-center">
          <SectionHeadingIcon type="clause-preview" />
          <span>{text}</span>
        </span>
      </Tag>
    );
  }

  if (text === 'Comprehensive Report') {
    return (
      <Tag className={className} {...props}>
        <span className="inline-flex items-center">
          <SectionHeadingIcon type="comprehensive-report" />
          <span>{text}</span>
        </span>
      </Tag>
    );
  }

  return React.createElement(Tag, { className, ...props }, children);
}

export const h1: React.ElementType = memo((props: THeadingProps) => renderHeading('h1', props));

export const h2: React.ElementType = memo((props: THeadingProps) => renderHeading('h2', props));
