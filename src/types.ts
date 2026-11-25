export type SubjectId = 'Mathe' | 'Deutsch' | 'Französisch' | 'Englisch' | 'NMG';

export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type AppTab = 'learn' | 'blitz' | 'progress';

export interface VisualFractionHint {
  kind: 'fraction';
  numerator: number;
  denominator: number;
  label: string;
}

export interface VisualNumberLineHint {
  kind: 'numberLine';
  start: number;
  end: number;
  highlight: number;
  label: string;
}

export type VisualHint = VisualFractionHint | VisualNumberLineHint;

export interface Exercise {
  id: string;
  topic: string;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
  visualHint?: VisualHint;
  speakText?: string;
  speakLang?: 'de-CH' | 'fr-FR' | 'en-GB';
}

export interface ExerciseModule {
  id: string;
  title: string;
  subtitle: string;
  exercises: Exercise[];
}

export interface SubjectMeta {
  id: SubjectId;
  label: string;
  shortLabel: string;
  description: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  badgeBg: string;
}

export interface ProgressRecord {
  stars: number;
  completedIds: string[];
  streak: number;
}
