import { getTranslations } from 'next-intl/server';

export default async function FaqAccordion() {
  const t = await getTranslations('landing.faq');

  const items = t.raw('items') as { q: string; a: string }[];

  return (
    <div className="divide-y divide-stone-200 rounded-xl border border-stone-200">
      {items.map(({ q, a }, i) => (
        <details key={i} className="group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-stone-800 hover:text-stone-900">
            {q}
            <span className="shrink-0 text-stone-400 transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-stone-500">{a}</p>
        </details>
      ))}
    </div>
  );
}
