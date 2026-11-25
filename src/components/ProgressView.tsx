import { ArrowRight, CheckCircle2, RotateCcw, Star } from 'lucide-react';
import type { GradeLevel, SubjectId } from '../types.ts';
import { SUBJECTS, SUBJECT_MODULES } from '../data/lessons.ts';

interface ProgressViewProps {
  grade: GradeLevel;
  stars: number;
  streak: number;
  completedIds: string[];
  onStartSubject: (subject: SubjectId) => void;
  onResetProgress: () => void;
}

export function ProgressView({
  grade,
  stars,
  streak,
  completedIds,
  onStartSubject,
  onResetProgress,
}: ProgressViewProps) {
  const totalExercisesInGrade = SUBJECTS.reduce(
    (sum, s) =>
      sum + SUBJECT_MODULES[s.id][grade].reduce((mSum, m) => mSum + m.exercises.length, 0),
    0,
  );
  const solvedInGrade = SUBJECTS.reduce(
    (sum, s) =>
      sum +
      SUBJECT_MODULES[s.id][grade].reduce(
        (mSum, m) => mSum + m.exercises.filter((ex) => completedIds.includes(ex.id)).length,
        0,
      ),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Top KPI Summary */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-semibold text-slate-500 mb-1">
              Lernstand · {grade}. Klasse
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Dein Fortschritt in allen 5 Fächern
            </h2>
          </div>

          <button
            type="button"
            onClick={onResetProgress}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors self-start sm:self-center whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Fortschritt zurücksetzen</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-medium text-slate-500 mb-1">Gesammelte Sterne</div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" aria-hidden="true" />
              <span className="font-mono-num text-2xl font-bold text-slate-900">{stars}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-medium text-slate-500 mb-1">
              Aufgaben in der {grade}. Klasse
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" aria-hidden="true" />
              <span className="font-mono-num text-2xl font-bold text-slate-900">
                {solvedInGrade} / {totalExercisesInGrade}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-medium text-slate-500 mb-1">Aktuelle Erfolgsserie</div>
            <div className="font-mono-num text-2xl font-bold text-slate-900">
              {streak} {streak === 1 ? 'Aufgabe' : 'Aufgaben'}
            </div>
          </div>
        </div>
      </section>

      {/* Per-Subject Breakdown */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SUBJECTS.map((subj) => {
          const mods = SUBJECT_MODULES[subj.id][grade];
          const total = mods.reduce((acc, m) => acc + m.exercises.length, 0);
          const doneCount = mods.reduce(
            (acc, m) => acc + m.exercises.filter((ex) => completedIds.includes(ex.id)).length,
            0,
          );
          const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

          return (
            <div
              key={subj.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h3 className="font-display font-bold text-lg text-slate-900">
                    {subj.label}
                  </h3>
                  <span className="font-mono-num text-sm font-semibold text-slate-700">
                    {doneCount} / {total} ({pct}%)
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">{subj.description}</p>

                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 mb-3">
                  <div
                    className={`h-full transition-all duration-300 ${subj.accentBg}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  {mods.map((m) => {
                    const mDone = m.exercises.filter((ex) => completedIds.includes(ex.id)).length;
                    return (
                      <div key={m.id} className="flex items-center justify-between gap-2">
                        <span className="truncate">{m.title}</span>
                        <span className="font-mono-num text-slate-500 shrink-0">
                          {mDone}/{m.exercises.length}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onStartSubject(subj.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                >
                  <span>Jetzt üben</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
