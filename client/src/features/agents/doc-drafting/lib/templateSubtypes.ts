export type DraftingSubtypeOption = {
  key: string;
  label: string;
  description: string;
  fileName: string;
};

const SUBTYPE_METADATA: Record<string, { label: string; description: string }> = {
  injunction_support: {
    label: 'Injunction Support',
    description: 'Affidavit in support of an application for temporary injunction.',
  },
  examination_in_chief: {
    label: 'Examination-in-Chief',
    description: 'Evidence affidavit for examination-in-chief / PW-1 stage.',
  },
  plaint_verification: {
    label: 'Plaint Verification',
    description: 'Verification affidavit for confirming the plaint pleadings.',
  },
  reply_affidavit: {
    label: 'Reply Affidavit',
    description: 'Reply affidavit opposing an injunction or interim application.',
  },
};

export function inferSubtypeKey(fileName?: string | null) {
  const value = (fileName ?? '').toLowerCase();

  if (value.includes('injunction') && !value.includes('reply')) {
    return 'injunction_support';
  }

  if (value.includes('examination') || value.includes('chief') || value.includes('pw_1') || value.includes('pw-1')) {
    return 'examination_in_chief';
  }

  if (value.includes('plaint')) {
    return 'plaint_verification';
  }

  if (value.includes('reply')) {
    return 'reply_affidavit';
  }

  return fileName
    ?.replace(/\.xlsx$/i, '')
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

export function formatSubtypeLabel(subtype?: string | null, fallbackFileName?: string | null) {
  if (!subtype && !fallbackFileName) {
    return 'Subtype';
  }

  const key = subtype ?? inferSubtypeKey(fallbackFileName);
  if (key && SUBTYPE_METADATA[key]) {
    return SUBTYPE_METADATA[key].label;
  }

  return (fallbackFileName ?? subtype ?? 'Subtype')
    .replace(/\.xlsx$/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getSubtypeDescription(subtype?: string | null, fallbackFileName?: string | null) {
  const key = subtype ?? inferSubtypeKey(fallbackFileName);
  return key ? SUBTYPE_METADATA[key]?.description ?? 'Template-ready workbook for structured drafting.' : 'Template-ready workbook for structured drafting.';
}

export function buildSubtypeOptions(sampleFiles: string[] = []): DraftingSubtypeOption[] {
  const seen = new Set<string>();

  return sampleFiles.reduce<DraftingSubtypeOption[]>((options, fileName) => {
    const key = inferSubtypeKey(fileName) ?? fileName;
    if (seen.has(key)) {
      return options;
    }

    seen.add(key);
    options.push({
      key,
      label: formatSubtypeLabel(key, fileName),
      description: getSubtypeDescription(key, fileName),
      fileName,
    });
    return options;
  }, []);
}
