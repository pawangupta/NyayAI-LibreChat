type EndpointLike = { name: string };

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? '';

function resolveDraftingApiBaseUrl() {
  const fallbackProtocol = 'http:';
  const fallbackHostname = 'localhost';

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol || fallbackProtocol;
    const hostname = window.location.hostname || fallbackHostname;
    return `${protocol}//${hostname}:8004/v1/drafting`;
  }

  return `${fallbackProtocol}//${fallbackHostname}:8004/v1/drafting`;
}

export const DOC_DRAFTING_API_BASE_URL = resolveDraftingApiBaseUrl();
export const DOC_DRAFTING_PRIMARY_ENDPOINT = 'Drafting Assistant';
export const DOC_DRAFTING_ENDPOINT_ALIASES = ['Drafting Assistant', 'Doc Drafting', 'Drafting Assistant-2'] as const;
export const DOC_DRAFTING_PRIMARY_MODEL = 'Structured Drafting Assistant';
export const DOC_DRAFTING_MODEL_ALIASES = ['Structured Drafting Assistant', 'Document Drafting Assistant'] as const;
export const DOC_DRAFTING_LABEL = 'Drafting Assistant';
export const DOC_DRAFTING_NAV_SECTION = 'Drafting';
export const DOC_DRAFTING_DESCRIPTION =
  'Structured legal document drafting with template-guided validation and draft generation';

const DOC_DRAFTING_ENDPOINT_SET = new Set(
  DOC_DRAFTING_ENDPOINT_ALIASES.map((value) => normalize(value)),
);
const DOC_DRAFTING_MODEL_SET = new Set(DOC_DRAFTING_MODEL_ALIASES.map((value) => normalize(value)));

export function isDocDraftingEndpointName(value?: string | null) {
  return DOC_DRAFTING_ENDPOINT_SET.has(normalize(value));
}

export function isDocDraftingModelName(value?: string | null) {
  return DOC_DRAFTING_MODEL_SET.has(normalize(value));
}

export function resolveDocDraftingEndpointName(endpoints?: EndpointLike[]) {
  for (const endpointName of DOC_DRAFTING_ENDPOINT_ALIASES) {
    if (endpoints?.some((endpoint) => endpoint.name === endpointName)) {
      return endpointName;
    }
  }

  return null;
}
