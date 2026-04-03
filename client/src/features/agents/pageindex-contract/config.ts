type EndpointLike = { name: string };

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? '';

export const PAGEINDEX_CONTRACT_PRIMARY_ENDPOINT = 'PageIndex Contract Analysis';
export const PAGEINDEX_CONTRACT_ENDPOINT_ALIASES = [
  'PageIndex Contract Analysis',
  'Contract Risk Analysis',
] as const;
export const PAGEINDEX_CONTRACT_PRIMARY_MODEL = 'PageIndex Contract Analysis';
export const PAGEINDEX_CONTRACT_MODEL_ALIASES = [
  'PageIndex Contract Analysis',
  'Contract Risk Analysis',
] as const;
export const PAGEINDEX_CONTRACT_LABEL = 'Contract Analysis';
export const PAGEINDEX_CONTRACT_NAV_SECTION = 'Contract Analysis';

const PAGEINDEX_CONTRACT_ENDPOINT_SET = new Set(
  PAGEINDEX_CONTRACT_ENDPOINT_ALIASES.map((value) => normalize(value)),
);
const PAGEINDEX_CONTRACT_MODEL_SET = new Set(
  PAGEINDEX_CONTRACT_MODEL_ALIASES.map((value) => normalize(value)),
);

export function isPageIndexContractEndpointName(value?: string | null) {
  return PAGEINDEX_CONTRACT_ENDPOINT_SET.has(normalize(value));
}

export function isPageIndexContractModelName(value?: string | null) {
  return PAGEINDEX_CONTRACT_MODEL_SET.has(normalize(value));
}

export function resolvePageIndexContractEndpointName(endpoints?: EndpointLike[]) {
  for (const endpointName of PAGEINDEX_CONTRACT_ENDPOINT_ALIASES) {
    if (endpoints?.some((endpoint) => endpoint.name === endpointName)) {
      return endpointName;
    }
  }
  return null;
}
