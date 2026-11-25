import type { AppTab, GradeLevel } from '../types.ts';
import { LogOut, Star } from 'lucide-react';

interface HeaderBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  grade: GradeLevel;
  onChangeGrade: (grade: GradeLevel) => void;
  stars: number;
  userName: string;
  onSignOut: () => void;
}

const GRADES: GradeLevel[] = [1, 2, 3, 4, 5, 6];

export function HeaderBar({
  activeTab,
  onSelectTab,
  grade,
  onChangeGrade,
  stars,
  userName,
  onSignOut,
}: HeaderBarProps) {
  const navItems: Array<{ id: AppTab; label: string }> = [
    { id: 'learn', label: 'Übungsportal' },
    { id: 'blitz', label: 'Blitztraining' },
    { id: 'progress', label: 'Lernstand' },
  ];

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Wordmark & creator credit */}
        <div className="flex flex-col justify-center shrink-0">
          <button
            type="button"
            onClick={() => onSelectTab('learn')}
            className="text-xl font-extrabold tracking-tight text-slate-900 leading-none text-left whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-md px-1 -ml-1"
          >
            LernFuchs
          </button>
          <span className="text-[11px] font-medium text-slate-500 leading-tight mt-0.5 whitespace-nowrap">
            erstellt von Sharushan
          </span>
        </div>

        {/* Zone 2: Clean single-line navigation links */}
        <nav aria-label="Hauptnavigation" className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-2 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-md px-1 ${
                  isActive
                    ? 'text-sky-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-1 -bottom-[17px] h-0.5 bg-sky-600 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Grade, Stars & Account Sign-out */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <label htmlFor="grade-select" className="sr-only">
            Klassenstufe wählen
          </label>
          <select
            id="grade-select"
            value={grade}
            onChange={(e) => onChangeGrade(Number(e.target.value) as GradeLevel)}
            className="h-10 bg-slate-100 hover:bg-slate-200/80 text-slate-900 text-sm font-semibold px-2.5 sm:px-3 rounded-xl border border-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-sky-600 transition-colors cursor-pointer"
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}. Klasse
              </option>
            ))}
          </select>

          <div
            aria-label={`${stars} gesammelte Sterne`}
            className="h-10 px-2.5 sm:px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Star className="w-4 h-4 fill-amber-400 text-amber-500 shrink-0" aria-hidden="true" />
            <span className="font-mono-num text-sm font-semibold">{stars}</span>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            title={`Angemeldet als ${userName} – Abmelden`}
            aria-label={`Angemeldet als ${userName} – Abmelden`}
            className="h-10 px-2.5 sm:px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Abmelden</span>
          </button>
        </div>
      </div>
    </header>
  );
}
