import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0a0c] text-slate-800 dark:text-slate-200 p-8 text-center">
          <h1 className="text-4xl font-black mb-4 text-rose-500">Oops! Algo correu mal.</h1>
          <p className="mb-8 max-w-md text-slate-500">
            Ocorreu um erro inesperado na aplicação. Tenta recarregar a página.
          </p>
          <pre className="bg-gray-100 dark:bg-black/20 p-4 rounded-xl text-xs text-left overflow-auto max-w-2xl mb-8 border border-rose-500/20 text-rose-500 font-mono">
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => {
                // Tenta limpar configurações que podem estar corrompidas
                localStorage.removeItem('ia_ventura_lang'); 
                window.location.reload();
            }}
            className="px-8 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/10"
          >
            Recarregar Aplicação (Reset)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
