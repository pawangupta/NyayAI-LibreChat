import { useEffect, useMemo, useState } from 'react';
import { DOC_DRAFTING_API_BASE_URL } from '../config';
import type { DraftingTemplate } from '../types';

const DEFAULT_TEMPLATES: DraftingTemplate[] = [
  {
    id: 'affidavit',
    type: 'affidavit',
    label: 'Affidavit',
    description: 'Sworn statement drafting from structured workbook inputs.',
    enabled: true,
    status: 'active',
  },
  {
    id: 'will',
    type: 'will',
    label: 'Will',
    description: 'Testamentary drafting for simple and full-estate will workflows.',
    enabled: true,
    status: 'active',
  },
  {
    id: 'power_of_attorney',
    type: 'power_of_attorney',
    label: 'Power of Attorney',
    description: 'General, special, irrevocable, revocation, and proxy-authority drafting from structured workbooks.',
    enabled: true,
    status: 'active',
  },
  {
    id: 'writ_petition',
    type: 'writ_petition',
    label: 'Writ Petitions',
    description:
      'High Court writ petitions, supporting affidavits, and reply formats from structured workbooks.',
    enabled: true,
    status: 'active',
  },
  {
    id: 'contract',
    type: 'contract',
    label: 'Contract',
    description: 'Template-guided agreement drafting.',
    enabled: false,
    status: 'coming-soon',
  },
  {
    id: 'plaint',
    type: 'plaint',
    label: 'Pleadings',
    description: 'Civil plaint and pleading drafting from structured workbook templates across common suit categories.',
    enabled: true,
    status: 'active',
  },
  {
    id: 'legal_notice',
    type: 'legal_notice',
    label: 'Legal Notice',
    description: 'Formal pre-litigation and demand notice drafting.',
    enabled: false,
    status: 'coming-soon',
  },
];

function mergeTemplates(remoteTemplates: DraftingTemplate[]) {
  const templateMap = new Map(DEFAULT_TEMPLATES.map((template) => [template.type, template]));

  for (const remoteTemplate of remoteTemplates) {
    const existingTemplate = templateMap.get(remoteTemplate.type);
    templateMap.set(remoteTemplate.type, {
      ...(existingTemplate ?? remoteTemplate),
      ...remoteTemplate,
      description: remoteTemplate.description || existingTemplate?.description || '',
      status: remoteTemplate.status ?? existingTemplate?.status,
    });
  }

  return Array.from(templateMap.values());
}

export function useDraftingRegistry() {
  const [templates, setTemplates] = useState<DraftingTemplate[]>(DEFAULT_TEMPLATES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch(`${DOC_DRAFTING_API_BASE_URL}/catalog`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Catalog request failed with status ${response.status}`);
        }

        const data = (await response.json()) as {
          templates?: Array<
            DraftingTemplate & {
              input_format?: string;
              template_url?: string;
              sample_url?: string;
              sample_files?: string[];
            }
          >;
        };
        if (!active) {
          return;
        }

        if (Array.isArray(data.templates) && data.templates.length > 0) {
          setTemplates(
            mergeTemplates(
              data.templates.map((template) => ({
                id: template.id,
                type: template.type,
                label: template.label,
                description: template.description,
                enabled: template.enabled,
                status: template.status,
                inputFormat: template.inputFormat ?? template.input_format,
                templateUrl: template.templateUrl ?? template.template_url,
                sampleUrl: template.sampleUrl ?? template.sample_url,
                sampleFiles: template.sampleFiles ?? template.sample_files,
              })),
            ),
          );
        }
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load drafting catalog');
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return useMemo(() => ({ templates, isLoading, error }), [templates, isLoading, error]);
}
