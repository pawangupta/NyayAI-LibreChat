import { useEffect, useMemo, useState } from 'react';
import { DOC_DRAFTING_API_BASE_URL } from '../config';
import type { DraftingTemplate } from '../types';

const DEFAULT_TEMPLATES: DraftingTemplate[] = [
  {
    id: 'affidavit',
    type: 'affidavit',
    label: 'Affidavit',
    description: 'Structured affidavit drafting from spreadsheet-backed inputs.',
    enabled: true,
  },
  {
    id: 'will',
    type: 'will',
    label: 'Will',
    description: 'Future migration path from the existing wills drafting flow.',
    enabled: false,
  },
  {
    id: 'contract',
    type: 'contract',
    label: 'Contract',
    description: 'Template-guided agreement drafting.',
    enabled: false,
  },
];

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
