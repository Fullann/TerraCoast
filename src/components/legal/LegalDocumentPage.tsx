import { ArrowLeft } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

type DocumentType = "terms" | "privacy";

interface LegalDocumentPageProps {
  type: DocumentType;
  onBack: () => void;
}

export function LegalDocumentPage({ type, onBack }: LegalDocumentPageProps) {
  const { t } = useLanguage();
  const title =
    type === "terms"
      ? t("legal.title.terms")
      : t("legal.title.privacy");

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/50 via-slate-50 to-white py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4">
        <button
          onClick={onBack}
          className="btn-duo btn-duo-white inline-flex items-center gap-2 px-4 py-2.5 text-xs font-black text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("common.back")}</span>
        </button>

        <div className="card-duo p-6 sm:p-10 bg-white">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-6 tracking-tight">
            {title}
          </h1>

          <div className="prose prose-sm max-w-none text-slate-700 space-y-6 font-medium leading-relaxed">
            {type === "terms" && <TermsContent />}
            {type === "privacy" && <PrivacyContent />}
          </div>
        </div>
      </div>
    </div>
  );
}

function TermsContent() {
  const { t } = useLanguage();
  return (
    <>
      <section>
        <p className="text-sm text-gray-500 mb-4">{t("legal.terms.lastUpdated")}</p>
        <p className="whitespace-pre-line">{t("legal.terms.fullText")}</p>
      </section>
    </>
  );
}

function PrivacyContent() {
  const { t } = useLanguage();
  return (
    <>
      <section>
        <p className="text-sm text-gray-500 mb-4">{t("legal.privacy.lastUpdated")}</p>
        <p className="whitespace-pre-line">{t("legal.privacy.fullText")}</p>
      </section>
    </>
  );
}
