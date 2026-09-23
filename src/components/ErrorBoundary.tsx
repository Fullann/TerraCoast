import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

interface FallbackProps {
  error: Error | null;
  onReset: () => void;
}

function ErrorFallback({ error, onReset }: FallbackProps) {
  let t = (key: string) => {
    const defaults: Record<string, string> = {
      "error.title": "Oups ! Une erreur est survenue.",
      "error.message": "L'application a rencontré un problème inattendu.",
      "error.returnHome": "Retour à l'accueil",
      "error.reload": "Recharger la page",
    };
    return defaults[key] || key;
  };

  try {
    const langContext = useLanguage();
    if (langContext && typeof langContext.t === "function") {
      t = langContext.t;
    }
  } catch (_) {
    // Si l'erreur survient en dehors ou avant le montage du LanguageProvider
  }

  const isChunkError =
    error?.message?.includes("Failed to fetch dynamically imported module") ||
    error?.message?.includes("Importing a module script failed") ||
    error?.name === "ChunkLoadError";

  return (
    <div
      role="alert"
      className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100">
        <div className={`w-16 h-16 ${isChunkError ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"} rounded-full flex items-center justify-center mx-auto mb-4`}>
          {isChunkError ? (
            <RefreshCw className="w-8 h-8 animate-spin" aria-hidden="true" />
          ) : (
            <AlertTriangle className="w-8 h-8" aria-hidden="true" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isChunkError ? "Mise à jour disponible" : t("error.title")}
        </h1>
        <p className="text-gray-600 mb-6 text-sm">
          {isChunkError
            ? "Une nouvelle version de TerraCoast a été déployée. Cliquez sur Recharger pour appliquer la mise à jour."
            : t("error.message")}
        </p>
        {!isChunkError && error?.message && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-left text-xs font-mono text-red-700 overflow-auto mb-6 max-h-36">
            {error.message}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 ${isChunkError ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-800"} rounded-xl font-medium text-sm transition-colors cursor-pointer`}
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            {t("error.reload")}
          </button>
          {!isChunkError && (
            <button
              type="button"
              onClick={onReset}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm cursor-pointer"
            >
              <Home className="w-4 h-4" aria-hidden="true" />
              {t("error.returnHome")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    const msg = error?.message || "";
    const isChunkError =
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Importing a module script failed") ||
      error?.name === "ChunkLoadError";

    if (isChunkError) {
      const reloadKey = "tc_eb_chunk_reload";
      const lastReload = Number(sessionStorage.getItem(reloadKey) || 0);
      if (Date.now() - lastReload > 10000) {
        sessionStorage.setItem(reloadKey, String(Date.now()));
        window.location.reload();
      }
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
