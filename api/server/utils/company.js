const DEFAULT_COMPANY_NAME = process.env.DEFAULT_COMPANY_NAME || 'default';

const COMPANY_NAME_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function toCompanySlug(rawCompanyName) {
  const normalized = String(rawCompanyName ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!normalized || !COMPANY_NAME_REGEX.test(normalized)) {
    throw new Error(
      'Invalid company name for bucket naming. Use lowercase letters, numbers, and hyphens only.',
    );
  }

  return normalized;
}

function resolveCompanyIdentity(companyName) {
  const resolvedName = String(companyName ?? '').trim() || DEFAULT_COMPANY_NAME;
  const companySlug = toCompanySlug(resolvedName);
  return {
    company_name: resolvedName,
    company_slug: companySlug,
  };
}

function getCompanyBucketName(companySlug) {
  return `nyayai-cust-${companySlug}`;
}

module.exports = {
  COMPANY_NAME_REGEX,
  toCompanySlug,
  resolveCompanyIdentity,
  getCompanyBucketName,
};
