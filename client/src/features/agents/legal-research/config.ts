type EndpointLike = { name: string };

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? '';

export const LEGAL_RESEARCH_PRIMARY_ENDPOINT = 'Legal Research';
export const LEGAL_RESEARCH_ENDPOINT_ALIASES = ['Legal Research'] as const;
export const LEGAL_RESEARCH_PRIMARY_MODEL = 'Legal Research Assistant';
export const LEGAL_RESEARCH_MODEL_ALIASES = ['Legal Research Assistant'] as const;
export const LEGAL_RESEARCH_LABEL = 'Legal Research';
export const LEGAL_RESEARCH_NAV_SECTION = 'Legal Research';

const LEGAL_RESEARCH_ENDPOINT_SET = new Set(
  LEGAL_RESEARCH_ENDPOINT_ALIASES.map((value) => normalize(value)),
);
const LEGAL_RESEARCH_MODEL_SET = new Set(
  LEGAL_RESEARCH_MODEL_ALIASES.map((value) => normalize(value)),
);

export function isLegalResearchEndpointName(value?: string | null) {
  return LEGAL_RESEARCH_ENDPOINT_SET.has(normalize(value));
}

export function isLegalResearchModelName(value?: string | null) {
  return LEGAL_RESEARCH_MODEL_SET.has(normalize(value));
}

export function resolveLegalResearchEndpointName(endpoints?: EndpointLike[]) {
  for (const endpointName of LEGAL_RESEARCH_ENDPOINT_ALIASES) {
    if (endpoints?.some((endpoint) => endpoint.name === endpointName)) {
      return endpointName;
    }
  }

  return null;
}
