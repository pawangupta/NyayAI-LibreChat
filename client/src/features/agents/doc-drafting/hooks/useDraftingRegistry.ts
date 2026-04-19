import { useEffect, useMemo, useState } from 'react';
import { DOC_DRAFTING_API_BASE_URL } from '../config';
import type { DraftingTemplate, DraftingTemplateSubtype } from '../types';

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
    id: 'civil_proceedings',
    type: 'civil_proceedings',
    label: 'Civil Proceedings',
    description: 'Civil proceedings drafting for affidavits, CPC applications, plaints and written statements, injunctions, appeals, and decree or execution workflows.',
    enabled: true,
    status: 'active',
  },
  {
    id: 'income_tax',
    type: 'income_tax',
    label: 'Income Tax',
    description: 'Income-tax certificates, declarations, audit reports, and settlement forms from structured workbooks.',
    enabled: true,
    status: 'active',
  },
  {
    id: 'income_tax_reply',
    type: 'income_tax_reply',
    label: 'Income Tax - Reply',
    description: 'Replies to departmental income-tax notices, starting with Section 148A(b) notice responses.',
    enabled: true,
    status: 'active',
    subtypes: [
      {
        id: 's_148a_b_notice_for_reassessment',
        label: 'S 148A(b) - Notice for reassessment',
        description: 'Upload the notice optionally to pre-fill the reply template before download.',
        enabled: true,
        templateFileName: 'NyayAI_Tax_S148A_Reply_Template.xlsx',
        supportsUploadDocs: true,
        uploadDocsOptional: true,
        acceptedUploadTypes: ['.pdf', '.docx', '.doc', '.txt'],
      },
    ],
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
      subtypes: remoteTemplate.subtypes ?? existingTemplate?.subtypes,
    });
  }

  return Array.from(templateMap.values());
}

function mapRemoteSubtype(
  subtype: DraftingTemplateSubtype & {
    template_file_name?: string;
    supports_upload_docs?: boolean;
    upload_docs_optional?: boolean;
    accepted_upload_types?: string[];
  },
): DraftingTemplateSubtype {
  return {
    id: subtype.id,
    label: subtype.label,
    description: subtype.description,
    enabled: subtype.enabled,
    templateFileName: subtype.templateFileName ?? subtype.template_file_name,
    supportsUploadDocs: subtype.supportsUploadDocs ?? subtype.supports_upload_docs,
    uploadDocsOptional: subtype.uploadDocsOptional ?? subtype.upload_docs_optional,
    acceptedUploadTypes: subtype.acceptedUploadTypes ?? subtype.accepted_upload_types,
  };
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
              data.templates.map((template) => {
                const mapped: DraftingTemplate = {
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
                };

                const remoteSubtypes = (template as DraftingTemplate & {
                  subtypes?: Array<
                    DraftingTemplateSubtype & {
                      template_file_name?: string;
                      supports_upload_docs?: boolean;
                      upload_docs_optional?: boolean;
                      accepted_upload_types?: string[];
                    }
                  >;
                }).subtypes;
                if (remoteSubtypes) {
                  mapped.subtypes = remoteSubtypes.map(mapRemoteSubtype);
                }

                return mapped;
              }),
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
