import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import {
  SHOP_CATALOG,
  ShopItem,
  getPlayerGamificationState,
  buyShopItem,
  equipShopItem,
  PlayerGamificationState,
  adminGrantResources,
} from "../../lib/gamificationManager";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { triggerConfetti } from "../common/Confetti";
import { playSound } from "../../lib/soundManager";
import { toast } from "../common/ToastContainer";

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: "all" | "consumable" | "theme" | "frame" | "title";
}

export function ShopModal({ isOpen, onClose, defaultCategory = "all" }: ShopModalProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [gamification, setGamification] = useState<PlayerGamificationState>(() =>
    getPlayerGamificationState(profile?.id)
  );
  const [category, setCategory] = useState(defaultCategory);

  const refreshState = () => {
    setGamification(getPlayerGamificationState(profile?.id));
  };

  useEffect(() => {
    refreshState();
    const handleUpdate = () => refreshState();
    window.addEventListener("terracost_gamification_updated", handleUpdate);
    window.addEventListener("terracoast:profile_updated", handleUpdate);
    return () => {
      window.removeEventListener("terracost_gamification_updated", handleUpdate);
      window.removeEventListener("terracoast:profile_updated", handleUpdate);
    };
  }, [isOpen, profile?.id]);

  if (!isOpen) return null;

  const syncFrameToSupabase = async (frameId: string | null) => {
    if (!profile?.id) return;
    try {
      await supabase
        .from("profiles")
        .update({ frame_style: frameId || "none", updated_at: new Date().toISOString() })
        .eq("id", profile.id);

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("terracoast:profile_updated", { detail: { userId: profile.id } })
        );
      }
    } catch (e) {
      console.error("Failed to sync frame to Supabase:", e);
    }
  };

  const syncTitleToSupabase = async (_itemId: string, itemName: string, itemDescription?: string) => {
    if (!profile?.id) return;
    try {
      const cleanName = itemName.replace(/[^\p{L}\p{N}\s]/gu, "").trim();
      let { data: existingTitle } = await supabase
        .from("titles")
        .select("id")
        .eq("name", cleanName)
        .maybeSingle();

      // If title does not exist yet in DB, only admins can insert it
      if (!existingTitle && profile.role === "admin") {
        const { data: createdTitle } = await supabase
          .from("titles")
          .insert({
            name: cleanName,
            description: itemDescription || "Titre exclusif de la Boutique TerraCoast",
            requirement_type: "shop",
            requirement_value: 0,
            is_special: true,
          })
          .select("id")
          .maybeSingle();

        existingTitle = createdTitle;
      }

      if (existingTitle) {
        // Deactivate all other titles first
        await supabase
          .from("user_titles")
          .update({ is_active: false })
          .eq("user_id", profile.id);

        // Check if user already owns this title in user_titles
        const { data: existingUserTitle } = await supabase
          .from("user_titles")
          .select("id")
          .eq("user_id", profile.id)
          .eq("title_id", existingTitle.id)
          .maybeSingle();

        if (existingUserTitle) {
          await supabase
            .from("user_titles")
            .update({ is_active: true })
            .eq("id", existingUserTitle.id);
        } else {
          await supabase
            .from("user_titles")
            .insert({
              user_id: profile.id,
              title_id: existingTitle.id,
              is_active: true,
              earned_at: new Date().toISOString(),
            });
        }
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("terracoast:profile_updated", { detail: { userId: profile.id } })
        );
      }
    } catch (e) {
      console.warn("Could not sync title to Supabase (using local gamification fallback):", e);
    }
  };

  const handleBuy = async (item: ShopItem) => {
    const res = buyShopItem(profile?.id, item.id);
    if (res.success) {
      playSound("success");
      if (item.category === "theme" || item.category === "frame" || item.priceGems >= 300) {
        triggerConfetti();
      }
      toast.success(res.message);
      setGamification(res.state);

      if (item.category === "frame") {
        await syncFrameToSupabase(item.id);
      } else if (item.category === "title") {
        await syncTitleToSupabase(item.id, item.name, item.description);
      }
    } else {
      playSound("error");
      toast.error(res.message);
    }
  };

  const handleEquip = async (item: ShopItem) => {
    if (item.category === "consumable") return;
    const isCurrentlyActive =
      (item.category === "theme" && gamification.activeTheme === item.id) ||
      (item.category === "frame" && gamification.activeAvatarFrame === item.id) ||
      (item.category === "title" && gamification.activeTitle === item.id);

    const targetId = isCurrentlyActive ? null : item.id;
    const newState = equipShopItem(profile?.id, item.category, targetId);
    playSound("click");
    toast.success(
      isCurrentlyActive ? `${item.name} retiré.` : `${item.name} équipé !`
    );
    setGamification(newState);

    if (item.category === "frame") {
      await syncFrameToSupabase(targetId);
    } else if (item.category === "title") {
      if (targetId) {
        await syncTitleToSupabase(item.id, item.name, item.description);
      } else if (profile?.id) {
        await supabase
          .from("user_titles")
          .update({ is_active: false })
          .eq("user_id", profile.id);

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("terracoast:profile_updated", { detail: { userId: profile.id } })
          );
        }
      }
    }
  };

  const filteredItems = SHOP_CATALOG.filter((it) => {
    if (category === "all") return true;
    return it.category === category;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xl">
              🛍️
            </div>
            <div>
              <h2 className="text-lg font-black leading-tight">Boutique TerraGems</h2>
              <p className="text-xs text-emerald-300 font-bold">
                Solde : 💎 {gamification.gems.toLocaleString()} Gems
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-xl text-xs font-bold border border-white/15">
              <span>🧊 {gamification.streakFreezes}</span>
              <span className="text-emerald-300">Gels</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 👑 Console Rapide Administrateur */}
        {/* Banner TerraDex */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 px-4 py-2 flex items-center justify-between text-white border-b border-indigo-800">
          <div className="flex items-center gap-2 text-xs font-black">
            <span>🎴</span>
            <span className="truncate">Nouveau : Boosters & Cartes TerraDex !</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/terradex");
            }}
            className="text-[11px] font-black bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
          >
            Explorer →
          </button>
        </div>

        {profile?.role === "admin" && (
          <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-b border-amber-200/80 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
              <span>👑</span>
              <span>Mode Admin :</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const s = adminGrantResources(profile?.id, { gemsDelta: 1000 });
                  playSound("success");
                  toast.success("+1 000 💎 ajoutées !");
                  setGamification(s);
                }}
                className="px-2.5 py-1 bg-sky-500 hover:bg-sky-600 text-white text-xs font-extrabold rounded-lg shadow-sm active:scale-95 transition-all"
              >
                +1 000 💎
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = adminGrantResources(profile?.id, { gemsDelta: 5000 });
                  playSound("success");
                  toast.success("+5 000 💎 ajoutées !");
                  setGamification(s);
                }}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold rounded-lg shadow-sm active:scale-95 transition-all"
              >
                +5 000 💎
              </button>

              <button
                type="button"
                onClick={() => {
                  const s = adminGrantResources(profile?.id, { streakFreezesDelta: 3 });
                  playSound("success");
                  toast.success("+3 Gels de Flamme 🧊 ajoutés !");
                  setGamification(s);
                }}
                className="px-2.5 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-extrabold rounded-lg shadow-sm active:scale-95 transition-all"
              >
                +3 🧊
              </button>
            </div>
          </div>
        )}

        {/* Categories Bar */}
        <div className="flex items-center gap-2 p-3 bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-none">
          {[
            { id: "all", label: "Tout" },
            { id: "consumable", label: "Boosters ⚡" },
            { id: "theme", label: "Thèmes Globe 🌍" },
            { id: "frame", label: "Cadres 🎨" },
            { id: "title", label: "Titres 👑" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                category === cat.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Scrollable list */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {filteredItems.map((item) => {
            const isOwned =
              (item.category === "theme" && gamification.inventory.themes.includes(item.id)) ||
              (item.category === "frame" && gamification.inventory.avatarFrames.includes(item.id)) ||
              (item.category === "title" && gamification.inventory.titles.includes(item.id));

            const isActive =
              (item.category === "theme" && gamification.activeTheme === item.id) ||
              (item.category === "frame" &&
                (gamification.activeAvatarFrame === item.id ||
                  (item.id === "frame_flame" && gamification.activeAvatarFrame === "flame") ||
                  (item.id === "frame_compass" && gamification.activeAvatarFrame === "compass") ||
                  (item.id === "frame_crown" && gamification.activeAvatarFrame === "crown"))) ||
              (item.category === "title" &&
                (gamification.activeTitle === item.id || gamification.activeTitle === item.name));

            const canAfford = gamification.gems >= item.priceGems;
            const isConsumable = item.category === "consumable";

            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl shrink-0 shadow-xs">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900 truncate">
                        {item.name}
                      </h4>
                      {item.badge && (
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {isConsumable ? (
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => handleBuy(item)}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                        canAfford
                          ? "btn-duo btn-duo-green"
                          : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                      }`}
                    >
                      {canAfford ? `${item.priceGems} 💎` : `Manque ${item.priceGems - gamification.gems} 💎`}
                    </button>
                  ) : isOwned ? (
                    <button
                      type="button"
                      onClick={() => handleEquip(item)}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                        isActive
                          ? "bg-emerald-600 text-white border-2 border-emerald-700"
                          : "btn-duo btn-duo-blue"
                      }`}
                    >
                      {isActive ? "Actif ✅" : "Équiper ⚡"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => handleBuy(item)}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                        canAfford
                          ? "btn-duo btn-duo-teal"
                          : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                      }`}
                    >
                      {canAfford ? `${item.priceGems} 💎` : `Manque ${item.priceGems - gamification.gems} 💎`}
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
