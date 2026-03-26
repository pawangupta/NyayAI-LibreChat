import { FileSpreadsheet, ShieldCheck, WandSparkles } from 'lucide-react';

const cards = [
  {
    title: 'Download the right template',
    description: 'Start with affidavit spreadsheet templates and sample inputs.',
    Icon: FileSpreadsheet,
  },
  {
    title: 'Validate before drafting',
    description: 'Catch missing fields and structural issues before generation.',
    Icon: ShieldCheck,
  },
  {
    title: 'Generate and refine drafts',
    description: 'Produce a first draft, then guide revisions in a structured loop.',
    Icon: WandSparkles,
  },
];

export default function DraftingEmptyState() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map(({ title, description, Icon }) => (
        <div
          key={title}
          className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 dark:border-white/10 dark:bg-white/5"
        >
          <Icon className="h-5 w-5 text-slate-900 dark:text-[#d2b36c]" />
          <h4 className="mt-3 text-sm font-semibold text-slate-900 dark:text-[#f3efe5]">{title}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-[#b8afa3]">{description}</p>
        </div>
      ))}
    </div>
  );
}
