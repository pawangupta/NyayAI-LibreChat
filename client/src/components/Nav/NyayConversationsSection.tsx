/**
 * NyayConversationsSection
 * ─────────────────────────
 * A collapsible shell that wraps LibreChat's existing <Conversations> component.
 *
 * Design decisions:
 *
 *  • The child is ALWAYS mounted (display:none when collapsed, not unmounted).
 *    This preserves:
 *      - The React Query conversations cache (no re-fetch on expand)
 *      - The infinite scroll position (list stays where you left it)
 *      - The search state (debouncedQuery, isTyping)
 *      - ConvoItem hover/rename/delete state
 *
 *  • Collapse state is persisted in localStorage under 'nyay_convos_open'.
 *
 *  • The header row uses the same Tailwind token classes as the rest of Nav
 *    so it blends with NyayFeatureNav group headers visually.
 */

import { useState, useCallback, memo } from 'react';
import { cn } from '~/utils';

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={cn('flex-shrink-0 transition-transform duration-200', open && 'rotate-90')}
      aria-hidden="true"
    >
      <path
        d="M4 2.5L7.5 6L4 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0 text-text-secondary"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

const STORAGE_KEY = 'nyay_convos_open';

function loadOpen(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === 'true';
  } catch {
    return true;
  }
}

interface Props {
  children: React.ReactNode;
}

function NyayConversationsSection({ children }: Props) {
  const [open, setOpen] = useState<boolean>(loadOpen);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return (
    <div className="nyay-convos-section flex min-h-0 flex-1 flex-col">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="nyay-convos-body"
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left',
          'text-sm font-medium text-text-primary',
          'transition-colors duration-150',
          'hover:bg-surface-hover',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring-primary',
        )}
      >
        <MessageIcon />
        <span className="flex-1 truncate">Recent Chats</span>
        <ChevronIcon open={open} />
      </button>

      <div
        id="nyay-convos-body"
        className="min-h-0 flex-1 overflow-hidden"
        style={{ display: open ? undefined : 'none' }}
      >
        {children}
      </div>
    </div>
  );
}

export default memo(NyayConversationsSection);
