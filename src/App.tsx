import { useEffect, useState } from 'react';
import { onAuthStateChanged, sendEmailVerification, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { CheckCircle2, Loader2, LogOut, Mail, RefreshCw } from 'lucide-react';
import type { AppTab, GradeLevel, ProgressRecord, SubjectId } from './types.ts';
import { auth, db, handleFirestoreError, OperationType } from './firebase.ts';
import { AuthGate } from './components/AuthGate.tsx';
import { HeaderBar } from './components/HeaderBar.tsx';
import { ExerciseStage } from './components/ExerciseStage.tsx';
import { BlitzTrainer } from './components/BlitzTrainer.tsx';
import { ProgressView } from './components/ProgressView.tsx';

const VALID_SUBJECTS: SubjectId[] = ['Mathe', 'Deutsch', 'Französisch', 'Englisch', 'NMG'];

function clampDisplayName(user: User): string {
  const raw = (user.displayName || user.email || 'LernFuchs-Kind').trim();
  return (raw || 'LernFuchs-Kind').slice(0, 80);
}

function clampGrade(val: unknown): GradeLevel {
  const n = Number(val);
  if (Number.isInteger(n) && n >= 1 && n <= 6) {
    return n as GradeLevel;
  }
  return 3;
}

function clampSubject(val: unknown): SubjectId {
  if (typeof val === 'string' && VALID_SUBJECTS.includes(val as SubjectId)) {
    return val as SubjectId;
  }
  return 'Mathe';
}

function sanitizeCompletedIds(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item): item is string => typeof item === 'string' && item.length > 0)
    .map((item) => item.slice(0, 32))
    .slice(-500);
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AppTab>('learn');
  const [grade, setGrade] = useState<GradeLevel>(3);
  const [subject, setSubject] = useState<SubjectId>('Mathe');
  const [progress, setProgress] = useState<ProgressRecord>({
    stars: 12,
    completedIds: [],
    streak: 0,
  });
  const [asyncError, setAsyncError] = useState<Error | null>(null);

  if (asyncError) {
    throw asyncError;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setEmailVerified(Boolean(firebaseUser?.emailVerified));
      setAuthReady(true);
      setVerifyNotice(null);
      if (!firebaseUser || !firebaseUser.emailVerified) {
        setProfileReady(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !user || !emailVerified) return;

    const progressPath = `users/${user.uid}/private/progress`;
    const progressRef = doc(db, 'users', user.uid, 'private', 'progress');

    const unsubscribe = onSnapshot(
      progressRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          const initialPayload = {
            uid: user.uid,
            displayName: clampDisplayName(user),
            grade: 3,
            preferredSubject: 'Mathe' as SubjectId,
            stars: 12,
            streak: 0,
            completedIds: [] as string[],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          void setDoc(progressRef, initialPayload).catch((err) => {
            try {
              handleFirestoreError(err, OperationType.CREATE, progressPath);
            } catch (wrapped) {
              setAsyncError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
            }
          });
          setProfileReady(true);
          return;
        }

        const data = snapshot.data();
        setGrade(clampGrade(data.grade));
        setSubject(clampSubject(data.preferredSubject));
        setProgress({
          stars: typeof data.stars === 'number' && data.stars >= 0 ? Math.min(100000, Math.floor(data.stars)) : 12,
          streak: typeof data.streak === 'number' && data.streak >= 0 ? Math.min(10000, Math.floor(data.streak)) : 0,
          completedIds: sanitizeCompletedIds(data.completedIds),
        });
        setProfileReady(true);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, progressPath);
        } catch (wrapped) {
          setAsyncError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      },
    );

    return () => unsubscribe();
  }, [authReady, user, emailVerified]);

  async function persistProgressPatch(patch: {
    grade?: GradeLevel;
    preferredSubject?: SubjectId;
    stars?: number;
    streak?: number;
    completedIds?: string[];
  }) {
    if (!user || !emailVerified) return;
    const progressPath = `users/${user.uid}/private/progress`;
    const progressRef = doc(db, 'users', user.uid, 'private', 'progress');

    const safePatch: Record<string, unknown> = {
      displayName: clampDisplayName(user),
      updatedAt: serverTimestamp(),
    };
    if (patch.grade !== undefined) safePatch.grade = clampGrade(patch.grade);
    if (patch.preferredSubject !== undefined) safePatch.preferredSubject = clampSubject(patch.preferredSubject);
    if (patch.stars !== undefined) safePatch.stars = Math.max(0, Math.min(100000, Math.floor(patch.stars)));
    if (patch.streak !== undefined) safePatch.streak = Math.max(0, Math.min(10000, Math.floor(patch.streak)));
    if (patch.completedIds !== undefined) safePatch.completedIds = sanitizeCompletedIds(patch.completedIds);

    try {
      await updateDoc(progressRef, safePatch);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, progressPath);
      } catch (wrapped) {
        setAsyncError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  }

  function handleChangeGrade(nextGrade: GradeLevel) {
    setGrade(nextGrade);
    void persistProgressPatch({ grade: nextGrade });
  }

  function handleSelectSubject(nextSubject: SubjectId) {
    setSubject(nextSubject);
    void persistProgressPatch({ preferredSubject: nextSubject });
  }

  function handleExerciseSolved(exerciseId: string, firstTryCorrect: boolean) {
    const safeId = exerciseId.slice(0, 32);
    const alreadyCompleted = progress.completedIds.includes(safeId);
    const nextCompleted = alreadyCompleted
      ? progress.completedIds
      : sanitizeCompletedIds([...progress.completedIds, safeId]);
    const nextStars = Math.min(100000, progress.stars + (firstTryCorrect ? 1 : 0));
    const nextStreak = firstTryCorrect ? Math.min(10000, progress.streak + 1) : 0;

    setProgress({
      stars: nextStars,
      completedIds: nextCompleted,
      streak: nextStreak,
    });

    void persistProgressPatch({
      stars: nextStars,
      completedIds: nextCompleted,
      streak: nextStreak,
    });
  }

  function handleEarnBonusStar() {
    const nextStars = Math.min(100000, progress.stars + 1);
    const nextStreak = Math.min(10000, progress.streak + 1);
    setProgress((prev) => ({
      ...prev,
      stars: nextStars,
      streak: nextStreak,
    }));
    void persistProgressPatch({
      stars: nextStars,
      streak: nextStreak,
    });
  }

  function handleResetProgress() {
    const resetState: ProgressRecord = {
      stars: 12,
      completedIds: [],
      streak: 0,
    };
    setProgress(resetState);
    void persistProgressPatch(resetState);
  }

  async function handleSignOut() {
    await signOut(auth);
  }

  async function handleCheckVerification() {
    if (!auth.currentUser) return;
    setVerifyBusy(true);
    setVerifyNotice(null);
    try {
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      if (auth.currentUser.emailVerified) {
        setEmailVerified(true);
      } else {
        setVerifyNotice(
          'Deine E-Mail-Adresse ist noch nicht bestätigt. Bitte klicke zuerst auf den Link in deinem Postfach.',
        );
      }
    } catch {
      setVerifyNotice('Status konnte nicht geprüft werden. Bitte versuche es gleich noch einmal.');
    } finally {
      setVerifyBusy(false);
    }
  }

  async function handleResendVerification() {
    if (!auth.currentUser) return;
    setVerifyBusy(true);
    setVerifyNotice(null);
    try {
      await sendEmailVerification(auth.currentUser);
      setVerifyNotice('Wir haben dir den Bestätigungslink erneut gesendet.');
    } catch {
      setVerifyNotice('Die E-Mail konnte gerade nicht gesendet werden. Bitte warte einen Moment.');
    } finally {
      setVerifyBusy(false);
    }
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-600 text-sm font-semibold">
          <Loader2 className="w-5 h-5 animate-spin text-sky-600" aria-hidden="true" />
          <span>LernFuchs wird geladen...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthGate />;
  }

  if (!emailVerified) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold text-sky-700">Noch ein Schritt</p>
              <h1 className="font-display text-xl font-bold text-slate-900">
                E-Mail-Adresse bestätigen
              </h1>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-5">
            Wir haben einen Bestätigungslink an <strong className="text-slate-900">{user.email}</strong> gesendet. Öffne die E-Mail und klicke auf den Link, um deinen Lernstand freizuschalten.
          </p>

          {verifyNotice && (
            <div
              role="status"
              className="mb-4 p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800"
            >
              {verifyNotice}
            </div>
          )}

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => void handleCheckVerification()}
              disabled={verifyBusy}
              className="w-full h-11 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
            >
              {verifyBusy ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              )}
              <span>Ich habe meine E-Mail bestätigt</span>
            </button>

            <button
              type="button"
              onClick={() => void handleResendVerification()}
              disabled={verifyBusy}
              className="w-full h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-800 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Link erneut senden</span>
            </button>

            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="w-full h-10 px-4 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Abmelden</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profileReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-slate-600 text-sm font-semibold">
          <Loader2 className="w-5 h-5 animate-spin text-sky-600" aria-hidden="true" />
          <span>Dein Lernstand wird geladen...</span>
        </div>
      </div>
    );
  }

  const displayName = clampDisplayName(user);
  const mobileTabs: Array<{ id: AppTab; label: string }> = [
    { id: 'learn', label: 'Übungsportal' },
    { id: 'blitz', label: 'Blitztraining' },
    { id: 'progress', label: 'Lernstand' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <HeaderBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        grade={grade}
        onChangeGrade={handleChangeGrade}
        stars={progress.stars}
        userName={displayName}
        onSignOut={() => void handleSignOut()}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Mobile segmented navigation */}
        <div
          role="tablist"
          aria-label="Bereiche"
          className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 rounded-xl mb-6 md:hidden"
        >
          {mobileTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 px-2 rounded-lg text-xs font-bold whitespace-nowrap truncate transition-colors ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Workspace Heading Row */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-sky-700 mb-1">
              Hoi {displayName} · Schweizer Primarschule (1.–6. Klasse)
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'learn' && `${grade}. Klasse · Lernportal`}
              {activeTab === 'blitz' && `${grade}. Klasse · Blitztraining`}
              {activeTab === 'progress' && `Dein Lernstand in der ${grade}. Klasse`}
            </h1>
          </div>
        </div>

        {activeTab === 'learn' && (
          <ExerciseStage
            grade={grade}
            subject={subject}
            onSelectSubject={handleSelectSubject}
            completedIds={progress.completedIds}
            onExerciseSolved={handleExerciseSolved}
          />
        )}

        {activeTab === 'blitz' && (
          <BlitzTrainer
            grade={grade}
            onEarnStar={handleEarnBonusStar}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressView
            grade={grade}
            stars={progress.stars}
            streak={progress.streak}
            completedIds={progress.completedIds}
            onStartSubject={(subj) => {
              handleSelectSubject(subj);
              setActiveTab('learn');
            }}
            onResetProgress={handleResetProgress}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>LernFuchs · Schweizer Lernportal für die 1.–6. Klasse</span>
          <span>Mathematik · Deutsch · Französisch · Englisch · NMG</span>
        </div>
      </footer>
    </div>
  );
}
