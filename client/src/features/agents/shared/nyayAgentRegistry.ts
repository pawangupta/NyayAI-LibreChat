import {
  CONTRACT_REVIEW_LABEL,
  CONTRACT_REVIEW_PRIMARY_ENDPOINT,
  CONTRACT_REVIEW_PRIMARY_MODEL,
  CONTRACT_REVIEW_NAV_SECTION,
} from '../contract-review/config';
import {
  LEGAL_RESEARCH_LABEL,
  LEGAL_RESEARCH_PRIMARY_ENDPOINT,
  LEGAL_RESEARCH_PRIMARY_MODEL,
  LEGAL_RESEARCH_NAV_SECTION,
} from '../legal-research/config';
import {
  WILLS_LABEL,
  WILLS_NAV_SECTION,
  WILLS_PRIMARY_ENDPOINT,
  WILLS_PRIMARY_MODEL,
} from '../wills/config';
import {
  DOC_DRAFTING_LABEL,
  DOC_DRAFTING_PRIMARY_ENDPOINT,
  DOC_DRAFTING_PRIMARY_MODEL,
} from '../doc-drafting/config';

export interface NavItem {
  label: string;
  endpointName: string;
  model: string;
}

export interface NavSection {
  sectionLabel: string;
  iconPath: string;
  items: NavItem[];
}

export const NYAY_NAV_CONFIG: NavSection[] = [
  {
    sectionLabel: WILLS_NAV_SECTION,
    iconPath:
      'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    items: [
      {
        label: WILLS_LABEL,
        endpointName: WILLS_PRIMARY_ENDPOINT,
        model: WILLS_PRIMARY_MODEL,
      },
      {
        label: DOC_DRAFTING_LABEL,
        endpointName: DOC_DRAFTING_PRIMARY_ENDPOINT,
        model: DOC_DRAFTING_PRIMARY_MODEL,
      },
    ],
  },
  {
    sectionLabel: CONTRACT_REVIEW_NAV_SECTION,
    iconPath:
      'M20 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z',
    items: [
      {
        label: CONTRACT_REVIEW_LABEL,
        endpointName: CONTRACT_REVIEW_PRIMARY_ENDPOINT,
        model: CONTRACT_REVIEW_PRIMARY_MODEL,
      },
    ],
  },
  {
    sectionLabel: LEGAL_RESEARCH_NAV_SECTION,
    iconPath:
      'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    items: [
      {
        label: LEGAL_RESEARCH_LABEL,
        endpointName: LEGAL_RESEARCH_PRIMARY_ENDPOINT,
        model: LEGAL_RESEARCH_PRIMARY_MODEL,
      },
    ],
  },
];

export const NYAY_ENDPOINT_LABELS: Record<string, string> = {
  [WILLS_PRIMARY_ENDPOINT]: WILLS_LABEL,
  [DOC_DRAFTING_PRIMARY_ENDPOINT]: DOC_DRAFTING_LABEL,
  [CONTRACT_REVIEW_PRIMARY_ENDPOINT]: CONTRACT_REVIEW_LABEL,
  [LEGAL_RESEARCH_PRIMARY_ENDPOINT]: LEGAL_RESEARCH_LABEL,
};

export const NYAY_ENDPOINTS = new Set(Object.keys(NYAY_ENDPOINT_LABELS));
