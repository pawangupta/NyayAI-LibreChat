import { useMemo } from 'react';

export function useDraftingTheme() {
  return useMemo(
    () => ({
      panel:
        'rounded-[20px] border border-slate-200/80 bg-[#faf8f3] shadow-[0_22px_60px_rgba(29,35,42,0.08)] dark:border-white/10 dark:bg-[#171512] dark:shadow-[0_28px_72px_rgba(0,0,0,0.35)]',
      mutedText: 'text-slate-600 dark:text-[#b8afa3]',
      headingText: 'text-slate-900 dark:text-[#f3efe5]',
      accentText: 'text-[#7c5c1b] dark:text-[#d2b36c]',
      badge:
        'inline-flex items-center rounded-full border border-slate-200/80 bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-[#cdbfa7]',
    }),
    [],
  );
}
