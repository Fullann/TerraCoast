import { useEffect, useMemo, useState } from "react";
import { MessageSquareQuote, Plus, Edit, Trash2, Check, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Database } from "../../lib/database.types";

type LandingTestimonial = Database["public"]["Tables"]["landing_testimonials"]["Row"];

const EMPTY_FORM = {
  name: "",
  role: "",
  text: "",
};

export function HomepageTestimonialsManagementPage() {
  const [testimonials, setTestimonials] = useState<LandingTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<LandingTestimonial | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    loadTestimonials();
  }, []);

  const nextPosition = useMemo(() => {
    if (testimonials.length === 0) return 1;
    return Math.max(...testimonials.map((item) => item.position)) + 1;
  }, [testimonials]);

  const loadTestimonials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("landing_testimonials")
      .select("*")
      .order("position", { ascending: true });

    if (error) {
      alert("Erreur lors du chargement des testimonials");
      setLoading(false);
      return;
    }

    setTestimonials(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setShowCreateModal(false);
    setEditingTestimonial(null);
    setFormData(EMPTY_FORM);
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.role.trim() || !formData.text.trim()) {
      alert("Tous les champs sont requis");
      return;
    }

    const { error } = await supabase.from("landing_testimonials").insert({
      name: formData.name.trim(),
      role: formData.role.trim(),
      text: formData.text.trim(),
      position: nextPosition,
      is_active: true,
    });

    if (error) {
      alert("Erreur lors de la création");
      return;
    }

    resetForm();
    loadTestimonials();
  };

  const handleUpdate = async () => {
    if (!editingTestimonial) return;
    if (!formData.name.trim() || !formData.role.trim() || !formData.text.trim()) {
      alert("Tous les champs sont requis");
      return;
    }

    const { error } = await supabase
      .from("landing_testimonials")
      .update({
        name: formData.name.trim(),
        role: formData.role.trim(),
        text: formData.text.trim(),
      })
      .eq("id", editingTestimonial.id);

    if (error) {
      alert("Erreur lors de la mise à jour");
      return;
    }

    resetForm();
    loadTestimonials();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer le testimonial de "${name}" ?`)) return;
    const { error } = await supabase.from("landing_testimonials").delete().eq("id", id);
    if (error) {
      alert("Erreur lors de la suppression");
      return;
    }
    loadTestimonials();
  };

  const toggleActive = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from("landing_testimonials")
      .update({ is_active: !currentValue })
      .eq("id", id);
    if (error) {
      alert("Erreur lors de la mise à jour du statut");
      return;
    }
    loadTestimonials();
  };

  const openEditModal = (item: LandingTestimonial) => {
    setEditingTestimonial(item);
    setFormData({
      name: item.name,
      role: item.role,
      text: item.text,
    });
  };

  const moveItem = async (item: LandingTestimonial, direction: "up" | "down") => {
    const index = testimonials.findIndex((row) => row.id === item.id);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= testimonials.length) return;

    const target = testimonials[targetIndex];

    const firstUpdate = await supabase
      .from("landing_testimonials")
      .update({ position: -1 })
      .eq("id", item.id);
    if (firstUpdate.error) {
      alert("Impossible de réordonner");
      return;
    }

    const secondUpdate = await supabase
      .from("landing_testimonials")
      .update({ position: item.position })
      .eq("id", target.id);
    if (secondUpdate.error) {
      alert("Impossible de réordonner");
      return;
    }

    const thirdUpdate = await supabase
      .from("landing_testimonials")
      .update({ position: target.position })
      .eq("id", item.id);
    if (thirdUpdate.error) {
      alert("Impossible de réordonner");
      return;
    }

    loadTestimonials();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <MessageSquareQuote className="w-10 h-10 mr-3 text-emerald-600" />
          Testimonials homepage
        </h1>
        <p className="text-gray-600">
          Modifiez les avis affichés sur la page d&apos;accueil publique.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouveau testimonial
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
          Chargement...
        </div>
      ) : testimonials.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <MessageSquareQuote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Aucun testimonial</p>
        </div>
      ) : (
        <div className="space-y-4">
          {testimonials.map((item, index) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl shadow-md p-5 border-2 ${
                item.is_active ? "border-gray-200" : "border-gray-300 opacity-60"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-[240px]">
                  <p className="text-sm text-gray-500 mb-1">Position #{item.position}</p>
                  <p className="text-xl font-bold text-gray-900">{item.name}</p>
                  <p className="text-sm text-emerald-700 font-medium">{item.role}</p>
                  <p className="text-gray-700 mt-3">"{item.text}"</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveItem(item, "up")}
                    disabled={index === 0}
                    className="px-2 py-1 rounded bg-gray-100 text-gray-700 disabled:opacity-50"
                    title="Monter"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveItem(item, "down")}
                    disabled={index === testimonials.length - 1}
                    className="px-2 py-1 rounded bg-gray-100 text-gray-700 disabled:opacity-50"
                    title="Descendre"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleActive(item.id, item.is_active)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.is_active
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {item.is_active ? "Actif" : "Inactif"}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showCreateModal || editingTestimonial) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {editingTestimonial ? "Modifier le testimonial" : "Nouveau testimonial"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Ex: Lina"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Ex: Joueuse quotidienne"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texte *</label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData((prev) => ({ ...prev, text: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
                  rows={4}
                  placeholder="Le texte du testimonial..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors flex items-center justify-center"
              >
                <X className="w-5 h-5 mr-2" />
                Annuler
              </button>
              <button
                onClick={editingTestimonial ? handleUpdate : handleCreate}
                disabled={!formData.name.trim() || !formData.role.trim() || !formData.text.trim()}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Check className="w-5 h-5 mr-2" />
                {editingTestimonial ? "Mettre à jour" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
