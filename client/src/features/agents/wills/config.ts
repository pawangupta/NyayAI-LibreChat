type EndpointLike = { name: string };

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? '';

export const WILLS_PRIMARY_ENDPOINT = 'Drafting Assistant';
export const WILLS_ENDPOINT_ALIASES = ['Drafting Assistant', 'WillGen', 'Will Creator AI'] as const;
export const WILLS_PRIMARY_MODEL = 'Will Drafting Assistant';
export const WILLS_MODEL_ALIASES = ['Will Drafting Assistant', 'Will Creator AI'] as const;
export const WILLS_LABEL = 'Drafting Assistant';
export const WILLS_NAV_SECTION = 'Drafting';
export const WILLS_DESCRIPTION = 'Generate legal wills and estate documents';

const WILLS_ENDPOINT_SET = new Set(WILLS_ENDPOINT_ALIASES.map((value) => normalize(value)));
const WILLS_MODEL_SET = new Set(WILLS_MODEL_ALIASES.map((value) => normalize(value)));

export function isWillsEndpointName(value?: string | null) {
  return WILLS_ENDPOINT_SET.has(normalize(value));
}

export function isWillsModelName(value?: string | null) {
  return WILLS_MODEL_SET.has(normalize(value));
}

export function resolveWillsEndpointName(endpoints?: EndpointLike[]) {
  for (const endpointName of WILLS_ENDPOINT_ALIASES) {
    if (endpoints?.some((endpoint) => endpoint.name === endpointName)) {
      return endpointName;
    }
  }

  return null;
}
