import type { VisualHint } from '../types.ts';

interface VisualAidProps {
  hint: VisualHint;
}

export function VisualAid({ hint }: VisualAidProps) {
  if (hint.kind === 'fraction') {
    const segments = Array.from({ length: hint.denominator }, (_, idx) => idx < hint.numerator);

    return (
      <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-2.5">
          <span>Anschauungshilfe</span>
          <span className="font-mono-num">{hint.label}</span>
        </div>
        <div
          className="grid gap-1.5 h-8"
          style={{ gridTemplateColumns: `repeat(${hint.denominator}, minmax(0, 1fr))` }}
          role="img"
          aria-label={`Bruchbalken mit ${hint.numerator} von ${hint.denominator} gefüllten Teilen`}
        >
          {segments.map((filled, idx) => (
            <div
              key={idx}
              className={`rounded-md border transition-colors ${
                filled
                  ? 'bg-sky-600 border-sky-700'
                  : 'bg-white border-slate-300'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  const ticks = Array.from({ length: hint.end - hint.start + 1 }, (_, idx) => hint.start + idx);

  return (
    <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200 overflow-x-auto">
      <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-3">
        <span>Anschauungshilfe</span>
        <span>{hint.label}</span>
      </div>
      <div className="min-w-[320px] flex items-center justify-between relative pt-2 pb-1">
        <div className="absolute left-2 right-2 top-[15px] h-0.5 bg-slate-300" aria-hidden="true" />
        {ticks.map((num) => {
          const isHighlighted = num === hint.highlight;
          return (
            <div key={num} className="relative flex flex-col items-center z-10">
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 ${
                  isHighlighted
                    ? 'bg-sky-600 border-sky-700 scale-110'
                    : 'bg-white border-slate-400'
                }`}
              />
              <span
                className={`mt-1.5 font-mono-num text-xs ${
                  isHighlighted ? 'font-bold text-sky-700' : 'text-slate-600'
                }`}
              >
                {num}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
