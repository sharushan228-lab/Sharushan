import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Calculator, CheckCircle2, Globe, Languages, RotateCcw, Star, Volume2, XCircle } from 'lucide-react';
import type { GradeLevel } from '../types.ts';
import { ENGLISH_VOCAB_FLASHCARDS, FRENCH_VOCAB_FLASHCARDS } from '../data/lessons.ts';
import type { VocabFlashItem } from '../data/lessons.ts';

type BlitzMode = 'math' | 'french' | 'english';

interface BlitzTrainerProps {
  grade: GradeLevel;
  onEarnStar: () => void;
}

interface MathPrompt {
  question: string;
  answer: number;
  hint: string;
}

interface VocabPrompt {
  word: string;
  speakText: string;
  speakLang: 'fr-FR' | 'en-GB';
  options: string[];
  correct: string;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMathPrompt(grade: GradeLevel): MathPrompt {
  if (grade === 1) {
    const isAdd = Math.random() < 0.6;
    if (isAdd) {
      const a = randInt(2, 12);
      const b = randInt(1, 20 - a);
      return { question: `${a} + ${b} = ?`, answer: a + b, hint: `Rechne Schritt für Schritt: ${a} + ${b}.` };
    }
    const a = randInt(6, 20);
    const b = randInt(1, a - 1);
    return { question: `${a} − ${b} = ?`, answer: a - b, hint: `Starte bei ${a} und ziehe ${b} ab.` };
  }

  if (grade === 2) {
    const mode = randInt(0, 2);
    if (mode === 0) {
      const a = randInt(12, 65);
      const b = randInt(5, 99 - a);
      return { question: `${a} + ${b} = ?`, answer: a + b, hint: 'Zuerst die Zehner, dann die Einer addieren.' };
    }
    if (mode === 1) {
      const a = randInt(25, 95);
      const b = randInt(4, a - 5);
      return { question: `${a} − ${b} = ?`, answer: a - b, hint: 'Zuerst die Zehner, dann die Einer abziehen.' };
    }
    const factor = [2, 5, 10][randInt(0, 2)];
    const mult = randInt(2, 10);
    return { question: `${mult} × ${factor} = ?`, answer: mult * factor, hint: `${mult} Sprünge in der ${factor}er-Reihe.` };
  }

  if (grade === 3) {
    const mode = randInt(0, 2);
    if (mode === 0) {
      const a = randInt(3, 10);
      const b = randInt(3, 10);
      return { question: `${a} × ${b} = ?`, answer: a * b, hint: `Kleines Einmaleins: ${a} mal ${b}.` };
    }
    if (mode === 1) {
      const divisor = randInt(3, 9);
      const quotient = randInt(3, 10);
      return { question: `${divisor * quotient} : ${divisor} = ?`, answer: quotient, hint: `Denke an die Umkehraufgabe ? × ${divisor}.` };
    }
    const a = randInt(120, 650);
    const b = randInt(30, 340);
    return { question: `${a} + ${b} = ?`, answer: a + b, hint: 'Addiere Hunderter, Zehner und Einer getrennt.' };
  }

  if (grade === 4) {
    const mode = randInt(0, 1);
    if (mode === 0) {
      const a = randInt(3, 9);
      const b = randInt(2, 9) * 10;
      return { question: `${a} × ${b} = ?`, answer: a * b, hint: `Rechne zuerst ${a} × ${b / 10} und hänge eine 0 an.` };
    }
    const a = randInt(3, 8);
    const b = randInt(12, 19);
    return { question: `${a} × ${b} = ?`, answer: a * b, hint: `${a} × 10 + ${a} × ${b - 10}.` };
  }

  if (grade === 5) {
    const parts = [2, 4, 5, 10];
    const denom = parts[randInt(0, parts.length - 1)];
    const mult = randInt(2, 20);
    const total = denom * mult;
    return {
      question: `1/${denom} von ${total} = ?`,
      answer: mult,
      hint: `Teile ${total} durch ${denom}.`,
    };
  }

  // Grade 6: percentages
  const percents = [10, 20, 25, 50];
  const p = percents[randInt(0, percents.length - 1)];
  const base = randInt(2, 12) * 20;
  return {
    question: `${p} % von ${base} = ?`,
    answer: (p * base) / 100,
    hint: `10 % von ${base} sind ${base / 10}.`,
  };
}

function generateVocabPrompt(items: VocabFlashItem[], grade: GradeLevel): VocabPrompt {
  const eligible = items.filter((item) => item.minGrade <= grade);
  const pool = eligible.length >= 4 ? eligible : items;
  const targetItem = pool[randInt(0, pool.length - 1)];

  const distractors = pool
    .filter((i) => i.id !== targetItem.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((i) => i.de);

  const options = [targetItem.de, ...distractors].sort(() => Math.random() - 0.5);

  return {
    word: targetItem.target,
    speakText: targetItem.target,
    speakLang: targetItem.lang,
    options,
    correct: targetItem.de,
  };
}

export function BlitzTrainer({ grade, onEarnStar }: BlitzTrainerProps) {
  const [mode, setMode] = useState<BlitzMode>('math');
  const [mathPrompt, setMathPrompt] = useState<MathPrompt>(() => generateMathPrompt(grade));
  const [mathInput, setMathInput] = useState('');
  const [vocabPrompt, setVocabPrompt] = useState<VocabPrompt>(() =>
    generateVocabPrompt(FRENCH_VOCAB_FLASHCARDS, grade),
  );
  const [vocabSelected, setVocabSelected] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);
  const [blitzStreak, setBlitzStreak] = useState(0);

  useEffect(() => {
    setMathPrompt(generateMathPrompt(grade));
    setMathInput('');
    setVocabPrompt(
      generateVocabPrompt(
        mode === 'english' ? ENGLISH_VOCAB_FLASHCARDS : FRENCH_VOCAB_FLASHCARDS,
        grade,
      ),
    );
    setVocabSelected(null);
    setFeedback(null);
  }, [grade, mode]);

  function recordResult(isCorrect: boolean, explanation: string) {
    if (isCorrect) {
      const nextSolved = solvedCount + 1;
      const nextStreak = blitzStreak + 1;
      setSolvedCount(nextSolved);
      setBlitzStreak(nextStreak);

      if (nextSolved % 5 === 0) {
        onEarnStar();
        setFeedback({ ok: true, text: `Richtig! +1 Bonus-Stern für ${nextSolved} Blitzaufgaben!` });
      } else {
        setFeedback({ ok: true, text: `Richtig! Noch ${5 - (nextSolved % 5)} bis zum nächsten Stern.` });
      }
    } else {
      setBlitzStreak(0);
      setFeedback({ ok: false, text: explanation });
    }
  }

  function handleMathSubmit(e: FormEvent) {
    e.preventDefault();
    if (!mathInput.trim()) return;
    const numeric = Number(mathInput.replace(',', '.').trim());
    const isCorrect = numeric === mathPrompt.answer;
    recordResult(isCorrect, `Richtige Lösung: ${mathPrompt.answer}. (${mathPrompt.hint})`);
    if (isCorrect) {
      setTimeout(() => {
        setMathPrompt(generateMathPrompt(grade));
        setMathInput('');
        setFeedback(null);
      }, 900);
    }
  }

  function handleNextMath() {
    setMathPrompt(generateMathPrompt(grade));
    setMathInput('');
    setFeedback(null);
  }

  function handleSelectVocabOption(option: string) {
    if (vocabSelected !== null) return;
    setVocabSelected(option);
    const isCorrect = option === vocabPrompt.correct;
    recordResult(isCorrect, `«${vocabPrompt.word}» bedeutet «${vocabPrompt.correct}».`);
  }

  function handleNextVocab() {
    const items = mode === 'english' ? ENGLISH_VOCAB_FLASHCARDS : FRENCH_VOCAB_FLASHCARDS;
    setVocabPrompt(generateVocabPrompt(items, grade));
    setVocabSelected(null);
    setFeedback(null);
  }

  function handleSpeakVocab() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(vocabPrompt.speakText);
    utterance.lang = vocabPrompt.speakLang;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setMode('math')}
          className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
            mode === 'math'
              ? 'bg-sky-600 text-white border-transparent shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Calculator className="w-5 h-5 shrink-0" aria-hidden="true" />
          <div>
            <div className="font-display font-bold text-base">Blitzrechnen</div>
            <div className={`text-xs ${mode === 'math' ? 'text-sky-100' : 'text-slate-500'}`}>
              Kopfrechnen · {grade}. Klasse
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMode('french')}
          className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
            mode === 'french'
              ? 'bg-amber-600 text-white border-transparent shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Globe className="w-5 h-5 shrink-0" aria-hidden="true" />
          <div>
            <div className="font-display font-bold text-base">Französisch-Wörter</div>
            <div className={`text-xs ${mode === 'french' ? 'text-amber-100' : 'text-slate-500'}`}>
              Wortschatz · bis {grade}. Klasse
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMode('english')}
          className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
            mode === 'english'
              ? 'bg-indigo-600 text-white border-transparent shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Languages className="w-5 h-5 shrink-0" aria-hidden="true" />
          <div>
            <div className="font-display font-bold text-base">Englisch-Wörter</div>
            <div className={`text-xs ${mode === 'english' ? 'text-indigo-100' : 'text-slate-500'}`}>
              Wortschatz · bis {grade}. Klasse
            </div>
          </div>
        </button>
      </div>

      {/* Main Blitz Card */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-100">
          <div className="text-sm font-medium text-slate-600">
            Alle 5 richtigen Antworten erhältst du <strong className="text-slate-900">+1 Stern</strong>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-mono-num font-semibold text-slate-700">
              Gelöst: {solvedCount}
            </span>
            <span className="font-mono-num font-semibold text-amber-700 inline-flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" aria-hidden="true" />
              Serie: {blitzStreak}
            </span>
          </div>
        </div>

        {mode === 'math' ? (
          <div className="max-w-lg mx-auto text-center py-4">
            <div className="font-mono-num text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
              {mathPrompt.question}
            </div>

            <form onSubmit={handleMathSubmit} className="flex items-center gap-3 justify-center">
              <input
                type="number"
                inputMode="numeric"
                value={mathInput}
                onChange={(e) => setMathInput(e.target.value)}
                placeholder="Lösung"
                autoFocus
                className="w-40 h-14 px-4 rounded-xl bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-sky-600 font-mono-num text-2xl font-bold text-center text-slate-900 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!mathInput.trim()}
                className="h-14 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-45 text-white font-bold text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              >
                Prüfen
              </button>
            </form>

            {feedback && (
              <div
                role="status"
                className={`mt-6 p-4 rounded-xl border text-sm font-semibold flex items-center justify-between gap-3 text-left ${
                  feedback.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {feedback.ok ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" aria-hidden="true" />
                  )}
                  <span>{feedback.text}</span>
                </div>
                {!feedback.ok && (
                  <button
                    type="button"
                    onClick={handleNextMath}
                    className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-xs font-bold text-rose-900 hover:bg-rose-100 shrink-0"
                  >
                    Neue Aufgabe
                  </button>
                )}
              </div>
            )}

            {!feedback && (
              <button
                type="button"
                onClick={handleNextMath}
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Andere Aufgabe</span>
              </button>
            )}
          </div>
        ) : (
          <div className="max-w-xl mx-auto py-2">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1">
                  Was bedeutet dieses Wort auf Deutsch?
                </div>
                <div className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900">
                  {vocabPrompt.word}
                </div>
              </div>
              <button
                type="button"
                onClick={handleSpeakVocab}
                aria-label="Wort aussprechen"
                title="Wort anhören"
                className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center shrink-0 transition-colors"
              >
                <Volume2 className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vocabPrompt.options.map((opt) => {
                const isChosen = vocabSelected === opt;
                const isCorrectOpt = opt === vocabPrompt.correct;
                const showCorrect = vocabSelected !== null && isCorrectOpt;
                const showWrong = vocabSelected !== null && isChosen && !isCorrectOpt;

                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={vocabSelected !== null}
                    onClick={() => handleSelectVocabOption(opt)}
                    className={`p-4 rounded-xl border text-left font-semibold text-base min-h-[56px] transition-colors ${
                      showCorrect
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                        : showWrong
                          ? 'bg-rose-50 border-rose-400 text-rose-950'
                          : 'bg-slate-50 hover:bg-sky-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {feedback && (
              <div
                role="status"
                className={`mt-5 p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  feedback.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <span className="text-sm font-semibold">{feedback.text}</span>
                <button
                  type="button"
                  onClick={handleNextVocab}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0"
                >
                  Nächstes Wort
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
