import { useState, useMemo } from "react";
import { X, Search, Check } from "lucide-react";
import {
  FEDERATIONS_LIST,
  getFederationById,
  saveUserFederation,
  type Federation,
} from "../../../lib/federations";
import { useLanguage } from "../../../contexts/LanguageContext";

interface FederationSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFederationId?: string;
  userId?: string | null;
  onFederationChanged?: (federation: Federation) => void;
}

export function FederationSelectModal({
  isOpen,
  onClose,
  currentFederationId = "CH",
  userId,
  onFederationChanged,
}: FederationSelectModalProps) {
  const { t } = useLanguage();
  const [selectedId, setSelectedId] = useState(currentFederationId);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    "all" | "country" | "canton" | "academic_club"
  >("all");
  const [saving, setSaving] = useState(false);

  const filteredFederations = useMemo(() => {
    return FEDERATIONS_LIST.filter((fed) => {
      const matchSearch =
        fed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fed.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (fed.description &&
          fed.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (activeCategory === "country") return fed.category === "country";
      if (activeCategory === "canton") return fed.category === "canton";
      if (activeCategory === "academic_club")
        return fed.category === "academic" || fed.category === "club";

      return true;
    });
  }, [searchQuery, activeCategory]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setSaving(true);
    saveUserFederation(selectedId, userId);
    const chosen = getFederationById(selectedId);
    if (onFederationChanged) {
      onFederationChanged(chosen);
    }
    setSaving(false);
    onClose();
  };

  const selectedFed = getFederationById(selectedId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-emerald-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition text-white"
            title={t("common.close")}
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-inner">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-300/30 border border-emerald-200 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Ligue des Nations & Fédérations
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black mt-1">
                Choisissez votre Blason
              </h2>
            </div>
          </div>
          <p className="text-xs text-emerald-100 mt-2">
            Vos points individuels seront automatiquement comptabilisés au classement collectif de votre nation ou canton !
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un pays, canton (Vaud, Genève...), école ou club..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                activeCategory === "all"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              Tous ({FEDERATIONS_LIST.length})
            </button>
            <button
              onClick={() => setActiveCategory("country")}
              className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                activeCategory === "country"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              🌍 Pays
            </button>
            <button
              onClick={() => setActiveCategory("canton")}
              className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                activeCategory === "canton"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              🏔️ Cantons Suisses
            </button>
            <button
              onClick={() => setActiveCategory("academic_club")}
              className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                activeCategory === "academic_club"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              🎓 Écoles & Clubs
            </button>
          </div>
        </div>

        {/* Federations List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px]">
          {filteredFederations.map((fed) => {
            const isSelected = selectedId === fed.id;
            return (
              <button
                key={fed.id}
                type="button"
                onClick={() => setSelectedId(fed.id)}
                className={`flex items-center justify-between p-3.5 rounded-2xl text-left transition border ${
                  isSelected
                    ? "bg-emerald-50 border-emerald-500 shadow-md ring-2 ring-emerald-500/30"
                    : "bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-3xl shrink-0">{fed.flagEmoji}</span>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-gray-900 truncate">
                        {fed.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-mono font-bold">
                        {fed.shortCode}
                      </span>
                    </div>
                    {fed.description && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {fed.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                  )}
                </div>
              </button>
            );
          })}

          {filteredFederations.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 text-sm">
              Aucune fédération trouvée pour « {searchQuery} ».
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>Fédération choisie :</span>
            <span className="font-extrabold text-gray-900 flex items-center gap-1">
              <span>{selectedFed.flagEmoji}</span>
              <span>{selectedFed.name}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm transition"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={saving}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-md transition transform active:scale-98"
            >
              Confirmer ce Blason 🏛️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
