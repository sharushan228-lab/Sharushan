import type { ExerciseModule, GradeLevel, SubjectId, SubjectMeta } from '../types.ts';
import { MATH_MODULES } from './mathLessons.ts';
import { GERMAN_MODULES } from './germanLessons.ts';
import { FRENCH_MODULES } from './frenchLessons.ts';
import { ENGLISH_MODULES } from './englishLessons.ts';
import { NMG_MODULES } from './nmgLessons.ts';

export const SUBJECTS: SubjectMeta[] = [
  {
    id: 'Mathe',
    label: 'Mathematik',
    shortLabel: 'Mathe',
    description: 'Zahlen, Rechnen, Grössen & Geometrie',
    accentBg: 'bg-sky-600',
    accentText: 'text-sky-700',
    accentBorder: 'border-sky-300',
    badgeBg: 'bg-sky-50',
  },
  {
    id: 'Deutsch',
    label: 'Deutsch',
    shortLabel: 'Deutsch',
    description: 'Lesen, Rechtschreibung & Grammatik',
    accentBg: 'bg-rose-600',
    accentText: 'text-rose-700',
    accentBorder: 'border-rose-300',
    badgeBg: 'bg-rose-50',
  },
  {
    id: 'Französisch',
    label: 'Französisch',
    shortLabel: 'Französisch',
    description: 'Wortschatz, Grammatik & Dialoge',
    accentBg: 'bg-amber-600',
    accentText: 'text-amber-700',
    accentBorder: 'border-amber-300',
    badgeBg: 'bg-amber-50',
  },
  {
    id: 'Englisch',
    label: 'Englisch',
    shortLabel: 'Englisch',
    description: 'Wortschatz, Grammatik & Alltagssprache',
    accentBg: 'bg-indigo-600',
    accentText: 'text-indigo-700',
    accentBorder: 'border-indigo-300',
    badgeBg: 'bg-indigo-50',
  },
  {
    id: 'NMG',
    label: 'NMG',
    shortLabel: 'NMG',
    description: 'Natur, Mensch, Gesellschaft & Schweiz',
    accentBg: 'bg-emerald-600',
    accentText: 'text-emerald-700',
    accentBorder: 'border-emerald-300',
    badgeBg: 'bg-emerald-50',
  },
];

export const SUBJECT_MODULES: Record<SubjectId, Record<GradeLevel, ExerciseModule[]>> = {
  Mathe: MATH_MODULES,
  Deutsch: GERMAN_MODULES,
  Französisch: FRENCH_MODULES,
  Englisch: ENGLISH_MODULES,
  NMG: NMG_MODULES,
};

export interface VocabFlashItem {
  id: string;
  de: string;
  target: string;
  lang: 'fr-FR' | 'en-GB';
  minGrade: GradeLevel;
}

export const FRENCH_VOCAB_FLASHCARDS: VocabFlashItem[] = [
  { id: 'fv1', de: 'Guten Tag', target: 'Bonjour', lang: 'fr-FR', minGrade: 1 },
  { id: 'fv2', de: 'Danke', target: 'Merci', lang: 'fr-FR', minGrade: 1 },
  { id: 'fv3', de: 'Auf Wiedersehen', target: 'Au revoir', lang: 'fr-FR', minGrade: 1 },
  { id: 'fv4', de: 'rot', target: 'rouge', lang: 'fr-FR', minGrade: 1 },
  { id: 'fv5', de: 'blau', target: 'bleu', lang: 'fr-FR', minGrade: 1 },
  { id: 'fv6', de: 'grün', target: 'vert', lang: 'fr-FR', minGrade: 1 },
  { id: 'fv7', de: 'die Katze', target: 'le chat', lang: 'fr-FR', minGrade: 2 },
  { id: 'fv8', de: 'der Hund', target: 'le chien', lang: 'fr-FR', minGrade: 2 },
  { id: 'fv9', de: 'der Fuchs', target: 'le renard', lang: 'fr-FR', minGrade: 2 },
  { id: 'fv10', de: 'der Apfel', target: 'la pomme', lang: 'fr-FR', minGrade: 2 },
  { id: 'fv11', de: 'das Buch', target: 'le livre', lang: 'fr-FR', minGrade: 3 },
  { id: 'fv12', de: 'der Bleistift', target: 'le crayon', lang: 'fr-FR', minGrade: 3 },
  { id: 'fv13', de: 'Montag', target: 'lundi', lang: 'fr-FR', minGrade: 3 },
  { id: 'fv14', de: 'Es regnet', target: 'Il pleut', lang: 'fr-FR', minGrade: 3 },
  { id: 'fv15', de: 'das Velo', target: 'le vélo', lang: 'fr-FR', minGrade: 4 },
  { id: 'fv16', de: 'schwimmen', target: 'nager', lang: 'fr-FR', minGrade: 4 },
  { id: 'fv17', de: 'der Käse', target: 'le fromage', lang: 'fr-FR', minGrade: 4 },
  { id: 'fv18', de: 'der Bahnhof', target: 'la gare', lang: 'fr-FR', minGrade: 5 },
  { id: 'fv19', de: 'warum', target: 'pourquoi', lang: 'fr-FR', minGrade: 5 },
  { id: 'fv20', de: 'schwierig', target: 'difficile', lang: 'fr-FR', minGrade: 6 },
];

export const ENGLISH_VOCAB_FLASHCARDS: VocabFlashItem[] = [
  { id: 'ev1', de: 'gelb', target: 'yellow', lang: 'en-GB', minGrade: 1 },
  { id: 'ev2', de: 'grün', target: 'green', lang: 'en-GB', minGrade: 1 },
  { id: 'ev3', de: 'der Hund', target: 'dog', lang: 'en-GB', minGrade: 1 },
  { id: 'ev4', de: 'die Katze', target: 'cat', lang: 'en-GB', minGrade: 1 },
  { id: 'ev5', de: 'der Vogel', target: 'bird', lang: 'en-GB', minGrade: 2 },
  { id: 'ev6', de: 'meine Schwester', target: 'my sister', lang: 'en-GB', minGrade: 2 },
  { id: 'ev7', de: 'die Küche', target: 'the kitchen', lang: 'en-GB', minGrade: 2 },
  { id: 'ev8', de: 'das Etui', target: 'pencil case', lang: 'en-GB', minGrade: 3 },
  { id: 'ev9', de: 'das Lineal', target: 'ruler', lang: 'en-GB', minGrade: 3 },
  { id: 'ev10', de: 'Mittwoch', target: 'Wednesday', lang: 'en-GB', minGrade: 3 },
  { id: 'ev11', de: 'das Rüebli', target: 'carrot', lang: 'en-GB', minGrade: 4 },
  { id: 'ev12', de: 'unter', target: 'under', lang: 'en-GB', minGrade: 4 },
  { id: 'ev13', de: 'das Frühstück', target: 'breakfast', lang: 'en-GB', minGrade: 4 },
  { id: 'ev14', de: 'meistens', target: 'usually', lang: 'en-GB', minGrade: 5 },
  { id: 'ev15', de: 'die Ampel', target: 'traffic lights', lang: 'en-GB', minGrade: 5 },
  { id: 'ev16', de: 'unvergesslich', target: 'unforgettable', lang: 'en-GB', minGrade: 6 },
];
