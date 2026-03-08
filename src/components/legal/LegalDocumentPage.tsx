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
        <h2 className="text-lg font-bold text-gray-900 mt-6 first:mt-0">
          {t("legal.terms.acceptance")}
        </h2>
        <p>{t("legal.terms.acceptanceText")}</p>
      </section>
      <section>
        <h2 className="text-lg font-bold text-gray-900 mt-6">
          {t("legal.terms.useOfService")}
        </h2>
        <p>{t("legal.terms.useOfServiceText")}</p>
      </section>
      <section>
        <h2 className="text-lg font-bold text-gray-900 mt-6">
          {t("legal.terms.userContent")}
        </h2>
        <p>{t("legal.terms.userContentText")}</p>
      </section>
      <section>
        <h2 className="text-lg font-bold text-gray-900 mt-6">
          {t("legal.terms.behavior")}
        </h2>
        <p>{t("legal.terms.behaviorText")}</p>
      </section>
    </>
  );
}

function PrivacyContent() {
  const { t } = useLanguage();
  return (
    <>
      <section>
        <h2 className="text-lg font-bold text-gray-900 mt-6 first:mt-0">
          {t("legal.privacy.dataCollection")}
        </h2>
        <p>{t("legal.privacy.dataCollectionText")}</p>
      </section>
      <section>
        <h2 className="text-lg font-bold text-gray-900 mt-6">
          {t("legal.privacy.dataUse")}
        </h2>
        <p>{t("legal.privacy.dataUseText")}</p>
      </section>
      <section>
        <h2 className="text-lg font-bold text-gray-900 mt-6">
          {t("legal.privacy.cookies")}
        </h2>
        <p>{t("legal.privacy.cookiesText")}</p>
      </section>
      <section>
        <h2 className="text-lg font-bold text-gray-900 mt-6">
          {t("legal.privacy.rights")}
        </h2>
        <p>{t("legal.privacy.rightsText")}</p>
      </section>
    </>
  );
}
