import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Calculator,
  CheckCircle2,
  Compass,
  Globe,
  Languages,
  RotateCcw,
  Volume2,
  XCircle,
} from 'lucide-react';
import type { GradeLevel, SubjectId } from '../types.ts';
import { SUBJECTS, SUBJECT_MODULES } from '../data/lessons.ts';
import { VisualAid } from './VisualAid.tsx';

interface ExerciseStageProps {
  grade: GradeLevel;
  subject: SubjectId;
  onSelectSubject: (subject: SubjectId) => void;
  completedIds: string[];
  onExerciseSolved: (exerciseId: string, firstTryCorrect: boolean) => void;
}

const SUBJECT_ICONS: Record<SubjectId, typeof Calculator> = {
  Mathe: Calculator,
  Deutsch: BookOpen,
  Französisch: Globe,
  Englisch: Languages,
  NMG: Compass,
};

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export function ExerciseStage({
  grade,
  subject,
  onSelectSubject,
  completedIds,
  onExerciseSolved,
}: ExerciseStageProps) {
  const modules = SUBJECT_MODULES[subject][grade];
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hadWrongAttempt, setHadWrongAttempt] = useState(false);
  const [roundScore, setRoundScore] = useState(0);
  const [roundFinished, setRoundFinished] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const activeModule = modules[activeModuleIndex] ?? modules[0];
  const exercises = activeModule.exercises;
  const currentExercise = exercises[currentIndex] ?? exercises[0];
  const subjectMeta = SUBJECTS.find((s) => s.id === subject) ?? SUBJECTS[0];

  useEffect(() => {
    setActiveModuleIndex(0);
    setCurrentIndex(0);
    setSelectedOption(null);
    setHadWrongAttempt(false);
    setRoundScore(0);
    setRoundFinished(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [grade, subject]);

  function handleSelectModule(modIdx: number) {
    setActiveModuleIndex(modIdx);
    setCurrentIndex(0);
    setSelectedOption(null);
    setHadWrongAttempt(false);
    setRoundScore(0);
    setRoundFinished(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }

  const isCorrectSelected = selectedOption !== null && selectedOption === currentExercise.correct;
  const isWrongSelected = selectedOption !== null && selectedOption !== currentExercise.correct;

  function handleOptionSelect(option: string) {
    if (isCorrectSelected) return;

    setSelectedOption(option);

    if (option === currentExercise.correct) {
      const firstTry = !hadWrongAttempt;
      if (firstTry) {
        setRoundScore((prev) => prev + 1);
      }
      onExerciseSolved(currentExercise.id, firstTry);
    } else {
      setHadWrongAttempt(true);
    }
  }

  function handleNextExercise() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setHadWrongAttempt(false);
    } else {
      setRoundFinished(true);
    }
  }

  function handleRestartModule() {
    setCurrentIndex(0);
    setSelectedOption(null);
    setHadWrongAttempt(false);
    setRoundScore(0);
    setRoundFinished(false);
  }

  function handleSpeakQuestion() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }
    const textToRead = currentExercise.speakText || currentExercise.question;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = currentExercise.speakLang || 'de-CH';
    utterance.rate = 0.92;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  const progressPercent = roundFinished
    ? 100
    : Math.round(((currentIndex + (isCorrectSelected ? 1 : 0)) / exercises.length) * 100);

  return (
    <div className="space-y-6">
      {/* 5-Subject Schabi Selector Bar */}
      <section aria-label="Fach auswählen">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {SUBJECTS.map((item) => {
            const Icon = SUBJECT_ICONS[item.id];
            const isActive = item.id === subject;
            const totalInSubj = SUBJECT_MODULES[item.id][grade].reduce(
              (acc, m) => acc + m.exercises.length,
              0,
            );
            const doneInSubj = SUBJECT_MODULES[item.id][grade].reduce(
              (acc, m) => acc + m.exercises.filter((ex) => completedIds.includes(ex.id)).length,
              0,
            );

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSubject(item.id)}
                className={`group flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 min-h-[60px] ${
                  isActive
                    ? `${item.accentBg} text-white border-transparent shadow-sm`
                    : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : `${item.badgeBg} ${item.accentText}`
                  }`}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="font-display font-bold text-sm sm:text-base leading-tight truncate">
                    {item.label}
                  </div>
                  <div
                    className={`font-mono-num text-xs truncate mt-0.5 ${
                      isActive ? 'text-white/90' : 'text-slate-500'
                    }`}
                  >
                    {doneInSubj}/{totalInSubj} gelöst
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Schabi-Style Topic Module Tiles */}
      <section aria-label="Themenmodule">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {modules.map((mod, idx) => {
            const isSelected = idx === activeModuleIndex;
            const solvedCount = mod.exercises.filter((ex) => completedIds.includes(ex.id)).length;
            const allSolved = solvedCount === mod.exercises.length;

            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => handleSelectModule(idx)}
                className={`p-4 rounded-xl border text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                  isSelected
                    ? `bg-white ${subjectMeta.accentBorder} ring-2 ring-sky-600/20 shadow-xs`
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-display font-bold text-base text-slate-900 leading-snug">
                    {idx + 1}. {mod.title}
                  </span>
                  {allSolved && (
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                      aria-label="Modul abgeschlossen"
                    />
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-3 line-clamp-1">{mod.subtitle}</p>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        allSolved ? 'bg-emerald-500' : subjectMeta.accentBg
                      }`}
                      style={{
                        width: `${Math.round((solvedCount / mod.exercises.length) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="font-mono-num text-xs font-semibold text-slate-600 shrink-0">
                    {solvedCount}/{mod.exercises.length}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Focused Exercise Card */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Clean unboxed metadata + progress bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 font-medium">
            <span>{grade}. Klasse</span>
            <span aria-hidden="true">·</span>
            <span className={subjectMeta.accentText}>{subjectMeta.label}</span>
            <span aria-hidden="true">·</span>
            <span>{activeModule.title}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono-num text-xs font-semibold text-slate-500">
              {roundFinished
                ? `${exercises.length}/${exercises.length} erledigt`
                : `Aufgabe ${currentIndex + 1} von ${exercises.length}`}
            </span>
            <div className="w-28 sm:w-36 h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
              <div
                className="h-full bg-sky-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {!roundFinished ? (
          <>
            <div className="flex items-start justify-between gap-4 mb-6">
              <h2
                className="font-display text-2xl sm:text-[28px] font-bold text-slate-900 leading-snug"
                style={{ textWrap: 'balance' }}
              >
                {currentExercise.question}
              </h2>
              <button
                type="button"
                onClick={handleSpeakQuestion}
                title={
                  currentExercise.speakLang === 'fr-FR'
                    ? 'Auf Französisch anhören'
                    : currentExercise.speakLang === 'en-GB'
                      ? 'Auf Englisch anhören'
                      : 'Aufgabe vorlesen'
                }
                aria-label="Vorlesen"
                className={`shrink-0 h-11 w-11 rounded-xl border flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                  isSpeaking
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Volume2 className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {currentExercise.visualHint && <VisualAid hint={currentExercise.visualHint} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="group" aria-label="Antwortmöglichkeiten">
              {currentExercise.options.map((option, idx) => {
                const isChosen = selectedOption === option;
                const isCorrectOpt = option === currentExercise.correct;
                const showAsCorrect = isCorrectSelected && isCorrectOpt;
                const showAsWrong = isWrongSelected && isChosen;

                let btnClasses =
                  'bg-slate-50 hover:bg-sky-50/70 border-slate-200 hover:border-sky-300 text-slate-900';
                if (showAsCorrect) {
                  btnClasses = 'bg-emerald-50 border-emerald-500 text-emerald-950';
                } else if (showAsWrong) {
                  btnClasses = 'bg-rose-50 border-rose-400 text-rose-950';
                }

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleOptionSelect(option)}
                    disabled={isCorrectSelected}
                    className={`flex items-center gap-3.5 p-4 rounded-xl border text-left font-semibold text-base min-h-[60px] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 disabled:cursor-default ${btnClasses}`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg font-mono-num text-sm font-bold flex items-center justify-center shrink-0 border ${
                        showAsCorrect
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : showAsWrong
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {OPTION_LETTERS[idx] ?? idx + 1}
                    </span>
                    <span className="flex-1 leading-snug">{option}</span>
                    {showAsCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
                    )}
                    {showAsWrong && (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>

            {isWrongSelected && (
              <div
                role="status"
                className="mt-5 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-900"
              >
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-bold text-sm">Fast richtig – probiere es noch einmal!</p>
                  <p className="text-sm text-rose-800 mt-0.5">
                    Lies die Frage in Ruhe durch und wähle eine andere Antwort.
                  </p>
                </div>
              </div>
            )}

            {isCorrectSelected && (
              <div
                role="status"
                className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-2.5 text-emerald-950">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-sm">
                      Richtig gelöst! {!hadWrongAttempt ? '+1 Stern gesammelt' : 'Klasse drangeblieben!'}
                    </p>
                    <p className="text-sm text-emerald-900 mt-0.5 leading-relaxed">
                      {currentExercise.explanation}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleNextExercise}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                >
                  <span>{currentIndex + 1 < exercises.length ? 'Nächste Aufgabe' : 'Modul abschliessen'}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </>
        ) : (
          /* Module Finished Summary */
          <div className="py-4">
            <div className="flex items-center gap-3 text-emerald-700 mb-3">
              <Award className="w-7 h-7" aria-hidden="true" />
              <span className="font-display text-2xl font-bold text-slate-900">
                Modul abgeschlossen!
              </span>
            </div>
            <p className="text-slate-600 text-base leading-relaxed max-w-xl">
              Du hast alle {exercises.length} Aufgaben in «{activeModule.title}» ({grade}. Klasse · {subjectMeta.label}) gemeistert
              und dabei <strong className="font-mono-num text-slate-900">{roundScore}</strong>{' '}
              {roundScore === 1 ? 'Aufgabe' : 'Aufgaben'} direkt im ersten Versuch richtig beantwortet.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {activeModuleIndex + 1 < modules.length && (
                <button
                  type="button"
                  onClick={() => handleSelectModule(activeModuleIndex + 1)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                >
                  <span>Nächstes Thema: {modules[activeModuleIndex + 1].title}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              )}

              <button
                type="button"
                onClick={handleRestartModule}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Modul wiederholen</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
