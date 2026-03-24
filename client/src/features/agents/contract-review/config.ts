type EndpointLike = { name: string };

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? '';

export const CONTRACT_REVIEW_PRIMARY_ENDPOINT = 'Contract Review';
export const CONTRACT_REVIEW_ENDPOINT_ALIASES = ['Contract Review', 'LegalContract'] as const;
export const CONTRACT_REVIEW_PRIMARY_MODEL = 'Tabular Contract Review';
export const CONTRACT_REVIEW_MODEL_ALIASES = [
  'Tabular Contract Review',
  'Legal Contract Analyzer',
  'Comprehensive Contract Review',
] as const;
export const CONTRACT_REVIEW_LABEL = 'Contract Review';
export const CONTRACT_REVIEW_NAV_SECTION = 'Contract Review';

const CONTRACT_REVIEW_ENDPOINT_SET = new Set(
  CONTRACT_REVIEW_ENDPOINT_ALIASES.map((value) => normalize(value)),
);
const CONTRACT_REVIEW_MODEL_SET = new Set(
  CONTRACT_REVIEW_MODEL_ALIASES.map((value) => normalize(value)),
);

export function isContractReviewEndpointName(value?: string | null) {
  return CONTRACT_REVIEW_ENDPOINT_SET.has(normalize(value));
}

export function isContractReviewModelName(value?: string | null) {
  return CONTRACT_REVIEW_MODEL_SET.has(normalize(value));
}

export function resolveContractReviewEndpointName(endpoints?: EndpointLike[]) {
  for (const endpointName of CONTRACT_REVIEW_ENDPOINT_ALIASES) {
    if (endpoints?.some((endpoint) => endpoint.name === endpointName)) {
      return endpointName;
    }
  }

  return null;
}
