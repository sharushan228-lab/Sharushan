import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Unbekannter Fehler',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let friendlyText =
        'Beim Laden oder Speichern deines Lernstands ist ein Fehler aufgetreten.';
      if (this.state.errorMessage.includes('Quota exceeded')) {
        friendlyText =
          'Das kostenlose Tageslimit der Datenbank wurde erreicht. Morgen steht sie wieder vollständig zur Verfügung.';
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2.5 text-rose-700 mb-3">
              <AlertCircle className="w-6 h-6 shrink-0" aria-hidden="true" />
              <h1 className="font-display text-xl font-bold text-slate-900">
                Etwas hat nicht geklappt
              </h1>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">{friendlyText}</p>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Seite neu laden</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
