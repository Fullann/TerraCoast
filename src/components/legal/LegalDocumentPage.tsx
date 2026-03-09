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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          {t("common.back")}
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            {title}
          </h1>

          <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
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
