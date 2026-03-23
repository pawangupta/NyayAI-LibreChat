/**
 * NyayFeatureNav (v2 — fixed)
 * ───────────────────────────
 * The LibreChat API (/api/endpoints) returns endpoint objects keyed by name
 * but does NOT expose the `group:` field from librechat.yaml.
 *
 * Fix: the nav hierarchy is defined here as a static config that mirrors your
 * librechat.yaml structure. Each entry references an endpoint `name` exactly
 * as it appears in librechat.yaml. The component confirms the endpoint exists
 * in the live API response before rendering it — so if an endpoint is removed
 * from the yaml, it disappears from the nav automatically.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetEndpointsQuery } from '~/data-provider';
import { useNewConvo } from '~/hooks';
import { cn } from '~/utils';

interface NavItem {
  label: string;
  endpointName: string;
  model: string;
}

interface NavSection {
  sectionLabel: string;
  items: NavItem[];
}

const NYAY_NAV_CONFIG: NavSection[] = [
  {
    sectionLabel: 'Drafting',
    items: [
      {
        label: 'Drafting Assistant',
        endpointName: 'Drafting Assistant',
        model: 'Will Drafting Assistant',
      },
    ],
  },
  {
    sectionLabel: 'Contract Review',
    items: [
      {
        label: 'Contract Review',
        endpointName: 'Contract Review',
        model: 'Tabular Contract Review',
      },
    ],
  },
  {
    sectionLabel: 'Legal Research',
    items: [
      {
        label: 'Legal Research',
        endpointName: 'Legal Research',
        model: 'Legal Research Assistant',
      },
    ],
  },
];

function loadOpenGroups(): Record<string, boolean> {
  try {
    const v = localStorage.getItem('nyay_nav_groups');
    return v ? JSON.parse(v) : {};
  } catch {
    return {};
  }
}

function saveOpenGroups(state: Record<string, boolean>) {
  try {
    localStorage.setItem('nyay_nav_groups', JSON.stringify(state));
  } catch {
    // ignore quota failures
  }
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className={cn('flex-shrink-0 transition-transform duration-150', open && 'rotate-90')}
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

function SubItem({ item, onSelect }: { item: NavItem; onSelect: (item: NavItem) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={cn(
        'flex w-full items-center rounded-md py-1.5 pl-8 pr-3 text-left',
        'text-sm text-text-secondary',
        'transition-colors duration-150',
        'hover:bg-surface-hover hover:text-text-primary',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring-primary',
      )}
    >
      <span className="truncate">{item.label}</span>
    </button>
  );
}

function SectionHeader({
  label,
  isOpen,
  onToggle,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left',
        'text-sm font-medium text-text-primary',
        'transition-colors duration-150 hover:bg-surface-hover',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring-primary',
      )}
    >
      <ChevronIcon open={isOpen} />
      <span className="truncate">{label}</span>
    </button>
  );
}

export default function NyayFeatureNav() {
  const navigate = useNavigate();
  const { newConversation } = useNewConvo();
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(loadOpenGroups);

  const toggleGroup = useCallback((label: string) => {
    setOpenGroups((prev) => {
      const isCurrentlyOpen = prev[label] ?? true;
      const next = { ...prev, [label]: !isCurrentlyOpen };
      saveOpenGroups(next);
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (item: NavItem) => {
      newConversation({
        template: {
          endpoint: item.endpointName as never,
          model: item.model,
        },
      });
      navigate('/c/new');
    },
    [newConversation, navigate],
  );

  const visibleSections = NYAY_NAV_CONFIG.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => endpointsConfig && (endpointsConfig as Record<string, unknown>)[item.endpointName],
    ),
  })).filter((section) => section.items.length > 0);

  if (visibleSections.length === 0) {
    return null;
  }

  return (
    <div className="nyay-feature-nav mb-1 flex flex-col gap-0.5 px-0">
      {visibleSections.map(({ sectionLabel, items }) => {
        const isOpen = openGroups[sectionLabel] ?? true;
        return (
          <div key={sectionLabel} className="nyay-group">
            <SectionHeader
              label={sectionLabel}
              isOpen={isOpen}
              onToggle={() => toggleGroup(sectionLabel)}
            />
            {isOpen && (
              <div className="mb-0.5 flex flex-col gap-0.5">
                {items.map((item) => (
                  <SubItem key={item.endpointName} item={item} onSelect={handleSelect} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="mx-2 my-1.5 border-t border-border-light" />
    </div>
  );
}
