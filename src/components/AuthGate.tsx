import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { AlertCircle, CheckCircle2, Loader2, LogIn, UserPlus } from 'lucide-react';
import { auth, googleProvider } from '../firebase.ts';

type AuthMode = 'login' | 'register';

function GoogleGlyph() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.09.73-2.48 1.16-4.22 1.16-3.24 0-5.99-2.19-6.97-5.14H1.03v3.14C3.05 21.15 7.21 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.03 14.01c-.25-.73-.39-1.52-.39-2.34s.14-1.61.39-2.34V6.19H1.03A11.99 11.99 0 0 0 0 11.67c0 1.94.46 3.77 1.03 5.48l4-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.65c1.8 0 3.41.62 4.68 1.83l3.51-3.51C18.07 1.02 15.3 0 12 0 7.21 0 3.05 2.85 1.03 6.19l4 3.14c.98-2.95 3.73-5.14 6.97-5.14Z"
      />
    </svg>
  );
}

function mapAuthError(err: unknown): string {
  const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Diese E-Mail-Adresse wird bereits verwendet. Bitte melde dich direkt an.';
    case 'auth/invalid-email':
      return 'Bitte gib eine gültige E-Mail-Adresse ein.';
    case 'auth/weak-password':
      return 'Das Passwort muss mindestens 6 Zeichen lang sein.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-Mail-Adresse oder Passwort stimmt leider nicht.';
    case 'auth/too-many-requests':
      return 'Zu viele Versuche. Bitte warte einen kurzen Moment und versuche es erneut.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Die Anmeldung wurde abgebrochen. Bitte versuche es noch einmal.';
    case 'auth/popup-blocked':
      return 'Das Anmeldefenster wurde vom Browser blockiert. Bitte erlaube Pop-ups für diese Seite.';
    case 'auth/operation-not-allowed':
      return 'E-Mail/Passwort-Anmeldung ist in der Firebase-Konsole noch nicht aktiviert (Authentication > Sign-in method > E-Mail-Adresse/Passwort).';
    default:
      return 'Anmeldung fehlgeschlagen. Bitte überprüfe deine Eingaben und versuche es noch einmal.';
  }
}

export function AuthGate() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [infoText, setInfoText] = useState<string | null>(null);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setErrorText(null);
    setInfoText(null);
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorText(null);
    setInfoText(null);

    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim().slice(0, 80);

    if (!trimmedEmail || !password) {
      setErrorText('Bitte gib deine E-Mail-Adresse und dein Passwort ein.');
      return;
    }

    if (mode === 'register' && !trimmedName) {
      setErrorText('Bitte gib deinen Namen oder Spitznamen ein.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'register') {
        const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        await updateProfile(credential.user, { displayName: trimmedName });
        await sendEmailVerification(credential.user);
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      }
    } catch (err) {
      setErrorText(mapAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    setErrorText(null);
    setInfoText(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorText('Bitte gib zuerst deine E-Mail-Adresse ein, damit wir dir einen Link senden können.');
      return;
    }
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setInfoText('Wir haben dir eine E-Mail zum Zurücksetzen deines Passworts geschickt.');
    } catch (err) {
      setErrorText(mapAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    setErrorText(null);
    setInfoText(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setErrorText(mapAuthError(err));
    } finally {
      setIsGoogleLoading(false);
    }
  }

  const busy = isSubmitting || isGoogleLoading;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex flex-col justify-center">
            <span className="font-display text-xl font-extrabold tracking-tight text-slate-900 leading-none">
              LernFuchs
            </span>
            <span className="text-[11px] font-medium text-slate-500 leading-tight mt-0.5">
              erstellt von Sharushan
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Schweizer Primarschule · 1.–6. Klasse
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Sign-In / Register Card */}
          <section className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-amber-50 border border-slate-200 shrink-0">
                  <img
                    src="/src/assets/images/fuchsi_mascot_1795631232301.jpg"
                    alt="Fuchsi, dein Lernbegleiter"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-sky-700">
                    Anmeldung erforderlich
                  </p>
                  <h1
                    className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight"
                    style={{ textWrap: 'balance' }}
                  >
                    Willkommen bei LernFuchs
                  </h1>
                </div>
              </div>

              {/* Segmented Switch: Anmelden / Registrieren */}
              <div
                role="tablist"
                aria-label="Anmeldeart wählen"
                className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-5"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  onClick={() => switchMode('login')}
                  className={`py-2.5 px-3 rounded-lg text-sm font-bold transition-colors ${
                    mode === 'login'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Anmelden
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'register'}
                  onClick={() => switchMode('register')}
                  className={`py-2.5 px-3 rounded-lg text-sm font-bold transition-colors ${
                    mode === 'register'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Registrieren
                </button>
              </div>

              {errorText && (
                <div
                  role="alert"
                  className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-900 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{errorText}</span>
                </div>
              )}

              {infoText && (
                <div
                  role="status"
                  className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-950 flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{infoText}</span>
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label
                      htmlFor="auth-name"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Name oder Spitzname
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      maxLength={80}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="z. B. Mia"
                      autoComplete="name"
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 focus:border-sky-500 text-sm font-medium text-slate-900 outline-none transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="auth-email"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    E-Mail-Adresse
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@beispiel.ch"
                    autoComplete="email"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 focus:border-sky-500 text-sm font-medium text-slate-900 outline-none transition-colors"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="auth-password"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Passwort
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => void handlePasswordReset()}
                        disabled={busy}
                        className="text-xs font-semibold text-sky-700 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded px-1"
                      >
                        Passwort vergessen?
                      </button>
                    )}
                  </div>
                  <input
                    id="auth-password"
                    type="password"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Mindestens 6 Zeichen' : 'Dein Passwort'}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 focus:border-sky-500 text-sm font-medium text-slate-900 outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-12 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white font-bold text-base inline-flex items-center justify-center gap-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  ) : mode === 'register' ? (
                    <UserPlus className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <LogIn className="w-5 h-5" aria-hidden="true" />
                  )}
                  <span>
                    {isSubmitting
                      ? 'Bitte warten...'
                      : mode === 'register'
                        ? 'Konto erstellen'
                        : 'Anmelden'}
                  </span>
                </button>
              </form>
            </div>

            <div className="mt-6">
              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-slate-200 w-full" aria-hidden="true" />
                <span className="bg-white px-3 text-xs font-medium text-slate-400">oder</span>
              </div>

              <button
                type="button"
                onClick={() => void handleGoogleSignIn()}
                disabled={busy}
                className="w-full h-12 px-5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 disabled:opacity-60 text-slate-900 font-bold text-base inline-flex items-center justify-center gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-sky-600" aria-hidden="true" />
                ) : (
                  <GoogleGlyph />
                )}
                <span>
                  {isGoogleLoading ? 'Anmeldung läuft...' : 'Mit Google anmelden'}
                </span>
              </button>
            </div>
          </section>

          {/* Right Illustration Frame */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs min-h-[260px]">
            <img
              src="/src/assets/images/lernfuchs_hero_banner_1795631232047.jpg"
              alt="Sonniger Schweizer Lerntisch mit Blick auf die Alpen"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
