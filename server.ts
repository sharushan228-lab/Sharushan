import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('MISSING_API_KEY');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function mapGeminiError(err: unknown): { status: number; message: string } {
  if (err instanceof Error && err.message === 'MISSING_API_KEY') {
    return {
      status: 503,
      message:
        'Der Gemini API-Schlüssel ist noch nicht konfiguriert. Bitte hinterlege GEMINI_API_KEY in den Secrets-Einstellungen.',
    };
  }

  const rawMsg = err instanceof Error ? err.message : String(err);
  if (rawMsg.includes('PERMISSION_DENIED') || rawMsg.includes('403') || rawMsg.includes('API_KEY_INVALID')) {
    return {
      status: 403,
      message:
        'Der hinterlegte API-Schlüssel wurde abgelehnt. Bitte überprüfe GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('429')) {
    return {
      status: 429,
      message:
        'Fuchsi hat gerade sehr viele Anfragen erhalten. Bitte warte einen kurzen Moment und versuche es gleich noch einmal.',
    };
  }
  if (rawMsg.includes('NOT_FOUND') || rawMsg.includes('404')) {
    return {
      status: 502,
      message: 'Das angeforderte KI-Modell konnte nicht erreicht werden. Bitte versuche es später erneut.',
    };
  }

  return {
    status: 500,
    message: 'Fuchsi konnte gerade keine Antwort erstellen. Bitte versuche es in einem Augenblick noch einmal.',
  };
}

interface TutorHistoryItem {
  role: 'user' | 'model';
  text: string;
}

interface TutorRequestBody {
  message?: string;
  grade?: number;
  subject?: string;
  history?: TutorHistoryItem[];
  image?: {
    data: string;
    mimeType: string;
  } | null;
}

interface GenerateExerciseBody {
  grade?: number;
  subject?: string;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/tutor', async (req: Request, res: Response) => {
    try {
      const body = req.body as TutorRequestBody;
      const userMessage = typeof body.message === 'string' ? body.message.trim() : '';
      const grade = typeof body.grade === 'number' && body.grade >= 1 && body.grade <= 6 ? body.grade : 3;
      const subject = typeof body.subject === 'string' && body.subject.trim() ? body.subject.trim() : 'Allgemein';
      const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
      const image = body.image && typeof body.image.data === 'string' && typeof body.image.mimeType === 'string'
        ? body.image
        : null;

      if (!userMessage && !image) {
        res.status(400).json({ error: 'Bitte gib eine Frage ein oder lade ein Foto deiner Aufgabe hoch.' });
        return;
      }

      const ai = getAiClient();

      const systemInstruction = [
        'Du bist Fuchsi, ein freundlicher, geduldiger und ermutigender Lernbegleiter für Primarschulkinder in der Schweiz (1. bis 6. Klasse, Lehrplan 21).',
        `Das Kind ist aktuell in der ${grade}. Klasse und beschäftigt sich mit dem Fach "${subject}".`,
        'Wichtige Regeln für deine Antworten:',
        '- Schreibe konsequent Schweizer Hochdeutsch: benutze IMMER "ss" statt "ß" (z. B. Strasse, gross, heisst, Fussball, weisst).',
        '- Verwende Schweizer Begriffe und Einheiten, wenn passend (Franken / Fr., Rappen / Rp., Velo, Znüni, Glace).',
        '- Sprich das Kind herzlich mit "du" an und passe deinen Wortschatz exakt an die Altersstufe der ' + grade + '. Klasse an.',
        '- Wenn das Kind eine Hausaufgabe stellt oder ein Foto schickt: Erkläre den Lösungsweg klar und Schritt für Schritt in kurzen, übersichtlichen Absätzen oder nummerierten Schritten. Gib bei Rechen- oder Übungsaufgaben zuerst einen hilfreichen Denkanstoss und zeige das Vorgehen verständlich, statt nur lieblos das Endergebnis hinzuklatschen.',
        '- Bei Englisch-Fragen antworte auf Deutsch und erkläre englische Wörter oder Sätze einfach und kindgerecht.',
        '- Halte Antworten prägnant, warmherzig und übersichtlich (keine langen Textwände).',
      ].join('\n');

      const contents: Array<{
        role: 'user' | 'model';
        parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }>;
      }> = [];

      for (const item of history) {
        if (item && (item.role === 'user' || item.role === 'model') && typeof item.text === 'string' && item.text.trim()) {
          contents.push({
            role: item.role,
            parts: [{ text: item.text.trim() }],
          });
        }
      }

      const currentParts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];
      if (image) {
        currentParts.push({
          inlineData: {
            data: image.data,
            mimeType: image.mimeType,
          },
        });
      }
      currentParts.push({
        text: userMessage || 'Bitte schau dir dieses Foto meiner Aufgabe an und erkläre mir Schritt für Schritt, wie ich sie lösen kann.',
      });

      contents.push({
        role: 'user',
        parts: currentParts,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction,
        },
      });

      const reply = response.text?.trim();
      if (!reply) {
        res.status(502).json({ error: 'Fuchsi hat leider keine Antwort zurückgegeben. Bitte versuche es erneut.' });
        return;
      }

      res.json({ reply });
    } catch (err) {
      const mapped = mapGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  app.post('/api/generate-exercise', async (req: Request, res: Response) => {
    try {
      const body = req.body as GenerateExerciseBody;
      const grade = typeof body.grade === 'number' && body.grade >= 1 && body.grade <= 6 ? body.grade : 3;
      const subject = typeof body.subject === 'string' && body.subject.trim() ? body.subject.trim() : 'Mathe';

      const ai = getAiClient();

      const subjectInstructionMap: Record<string, string> = {
        Mathe: 'Mathematik (Rechnen, Grössen, Brüche, Textaufgaben mit Schweizer Franken/Rappen oder Längen/Gewichten)',
        Deutsch: 'Deutsch (Rechtschreibung mit Schweizer "ss" statt "ß", Wortarten, Fälle, Grammatik, Wortschatz)',
        NMG: 'NMG – Natur, Mensch, Gesellschaft (Schweizer Geografie, Tiere, Pflanzen, Jahreszeiten, Alltagswissen)',
        Englisch: 'Englisch (einfache Vokabeln, Sätze oder kurze Fragen passend zur Schweizer Primarschule)',
      };

      const subjectDescription = subjectInstructionMap[subject] || subject;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Erstelle eine abwechslungsreiche, kindgerechte Multiple-Choice-Übungsaufgabe für die ${grade}. Klasse (Schweizer Primarschule, Lehrplan 21) im Fach ${subjectDescription}. Achte streng auf Schweizer Rechtschreibung (immer "ss", niemals "ß"). Die 4 Antwortmöglichkeiten müssen eindeutig sein, sodass genau eine Antwort stimmt.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topic: {
                type: Type.STRING,
                description: 'Kurzes Thema der Aufgabe in 1-3 Wörtern, z. B. Einmaleins oder Wortarten.',
              },
              question: {
                type: Type.STRING,
                description: 'Die Aufgabenstellung für das Kind in klarem Schweizer Hochdeutsch.',
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Genau 4 Antwortmöglichkeiten als kurze Texte.',
              },
              correct: {
                type: Type.STRING,
                description: 'Die exakt richtige Antwort, identisch zu einem Eintrag in options.',
              },
              explanation: {
                type: Type.STRING,
                description: 'Kurze, ermutigende Erklärung in 1-2 Sätzen.',
              },
            },
            required: ['topic', 'question', 'options', 'correct', 'explanation'],
          },
        },
      });

      const jsonText = (response.text ?? '').trim();
      const parsed = JSON.parse(jsonText) as {
        topic?: string;
        question?: string;
        options?: string[];
        correct?: string;
        explanation?: string;
      };

      if (
        !parsed.question ||
        !Array.isArray(parsed.options) ||
        parsed.options.length < 2 ||
        !parsed.correct ||
        !parsed.options.includes(parsed.correct)
      ) {
        res.status(502).json({ error: 'Die generierte Aufgabe war unvollständig. Bitte versuche es noch einmal.' });
        return;
      }

      res.json({
        exercise: {
          id: `ai-${Date.now()}`,
          topic: parsed.topic || 'Bonus-Aufgabe',
          question: parsed.question,
          options: parsed.options.slice(0, 4),
          correct: parsed.correct,
          explanation: parsed.explanation || 'Gut gemacht!',
          isAiGenerated: true,
        },
      });
    } catch (err) {
      const mapped = mapGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LernFuchs server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start LernFuchs server:', error);
  process.exit(1);
});
