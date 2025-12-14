const WILL_FIELDS = [
  {
    key: 'testator_full_name',
    label: 'Testator full name',
    type: 'string',
    required: true,
    description: 'Complete legal name of the person creating the will.',
  },
  {
    key: 'testator_address',
    label: 'Testator address',
    type: 'string',
    required: true,
    description: 'Primary residential address for the testator.',
  },
  {
    key: 'executor_full_name',
    label: 'Executor full name',
    type: 'string',
    required: true,
    description: 'Person responsible for carrying out the will.',
  },
  {
    key: 'executor_address',
    label: 'Executor address',
    type: 'string',
    required: true,
    description: 'Mailing address for the executor.',
  },
  {
    key: 'beneficiaries',
    label: 'Beneficiaries',
    type: 'array',
    required: true,
    description:
      'List of beneficiaries. Provide as comma separated full names or a JSON array of { name, share } entries.',
  },
  {
    key: 'specific_bequests',
    label: 'Specific bequests',
    type: 'string',
    required: false,
    description: 'Optional gifts or specific asset transfers. Leave blank if not applicable.',
  },
  {
    key: 'residuary_clause',
    label: 'Residuary clause',
    type: 'string',
    required: true,
    description:
      'Describe how you want to distribute any remaining estate after specific bequests (e.g., equally among beneficiaries).',
  },
  {
    key: 'guardian_name',
    label: 'Guardian name',
    type: 'string',
    required: false,
    description: 'Guardian for minor children, if applicable.',
  },
  {
    key: 'witness_one_name',
    label: 'Witness #1 name',
    type: 'string',
    required: true,
    description: 'First witness full name.',
  },
  {
    key: 'witness_two_name',
    label: 'Witness #2 name',
    type: 'string',
    required: true,
    description: 'Second witness full name.',
  },
  {
    key: 'execution_date',
    label: 'Execution date',
    type: 'date',
    required: true,
    description: 'Date the will should display for signing.',
  },
];

function getDefaultSchema(documentType = 'will') {
  if (documentType?.toLowerCase()?.includes('agreement')) {
    return [
      {
        key: 'party_one_name',
        label: 'Party One name',
        type: 'string',
        required: true,
        description: 'Primary party full legal name.',
      },
      {
        key: 'party_two_name',
        label: 'Party Two name',
        type: 'string',
        required: true,
        description: 'Counterparty full legal name.',
      },
      {
        key: 'effective_date',
        label: 'Effective date',
        type: 'date',
        required: true,
        description: 'When the agreement becomes active.',
      },
      {
        key: 'governing_law',
        label: 'Governing law',
        type: 'string',
        required: true,
        description: 'State or country law that governs the agreement.',
      },
    ];
  }

  return WILL_FIELDS;
}

module.exports = {
  WILL_FIELDS,
  getDefaultSchema,
};
