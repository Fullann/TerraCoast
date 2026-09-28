import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowLeft,
  Check,
  Zap,
  ShoppingBag,
  Globe2,
  Smile,
  Award,
  Heart,
} from "lucide-react";
import {
  SHOP_CATALOG,
  ShopItem,
  getPlayerGamificationState,
  buyShopItem,
  equipShopItem,
  PlayerGamificationState,
  adminGrantResources,
} from "../../lib/gamificationManager";
import { useAuth } from "../../contexts/AuthContext";
import { triggerConfetti } from "../common/Confetti";
import { playSound } from "../../lib/soundManager";
import { toast } from "../common/ToastContainer";
import { Avatar } from "../common/Avatar";

export function ShopPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [gamification, setGamification] = useState<PlayerGamificationState>(() =>
    getPlayerGamificationState(profile?.id)
  );
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "consumable" | "theme" | "frame" | "title"
  >("all");
  const [adminCustomGems, setAdminCustomGems] = useState("");
  const [adminCustomLives, setAdminCustomLives] = useState("");

  const refreshState = () => {
    setGamification(getPlayerGamificationState(profile?.id));
  };

  useEffect(() => {
    refreshState();
    const handleUpdate = () => refreshState();
    window.addEventListener("terracost_gamification_updated", handleUpdate);
    return () => window.removeEventListener("terracost_gamification_updated", handleUpdate);
  }, [profile?.id]);

  const handleBuy = (item: ShopItem) => {
    const res = buyShopItem(profile?.id, item.id);
    if (res.success) {
      playSound("success");
      if (item.category === "theme" || item.category === "frame" || item.priceGems >= 300) {
        triggerConfetti();
      }
      toast.success(res.message);
      setGamification(res.state);
    } else {
      playSound("error");
      toast.error(res.message);
    }
  };

  const handleEquip = (item: ShopItem) => {
    if (item.category === "consumable") return;
    const isCurrentlyActive =
      (item.category === "theme" && gamification.activeTheme === item.id) ||
      (item.category === "frame" && gamification.activeAvatarFrame === item.id) ||
      (item.category === "title" && gamification.activeTitle === item.id);

    const targetId = isCurrentlyActive ? null : item.id;
    const newState = equipShopItem(profile?.id, item.category, targetId);
    playSound("click");
    toast.success(
      isCurrentlyActive ? `${item.name} retiré.` : `${item.name} équipé avec succès !`
    );
    setGamification(newState);
  };

  const filteredItems = SHOP_CATALOG.filter((it) => {
    if (selectedCategory === "all") return true;
    return it.category === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/20 to-slate-100 py-6 px-3 sm:px-6 pb-28">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm active:scale-95 transition-all"
              title="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
                <span>Boutique de l'Explorateur</span>
                <span className="text-emerald-500">🛍️</span>
              </h1>
              <p className="text-xs sm:text-sm font-bold text-slate-500">
                Dépensez vos TerraGems gagnées sur le parcours pour débloquer thèmes, cosmétiques et boosters !
              </p>
            </div>
          </div>

          {/* Solde & Status Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Gems */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl shadow-md border border-sky-400 font-black text-sm">
              <span className="text-lg">💎</span>
              <span>{gamification.gems.toLocaleString()} TerraGems</span>
            </div>

            {/* Streak Freeze Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-black border shadow-sm ${
                gamification.streakFreezes > 0
                  ? "bg-cyan-50 border-cyan-300 text-cyan-800"
                  : "bg-slate-100 border-slate-200 text-slate-500"
              }`}
              title="Gels de flamme en réserve"
            >
              <span className="text-base">🧊</span>
              <span>
                {gamification.streakFreezes} Gel{gamification.streakFreezes > 1 ? "s" : ""}
              </span>
            </div>

            {/* Lives */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-black shadow-sm">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
              <span>
                {gamification.lives} / {gamification.maxLives} Vies
              </span>
            </div>
          </div>
        </div>

        {/* 👑 Console Administrateur : Recharges & Ressources */}
        {profile?.role === "admin" && (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-300 rounded-3xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">👑</span>
                <div>
                  <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                    Outils Développeur & Administration TerraCoast
                  </h3>
                  <p className="text-xs text-amber-800 font-medium">
                    Octroyez-vous des TerraGems 💎 et des Cœurs ❤️ instantanément pour tester tous les articles.
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-center px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-200 text-amber-900 border border-amber-300">
                Mode Administrateur Actif
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
              <button
                type="button"
                onClick={() => {
                  const s = adminGrantResources(profile?.id, { gemsDelta: 1000 });
                  playSound("success");
                  toast.success("+1 000 TerraGems 💎 ajoutées !");
                  setGamification(s);
                }}
                className="p-2.5 bg-white hover:bg-sky-50 text-sky-900 font-extrabold text-xs rounded-2xl border border-sky-300 shadow-sm active:scale-95 transition-all text-center flex flex-col items-center gap-0.5"
              >
                <span className="text-base">💎</span>
                <span>+1 000 Gems</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const s = adminGrantResources(profile?.id, { gemsDelta: 5000 });
                  playSound("success");
                  toast.success("+5 000 TerraGems 💎 ajoutées !");
                  setGamification(s);
                }}
                className="p-2.5 bg-white hover:bg-sky-50 text-sky-900 font-extrabold text-xs rounded-2xl border border-sky-300 shadow-sm active:scale-95 transition-all text-center flex flex-col items-center gap-0.5"
              >
                <span className="text-base">💎</span>
                <span>+5 000 Gems</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const s = adminGrantResources(profile?.id, { gemsDelta: 20000 });
                  playSound("success");
                  triggerConfetti();
                  toast.success("+20 000 TerraGems 💎 ajoutées !");
                  setGamification(s);
                }}
                className="p-2.5 bg-white hover:bg-sky-50 text-sky-900 font-extrabold text-xs rounded-2xl border border-sky-300 shadow-sm active:scale-95 transition-all text-center flex flex-col items-center gap-0.5"
              >
                <span className="text-base">💎</span>
                <span>+20 000 Gems</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const s = adminGrantResources(profile?.id, { fullRefill: true, setLives: 5 });
                  playSound("success");
                  toast.success("Cœurs restaurés au maximum (5 ❤️) !");
                  setGamification(s);
                }}
                className="p-2.5 bg-white hover:bg-rose-50 text-rose-900 font-extrabold text-xs rounded-2xl border border-rose-300 shadow-sm active:scale-95 transition-all text-center flex flex-col items-center gap-0.5"
              >
                <span className="text-base">❤️</span>
                <span>5 Vies Max</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const s = adminGrantResources(profile?.id, { setLives: 99 });
                  playSound("success");
                  toast.success("Mode Immortel : 99 Cœurs ❤️ attribués !");
                  setGamification(s);
                }}
                className="p-2.5 bg-white hover:bg-purple-50 text-purple-900 font-extrabold text-xs rounded-2xl border border-purple-300 shadow-sm active:scale-95 transition-all text-center flex flex-col items-center gap-0.5"
              >
                <span className="text-base">♾️</span>
                <span>99 Vies Dev</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const s = adminGrantResources(profile?.id, { streakFreezesDelta: 3 });
                  playSound("success");
                  toast.success("+3 Gels de Flamme 🧊 ajoutés !");
                  setGamification(s);
                }}
                className="p-2.5 bg-white hover:bg-indigo-50 text-indigo-900 font-extrabold text-xs rounded-2xl border border-indigo-300 shadow-sm active:scale-95 transition-all text-center flex flex-col items-center gap-0.5"
              >
                <span className="text-base">🧊</span>
                <span>+3 Gels</span>
              </button>
            </div>

            {/* Formulaire Montant Personnalisé */}
            <div className="pt-3 border-t border-amber-200/80 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                <input
                  type="number"
                  placeholder="Montant libre de gemmes..."
                  value={adminCustomGems}
                  onChange={(e) => setAdminCustomGems(e.target.value)}
                  className="px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold w-full sm:w-48 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = parseInt(adminCustomGems, 10);
                    if (!isNaN(val) && val !== 0) {
                      const s = adminGrantResources(profile?.id, { gemsDelta: val });
                      playSound("success");
                      toast.success(`${val >= 0 ? "+" : ""}${val} 💎 ajoutées !`);
                      setGamification(s);
                      setAdminCustomGems("");
                    }
                  }}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-xl text-xs whitespace-nowrap active:scale-95 shadow-sm transition-all"
                >
                  + Gems 💎
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                <input
                  type="number"
                  placeholder="Fixer nombre de vies..."
                  value={adminCustomLives}
                  onChange={(e) => setAdminCustomLives(e.target.value)}
                  className="px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-bold w-full sm:w-48 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = parseInt(adminCustomLives, 10);
                    if (!isNaN(val) && val >= 0) {
                      const s = adminGrantResources(profile?.id, { setLives: val });
                      playSound("success");
                      toast.success(`Cœurs fixés à ${val} ❤️ !`);
                      setGamification(s);
                      setAdminCustomLives("");
                    }
                  }}
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs whitespace-nowrap active:scale-95 shadow-sm transition-all"
                >
                  = Cœurs ❤️
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bannière Mise en Avant : Le Gel de Flamme */}
        <div className="bg-gradient-to-r from-sky-900 via-blue-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-sky-500/30">
          <div className="absolute -right-8 -bottom-8 text-9xl opacity-15 select-none pointer-events-none">
            🧊
          </div>
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Protection Essentielle
            </div>
            <h2 className="text-xl sm:text-2xl font-black mb-1.5">
              Sauvegardez votre flamme avec le Gel de Flamme 🧊
            </h2>
            <p className="text-xs sm:text-sm text-sky-200 mb-4 leading-relaxed">
              Un empêchement ? Pas de panique ! Si vous manquez un jour de connexion, le gel se consomme automatiquement pour préserver votre série intacte.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleBuy(SHOP_CATALOG[0])}
                className="py-2.5 px-5 btn-duo btn-duo-teal text-xs font-black flex items-center gap-2"
              >
                <span>Acheter 1 Gel (200 💎)</span>
              </button>
              <span className="text-xs font-bold text-sky-300">
                Vous possédez : <strong>{gamification.streakFreezes} gel(s)</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Filtres de catégories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: "all", label: "Tout le catalogue", icon: ShoppingBag },
            { id: "consumable", label: "Boosters & Vies", icon: Zap },
            { id: "theme", label: "Thèmes de Globe 3D", icon: Globe2 },
            { id: "frame", label: "Cadres d'Avatar", icon: Smile },
            { id: "title", label: "Titres Honorifiques", icon: Award },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-105"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Grille des Articles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const isTheme = item.category === "theme";
            const isFrame = item.category === "frame";
            const isTitle = item.category === "title";
            const isConsumable = item.category === "consumable";

            const isOwned =
              (isTheme && gamification.inventory.themes.includes(item.id)) ||
              (isFrame && gamification.inventory.avatarFrames.includes(item.id)) ||
              (isTitle && gamification.inventory.titles.includes(item.id));

            const isActive =
              (isTheme && gamification.activeTheme === item.id) ||
              (isFrame && gamification.activeAvatarFrame === item.id) ||
              (isTitle && gamification.activeTitle === item.id);

            const canAfford = gamification.gems >= item.priceGems;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group"
              >
                <div>
                  {/* Top card banner */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                        item.previewGradient || "from-slate-100 to-slate-200"
                      } flex items-center justify-center text-3xl shadow-inner border border-slate-200`}
                    >
                      {item.icon}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {item.badge && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {item.badge}
                        </span>
                      )}

                      {!isOwned && (
                        <span className="text-xs font-black text-sky-600 flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded-xl border border-sky-200">
                          <span>💎</span>
                          <span>{item.priceGems}</span>
                        </span>
                      )}

                      {isOwned && !isConsumable && (
                        <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Possédé
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 mb-2 font-medium leading-relaxed">
                    {item.description}
                  </p>

                  {/* Extra Visual Preview */}
                  {isFrame && (
                    <div className="my-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                      <Avatar
                        pseudo={profile?.pseudo || "Moi"}
                        frameStyle={item.id}
                        size="sm"
                      />
                      <span className="text-[11px] font-bold text-slate-600">
                        Aperçu sur votre profil
                      </span>
                    </div>
                  )}

                  {isTitle && (
                    <div className="my-3 p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                      <span className="text-xs font-black text-emerald-700 bg-white px-3 py-1 rounded-xl shadow-xs border border-emerald-200">
                        « {item.name.replace(/[^a-zA-Z0-9À-ÿ\s]/g, "").trim()} »
                      </span>
                    </div>
                  )}

                  {item.id === "streak_freeze" && (
                    <div className="my-2 text-[11px] font-bold text-cyan-700 bg-cyan-50/70 p-2 rounded-xl border border-cyan-100 flex items-center justify-between">
                      <span>Réserve actuelle :</span>
                      <span className="font-black text-cyan-900">
                        {gamification.streakFreezes} gel(s) 🧊
                      </span>
                    </div>
                  )}

                  {item.id === "refill_lives" && (
                    <div className="my-2 text-[11px] font-bold text-rose-700 bg-rose-50/70 p-2 rounded-xl border border-rose-100 flex items-center justify-between">
                      <span>Vies actuelles :</span>
                      <span className="font-black text-rose-900">
                        {gamification.lives} / {gamification.maxLives} ❤️
                      </span>
                    </div>
                  )}
                </div>

                {/* Bouton d'action */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  {isConsumable ? (
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => handleBuy(item)}
                      className={`w-full py-2.5 px-4 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                        canAfford
                          ? "btn-duo btn-duo-green"
                          : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                      }`}
                    >
                      {canAfford ? (
                        <>
                          <span>Acheter pour {item.priceGems} 💎</span>
                        </>
                      ) : (
                        <span>Manque {item.priceGems - gamification.gems} 💎</span>
                      )}
                    </button>
                  ) : isOwned ? (
                    <button
                      type="button"
                      onClick={() => handleEquip(item)}
                      className={`w-full py-2.5 px-4 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                        isActive
                          ? "bg-emerald-600 text-white border-2 border-emerald-700"
                          : "btn-duo btn-duo-blue"
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>ACTIF (Clique pour retirer)</span>
                        </>
                      ) : (
                        <span>ÉQUIPER / ACTIVER ⚡</span>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => handleBuy(item)}
                      className={`w-full py-2.5 px-4 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                        canAfford
                          ? "btn-duo btn-duo-teal"
                          : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                      }`}
                    >
                      {canAfford ? (
                        <>
                          <span>Débloquer ({item.priceGems} 💎)</span>
                        </>
                      ) : (
                        <span>Manque {item.priceGems - gamification.gems} 💎</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
