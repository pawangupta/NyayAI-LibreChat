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

import { useState, useCallback, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  iconPath: string;
  items: NavItem[];
}

const NYAY_NAV_CONFIG: NavSection[] = [
  {
    sectionLabel: 'Drafting',
    iconPath:
      'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
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
    iconPath:
      'M20 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z',
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
    iconPath:
      'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
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

function SectionIcon({ path, active }: { path: string; active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn(
        'flex-shrink-0 transition-colors duration-150',
        active ? 'text-text-primary' : 'text-text-secondary',
      )}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

const SubItem = memo(function SubItem({
  item,
  onSelect,
  isActive,
}: {
  item: NavItem;
  onSelect: (item: NavItem) => void;
  isActive: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={cn(
        'flex w-full items-center rounded-md py-1.5 pl-10 pr-3 text-left text-sm',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring-primary',
        isActive
          ? 'font-medium text-text-primary'
          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
      )}
    >
      {isActive && (
        <span className="mr-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-text-primary" />
      )}
      <span className="truncate">{item.label}</span>
    </button>
  );
});

const SectionHeader = memo(function SectionHeader({
  section,
  isOpen,
  isActive,
  onToggle,
}: {
  section: NavSection;
  isOpen: boolean;
  isActive: boolean;
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
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring-primary',
        isActive ? 'bg-surface-hover' : 'hover:bg-surface-hover',
      )}
    >
      <SectionIcon path={section.iconPath} active={isActive} />
      <span className="flex-1 truncate">{section.sectionLabel}</span>
      <ChevronIcon open={isOpen} />
    </button>
  );
});

export default function NyayFeatureNav() {
  const navigate = useNavigate();
  const { newConversation } = useNewConvo();
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const [searchParams] = useSearchParams();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(loadOpenGroups);
  const activeEndpoint = searchParams.get('endpoint') ?? '';

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

      const nextSearchParams = new URLSearchParams();
      nextSearchParams.set('endpoint', item.endpointName);
      nextSearchParams.set('model', item.model);
      navigate(`/c/new?${nextSearchParams.toString()}`, { state: { focusChat: true } });
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
      {visibleSections.map((section) => {
        const { sectionLabel, items } = section;
        const isOpen = openGroups[sectionLabel] ?? true;
        const isSectionActive = items.some((item) => item.endpointName === activeEndpoint);
        return (
          <div key={sectionLabel} className="nyay-group">
            <SectionHeader
              section={section}
              isOpen={isOpen}
              isActive={isSectionActive}
              onToggle={() => toggleGroup(sectionLabel)}
            />
            {isOpen && (
              <div className="mb-0.5 flex flex-col gap-0.5">
                {items.map((item) => (
                  <SubItem
                    key={item.endpointName}
                    item={item}
                    onSelect={handleSelect}
                    isActive={item.endpointName === activeEndpoint}
                  />
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
