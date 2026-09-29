import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import {
  Users,
  Search,
  RotateCcw,
  Trash2,
  Shield,
  AlertTriangle,
  UserX,
  Edit2,
  Ban,
  Sparkles,
  X,
} from "lucide-react";
import {
  getPlayerGamificationState,
  adminGrantResources,
  getLeagueForXp,
} from "../../lib/gamificationManager";
import { adminUpdateUserXp } from "../../lib/queries/profileQueries";
import { toast } from "../common/ToastContainer";
import { playSound } from "../../lib/soundManager";
import type { Database } from "../../lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface UserManagementPageProps {
  onNavigate?: (view: string, data?: any) => void;
}

export function UserManagementPage({ onNavigate: _onNavigate }: UserManagementPageProps = {}) {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGrantingXp, setIsGrantingXp] = useState(false);
  const [sortBy, setSortBy] = useState<"level" | "xp" | "created" | "games">(
    "created"
  );
  const [filterBanned, setFilterBanned] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [banType, setBanType] = useState<"temporary" | "permanent">(
    "temporary"
  );
  const [banReason, setBanReason] = useState("");
  const [banUntilDate, setBanUntilDate] = useState("");
  const [newNickname, setNewNickname] = useState("");
  const [showGrantResourcesModal, setShowGrantResourcesModal] = useState(false);
  const [grantGemsAmount, setGrantGemsAmount] = useState("");
  const [grantXpAmount, setGrantXpAmount] = useState("");

  useEffect(() => {
    loadUsers();
  }, [sortBy, filterBanned]);

  const loadUsers = async () => {
    setLoading(true);
    let query = supabase.from("profiles").select("*");

    if (filterBanned) {
      query = query.eq("is_banned", true);
    }

    const { data } = await query
      .order(
        sortBy === "created"
          ? "created_at"
          : sortBy === "level"
          ? "level"
          : sortBy === "xp"
          ? "experience_points"
          : "level",
        { ascending: false }
      )
      .limit(100);

    if (data) setUsers(data);
    setLoading(false);
  };

  const searchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("pseudo", `%${query}%`)
      .limit(20);

    if (data) setSearchResults(data);
  };

  const forceNicknameChange = async () => {
    if (!selectedUser) return;

    if (newNickname.trim().length < 3) {
      alert("Le pseudo doit contenir au moins 3 caractères");
      return;
    }

    // Vérifier que le pseudo n'existe pas déjà
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("pseudo", newNickname.trim())
      .single();

    if (existingUser) {
      alert("Ce pseudo existe déjà");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ pseudo: newNickname.trim() })
      .eq("id", selectedUser.id);

    if (error) {
      alert(`Erreur: ${error.message}`);
      return;
    }

    // Créer une notification
    await supabase.from("notifications").insert({
      user_id: selectedUser.id,
      type: "warning",
      message: `Ton pseudo a été forcément changé en: ${newNickname.trim()}`,
    });

    alert(`Pseudo changé en ${newNickname.trim()} !`);
    setShowNicknameModal(false);
    setNewNickname("");
    setSelectedUser(null);
    loadUsers();
  };

  const applyBan = async () => {
    if (!selectedUser) return;

    if (!banReason.trim()) {
      alert("Tu dois indiquer une raison");
      return;
    }

    if (banType === "temporary" && !banUntilDate) {
      alert("Tu dois sélectionner une date d'expiration");
      return;
    }

    const updateData: any = {
      is_banned: true,
      ban_reason: banReason.trim(),
      banned_at: new Date().toISOString(),
    };

    if (banType === "temporary") {
      updateData.ban_until = new Date(banUntilDate).toISOString();
    } else {
      updateData.ban_until = null;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", selectedUser.id);

    if (error) {
      alert(`Erreur: ${error.message}`);
      return;
    }

    // Créer une notification
    let notificationMessage = "";
    if (banType === "temporary") {
      notificationMessage = `Ton compte a été banni temporairement jusqu'au ${new Date(
        banUntilDate
      ).toLocaleString()}. Raison: ${banReason.trim()}`;
    } else {
      notificationMessage = `Ton compte a été banni de manière permanente. Raison: ${banReason.trim()}`;
    }

    await supabase.from("notifications").insert({
      user_id: selectedUser.id,
      type: "warning",
      message: notificationMessage,
    });

    alert(
      banType === "temporary"
        ? "Utilisateur banni temporairement !"
        : "Utilisateur banni définitivement !"
    );
    setShowBanModal(false);
    setBanReason("");
    setBanUntilDate("");
    setBanType("temporary");
    setSelectedUser(null);
    loadUsers();
  };

  const toggleUserBan = async (userId: string, isBanned: boolean) => {
    if (isBanned) {
      // Débannir
      if (!confirm("Es-tu sûr de vouloir débannir cet utilisateur ?")) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          is_banned: false,
          ban_reason: null,
          ban_until: null,
          banned_at: null,
        })
        .eq("id", userId);

      if (error) {
        alert(`Erreur: ${error.message}`);
        return;
      }

      // Créer une notification
      const user = users.find((u) => u.id === userId);
      if (user) {
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "info",
          message:
            "Ton compte a été débanni ! Tu peux à nouveau accéder à la plateforme.",
        });
      }

      alert("Utilisateur débanni !");
    } else {
      // Bannir - ouvrir le modal
      const user = users.find((u) => u.id === userId);
      if (user) {
        setSelectedUser(user);
        setBanType("permanent");
        setBanReason("");
        setBanUntilDate("");
        setShowBanModal(true);
      }
    }

    loadUsers();
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";

    if (!confirm(`Changer le rôle à ${newRole} ?`)) return;

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      alert(`Erreur: ${error.message}`);
      return;
    }

    alert(`Rôle changé à ${newRole} !`);
    loadUsers();
  };

  const handleGrantXp = async (
    targetUser: Profile,
    options: { xpDelta?: number; setXp?: number }
  ) => {
    if (!targetUser?.id) return;
    setIsGrantingXp(true);
    try {
      const res = await adminUpdateUserXp(targetUser.id, options, targetUser);
      if (!res.success || !res.profile) {
        toast.error(`Erreur: ${res.error || "Impossible d'octroyer l'XP"}`);
        return;
      }

      const updatedUserObj = res.profile;
      setSelectedUser(updatedUserObj);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, ...updatedUserObj } : u))
      );
      setSearchResults((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, ...updatedUserObj } : u))
      );

      if (profile?.id === targetUser.id && refreshProfile) {
        await refreshProfile();
      }

      playSound("success");
      const delta = res.xpDelta ?? 0;
      if (options.setXp !== undefined) {
        toast.success(
          `XP de ${targetUser.pseudo} fixés à ${res.newXp} ⭐ (Niv. ${res.newLevel}) !`
        );
      } else {
        toast.success(
          `${delta >= 0 ? "+" : ""}${delta} XP octroyés à ${targetUser.pseudo} (Total: ${res.newXp} XP, Niv. ${res.newLevel}) !`
        );
      }
      setGrantXpAmount("");
    } catch (err: any) {
      toast.error(`Erreur inattendue: ${err.message}`);
    } finally {
      setIsGrantingXp(false);
    }
  };

  const resetUserStats = async (userId: string, userName: string) => {
    if (!confirm(`Réinitialiser les stats (XP et score) pour ${userName} ?`))
      return;

    const { error } = await supabase
      .from("profiles")
      .update({
        experience_points: 0,
        level: 1,
        monthly_score: 0,
        monthly_games_played: 0,
        current_streak: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      alert(`Erreur: ${error.message}`);
      return;
    }

    adminGrantResources(userId, { setXp: 0 });
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("terracoast:profile_updated", { detail: { userId, newXp: 0, newLevel: 1 } })
      );
    }
    if (profile?.id === userId && refreshProfile) {
      await refreshProfile();
    }

    alert(`Stats réinitialisées pour ${userName} !`);
    loadUsers();
  };

  const deleteUserAccount = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Es-tu sûr de vouloir SUPPRIMER le compte de ${userName} ? Cette action est irréversible !`
      )
    )
      return;

    const confirmDelete = prompt(
      `Tape "${userName}" pour confirmer la suppression:`
    );
    if (confirmDelete !== userName) {
      alert("Suppression annulée");
      return;
    }

    try {
      // Nettoyage des tables non critiques avant suppression du profil.
      // Les tables avec FK ON DELETE CASCADE seront automatiquement nettoyées
      // lors de la suppression de `profiles`.
      await supabase.from("notifications").delete().eq("user_id", userId);
      await supabase
        .from("chat_messages")
        .delete()
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);
      await supabase
        .from("monthly_rankings_history")
        .delete()
        .eq("user_id", userId);

      // Suppression principale du profil (source de vérité)
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (profileError) {
        console.error("Erreur suppression profil:", profileError);
        alert(
          `Suppression impossible: ${profileError.message}\n\n` +
            "Vérifie que la migration de policy DELETE admin a bien été appliquée."
        );
        return;
      }

      // Mise à jour instantanée de l'UI
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));

      alert(`Compte de ${userName} supprimé avec succès !`);
      loadUsers();
    } catch (error: any) {
      console.error("Erreur complète:", error);
      alert(`Erreur lors de la suppression: ${error.message}`);
    }
  };

  if (profile?.role !== "admin") {
    return (
      <div className="w-full px-1 py-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Accès refusé
          </h2>
          <p className="text-gray-600">
            Tu dois être administrateur pour accéder à cette page
          </p>
        </div>
      </div>
    );
  }

  const displayUsers = searchTerm.trim().length >= 2 ? searchResults : users;

  return (
    <div className="w-full px-1 py-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
          <Users className="w-10 h-10 mr-3 text-emerald-600" />
          Gestion des utilisateurs
        </h1>
        <p className="text-gray-600">
          Gère les utilisateurs, leurs statistiques et permissions
        </p>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher un utilisateur
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cherche par pseudo..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchUsers(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trier par
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value="created">Date de création</option>
                <option value="level">Niveau</option>
                <option value="xp">Expérience</option>
                <option value="games">Parties jouées</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterBanned}
                  onChange={(e) => setFilterBanned(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Montrer que les bannis
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : displayUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucun utilisateur trouvé
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Pseudo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Niveau
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    XP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/profile/${user.id}`)}
                        className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        {user.pseudo}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-emerald-600">
                        {user.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">
                        {user.experience_points}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {user.role === "admin" ? "Admin" : "Utilisateur"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_banned ? (
                        <div>
                          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 mb-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Banni</span>
                          </span>
                          {user.ban_until && (
                            <p className="text-xs text-gray-500 mt-1">
                              Jusqu'au:{" "}
                              {new Date(user.ban_until).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <span>✓</span>
                          <span>Actif</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">

                        {/* Bouton Rôle */}
                        <button
                          onClick={() => toggleUserRole(user.id, user.role)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.role === "admin"
                              ? "text-red-600 hover:bg-red-50"
                              : "text-blue-600 hover:bg-blue-50"
                          }`}
                          title={
                            user.role === "admin"
                              ? "Retirer admin"
                              : "Promouvoir admin"
                          }
                        >
                          <Shield className="w-4 h-4" />
                        </button>

                        {/* Bouton Changer pseudo */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setNewNickname("");
                            setShowNicknameModal(true);
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Forcer changement de pseudo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Bouton Reset Stats */}
                        <button
                          onClick={() => resetUserStats(user.id, user.pseudo)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Réinitialiser XP et Score"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        {/* Bouton Octroyer Gemmes & Cœurs */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setGrantGemsAmount("");
                            setGrantLivesAmount("");
                            setShowGrantResourcesModal(true);
                          }}
                          className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="Octroyer Gemmes & Cœurs 💎❤️"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>

                        {/* Bouton Ban */}
                        <button
                          onClick={() =>
                            toggleUserBan(user.id, user.is_banned || false)
                          }
                          className={`p-2 rounded-lg transition-colors ${
                            user.is_banned
                              ? "text-green-600 hover:bg-green-50"
                              : "text-orange-600 hover:bg-orange-50"
                          }`}
                          title={user.is_banned ? "Débannir" : "Bannir"}
                        >
                          {user.is_banned ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <Ban className="w-4 h-4" />
                          )}
                        </button>
                        {/* Bouton Supprimer */}
                        <button
                          onClick={() =>
                            deleteUserAccount(user.id, user.pseudo)
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer le compte"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Ban */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Bannir {selectedUser.pseudo}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de ban
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="temporary"
                      checked={banType === "temporary"}
                      onChange={() => setBanType("temporary")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">
                      Ban temporaire
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="permanent"
                      checked={banType === "permanent"}
                      onChange={() => setBanType("permanent")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Ban permanent</span>
                  </label>
                </div>
              </div>

              {banType === "temporary" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'expiration
                  </label>
                  <input
                    type="datetime-local"
                    value={banUntilDate}
                    onChange={(e) => setBanUntilDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison du ban
                </label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Ex: Spam dans le chat..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason("");
                  setBanUntilDate("");
                  setBanType("temporary");
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={applyBan}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Bannir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Changement Pseudo */}
      {showNicknameModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Changer le pseudo
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Pseudo actuel:{" "}
              <span className="font-semibold">{selectedUser.pseudo}</span>
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau pseudo
              </label>
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="Nouveau pseudo..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-2">Minimum 3 caractères</p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowNicknameModal(false);
                  setNewNickname("");
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={forceNicknameChange}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Changer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Octroi de Gemmes & Vies */}
      {showGrantResourcesModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 relative border-2 border-slate-200">
            <button
              onClick={() => {
                setShowGrantResourcesModal(false);
                setSelectedUser(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl">
                💎
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight">
                  Octroyer des Ressources
                </h3>
                <p className="text-xs text-slate-500 font-bold">
                  Compte cible : <span className="text-emerald-600 font-black">{selectedUser.pseudo}</span> ({selectedUser.role || "user"})
                </p>
              </div>
            </div>

            {/* Solde actuel de l'utilisateur ciblé */}
            {(() => {
              const uState = getPlayerGamificationState(selectedUser.id);
              const userLeague = getLeagueForXp(selectedUser.experience_points || 0);
              return (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Niveau & Ligue</p>
                    <p className="text-sm font-black text-amber-600 truncate">
                      Niv. {selectedUser.level || 1} • {userLeague.icon} {userLeague.name}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Expérience (XP)</p>
                    <p className="text-sm font-black text-amber-500">
                      {(selectedUser.experience_points || 0).toLocaleString()} ⭐
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">TerraGems 💎</p>
                    <p className="text-sm font-black text-sky-600">{uState.gems.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-xs">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Gels 🧊</p>
                    <p className="text-sm font-black text-cyan-600">{uState.streakFreezes || 0}</p>
                  </div>
                </div>
              );
            })()}

            {/* Actions rapides XP */}
            <p className="text-xs font-black uppercase tracking-wider text-amber-700 mb-1.5 flex items-center justify-between">
              <span>⭐ Octroi Rapide d'XP (Niveaux & Ligues)</span>
              {isGrantingXp && <span className="text-[11px] text-amber-600 animate-pulse">Mise à jour en cours...</span>}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              <button
                type="button"
                disabled={isGrantingXp}
                onClick={() => handleGrantXp(selectedUser, { xpDelta: 250 })}
                className="py-2 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-black rounded-xl border border-amber-300 shadow-sm transition-all disabled:opacity-50 active:scale-95"
              >
                +250 XP ⭐
              </button>
              <button
                type="button"
                disabled={isGrantingXp}
                onClick={() => handleGrantXp(selectedUser, { xpDelta: 1000 })}
                className="py-2 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-black rounded-xl border border-amber-300 shadow-sm transition-all disabled:opacity-50 active:scale-95"
              >
                +1 000 XP ⭐
              </button>
              <button
                type="button"
                disabled={isGrantingXp}
                onClick={() => handleGrantXp(selectedUser, { xpDelta: 5000 })}
                className="py-2 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-black rounded-xl border border-amber-300 shadow-sm transition-all disabled:opacity-50 active:scale-95"
              >
                +5 000 XP 🌟
              </button>
              <button
                type="button"
                disabled={isGrantingXp}
                onClick={() => handleGrantXp(selectedUser, { xpDelta: 10000 })}
                className="py-2 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-black rounded-xl border border-amber-300 shadow-sm transition-all disabled:opacity-50 active:scale-95"
              >
                +10 000 XP 🚀
              </button>
            </div>

            {/* Actions rapides Gems */}
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
              💎 Octroi Rapide de TerraGems & Gels
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  adminGrantResources(selectedUser.id, { gemsDelta: 500 });
                  playSound("success");
                  toast.success(`+500 💎 octroyées à ${selectedUser.pseudo} !`);
                  setSelectedUser({ ...selectedUser });
                }}
                className="py-2 px-2 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-black rounded-xl border border-sky-300 shadow-sm transition-all"
              >
                +500 💎
              </button>

              <button
                type="button"
                onClick={() => {
                  adminGrantResources(selectedUser.id, { gemsDelta: 2500 });
                  playSound("success");
                  toast.success(`+2 500 💎 octroyées à ${selectedUser.pseudo} !`);
                  setSelectedUser({ ...selectedUser });
                }}
                className="py-2 px-2 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-black rounded-xl border border-sky-300 shadow-sm transition-all"
              >
                +2 500 💎
              </button>

              <button
                type="button"
                onClick={() => {
                  adminGrantResources(selectedUser.id, { gemsDelta: 10000 });
                  playSound("success");
                  toast.success(`+10 000 💎 octroyées à ${selectedUser.pseudo} !`);
                  setSelectedUser({ ...selectedUser });
                }}
                className="py-2 px-2 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-black rounded-xl border border-sky-300 shadow-sm transition-all"
              >
                +10 000 💎
              </button>

              <button
                type="button"
                onClick={() => {
                  adminGrantResources(selectedUser.id, { streakFreezesDelta: 3 });
                  playSound("success");
                  toast.success(`+3 Gels 🧊 octroyés à ${selectedUser.pseudo} !`);
                  setSelectedUser({ ...selectedUser });
                }}
                className="py-2 px-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-black rounded-xl border border-cyan-300 shadow-sm transition-all"
              >
                +3 Gels 🧊
              </button>
            </div>

            {/* Formulaires Montants Libres */}
            <div className="space-y-3 pt-3 border-t border-slate-200 mb-5">
              {/* Formulaire XP Libre */}
              <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-200">
                <label className="block text-xs font-black text-amber-900 mb-1">
                  ⭐ Points d'Expérience Personnalisés (XP)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Points d'XP (ex: 750)..."
                    value={grantXpAmount}
                    disabled={isGrantingXp}
                    onChange={(e) => setGrantXpAmount(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-amber-300 outline-none focus:border-amber-500 bg-white"
                  />
                  <button
                    type="button"
                    disabled={isGrantingXp}
                    onClick={() => {
                      const val = parseInt(grantXpAmount, 10);
                      if (!isNaN(val) && val !== 0) {
                        handleGrantXp(selectedUser, { xpDelta: val });
                      }
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl whitespace-nowrap active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {isGrantingXp ? "..." : "+ Ajouter XP"}
                  </button>
                  <button
                    type="button"
                    disabled={isGrantingXp}
                    onClick={() => {
                      const val = parseInt(grantXpAmount, 10);
                      if (!isNaN(val) && val >= 0) {
                        handleGrantXp(selectedUser, { setXp: val });
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl whitespace-nowrap active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {isGrantingXp ? "..." : "= Fixer XP"}
                  </button>
                </div>
              </div>

              {/* Formulaire Gems Libre */}
              <div className="bg-sky-50/40 p-2.5 rounded-xl border border-sky-200">
                <label className="block text-xs font-black text-slate-700 mb-1">
                  💎 Gemmes Personnalisées
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Montant..."
                    value={grantGemsAmount}
                    onChange={(e) => setGrantGemsAmount(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 outline-none focus:border-sky-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = parseInt(grantGemsAmount, 10);
                      if (!isNaN(val) && val !== 0) {
                        adminGrantResources(selectedUser.id, { gemsDelta: val });
                        playSound("success");
                        toast.success(`${val >= 0 ? "+" : ""}${val} 💎 ajoutées !`);
                        setGrantGemsAmount("");
                        setSelectedUser({ ...selectedUser });
                      }
                    }}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs rounded-xl whitespace-nowrap active:scale-95 transition-all"
                  >
                    + Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const val = parseInt(grantGemsAmount, 10);
                      if (!isNaN(val) && val >= 0) {
                        adminGrantResources(selectedUser.id, { setGems: val });
                        playSound("success");
                        toast.success(`Solde fixé à ${val} 💎 !`);
                        setGrantGemsAmount("");
                        setSelectedUser({ ...selectedUser });
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-xl whitespace-nowrap active:scale-95 transition-all"
                  >
                    = Fixer
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowGrantResourcesModal(false);
                setSelectedUser(null);
              }}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
