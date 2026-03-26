import { useCallback, useEffect, useState, useMemo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { Map, Trash2, CheckCircle, Upload, Shield } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import {
  analyzeCustomGeoJsonText,
  getZoneIdFromRsmGeography,
  presetFromRowPreset,
  slugifyGeoMapName,
  type CustomGeoJsonMapRow,
} from "../../lib/customGeojsonMaps";

type DraftAnalysis = ReturnType<typeof analyzeCustomGeoJsonText>;

export function GeoJsonMapsManagementPage() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<CustomGeoJsonMapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fileText, setFileText] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftSlug, setDraftSlug] = useState("");
  const [draftIdProperty, setDraftIdProperty] = useState("tc_id");
  const [draftCenterLat, setDraftCenterLat] = useState(20);
  const [draftCenterLng, setDraftCenterLng] = useState(0);
  const [draftZoom, setDraftZoom] = useState(2);
  const [analysis, setAnalysis] = useState<DraftAnalysis | null>(null);
  const [draftFeatureLabels, setDraftFeatureLabels] = useState<Record<string, string>>(
    {}
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadRows = useCallback(async () => {
    const { data } = await supabase
      .from("geojson_custom_maps")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data || []) as CustomGeoJsonMapRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (profile?.role === "admin") loadRows();
  }, [profile, loadRows]);

  const resetDraft = () => {
    setFileText(null);
    setDraftName("");
    setDraftSlug("");
    setDraftIdProperty("tc_id");
    setDraftCenterLat(20);
    setDraftCenterLng(0);
    setDraftZoom(2);
    setAnalysis(null);
    setDraftFeatureLabels({});
    setMessage("");
  };

  const runAnalysis = useCallback(
    (text: string, idProp: string) => {
      const a = analyzeCustomGeoJsonText(text, idProp);
      setAnalysis(a);
      if (!a.error) {
        setDraftCenterLat(a.preset.centerLat);
        setDraftCenterLng(a.preset.centerLng);
        setDraftZoom(a.preset.zoom);
      }
    },
    []
  );

  const onFile = async (file: File) => {
    setMessage("");
    const text = await file.text();
    setFileText(text);
    setDraftFeatureLabels({});
    runAnalysis(text, draftIdProperty);
  };

  useEffect(() => {
    if (fileText) runAnalysis(fileText, draftIdProperty);
  }, [draftIdProperty, fileText, runAnalysis]);

  useEffect(() => {
    if (fileText) setDraftFeatureLabels({});
  }, [draftIdProperty, fileText]);

  useEffect(() => {
    if (draftName && !draftSlug) {
      setDraftSlug(slugifyGeoMapName(draftName));
    }
  }, [draftName, draftSlug]);

  const saveDraftUpload = async () => {
    if (!profile?.id) {
      setMessage(
        "Impossible d’enregistrer : session ou profil non chargé. Rechargez la page ou reconnectez-vous."
      );
      return;
    }
    if (!fileText || !analysis || analysis.error) {
      setMessage("Fichier GeoJSON invalide ou non analysé.");
      return;
    }
    const name = draftName.trim();
    const slug = draftSlug.trim().toLowerCase();
    if (!name || !slug) {
      setMessage("Nom et identifiant URL (slug) sont obligatoires.");
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setMessage(
        "Slug invalide : minuscules, chiffres et tirets uniquement (ex. ma-carte-region)."
      );
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const id = crypto.randomUUID();
      const storagePath = `${id}.geojson`;
      const blob = new Blob([fileText], { type: "application/geo+json" });
      const file = new File([blob], `${slug}.geojson`, { type: "application/geo+json" });

      const { error: upErr } = await supabase.storage
        .from("custom-geojson")
        .upload(storagePath, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from("custom-geojson").getPublicUrl(storagePath);

      const preset: Record<string, unknown> = {
        centerLat: draftCenterLat,
        centerLng: draftCenterLng,
        zoom: Math.max(1, Math.min(8, draftZoom)),
        idProperty: draftIdProperty.trim() || "tc_id",
      };
      if (Object.keys(draftFeatureLabels).length > 0) {
        preset.featureLabels = draftFeatureLabels;
      }

      const insertPayload = {
        id,
        name,
        slug,
        description: null as string | null,
        storage_path: storagePath,
        public_url: publicUrl,
        file_size_bytes: new Blob([fileText]).size,
        feature_count: analysis.featureCount,
        bbox: analysis.bbox,
        preset,
        status: "pending" as const,
        created_by: profile.id,
      };
      const { error: insErr } = await (supabase as any)
        .from("geojson_custom_maps")
        .insert(insertPayload);
      if (insErr) throw insErr;

      try {
        await (supabase as any).rpc("log_admin_event", {
          p_action: "geojson_map_upload_pending",
          p_entity_type: "geojson_custom_maps",
          p_entity_id: id,
          p_details: { slug, name, feature_count: analysis.featureCount },
        });
      } catch {
        /* journalisation optionnelle */
      }

      resetDraft();
      await loadRows();
      setMessage("Carte enregistrée en brouillon. Vous pouvez la prévisualiser puis l’approuver.");
    } catch (e: unknown) {
      const err = e as { message?: string; details?: string; hint?: string };
      const detail = [err?.message, err?.details, err?.hint].filter(Boolean).join(" — ");
      setMessage(detail || String(e) || "Erreur à l’enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const approveRow = async (row: CustomGeoJsonMapRow) => {
    if (!profile?.id) return;
    if (!confirm(`Approuver la carte « ${row.name} » ? Elle sera utilisable par tous.`)) return;
    const { error } = await (supabase as any)
      .from("geojson_custom_maps")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (error) {
      alert(error.message);
      return;
    }
    try {
      await (supabase as any).rpc("log_admin_event", {
        p_action: "geojson_map_approved",
        p_entity_type: "geojson_custom_maps",
        p_entity_id: row.id,
        p_details: { slug: row.slug },
      });
    } catch {
      /* */
    }
    loadRows();
  };

  const deleteRow = async (row: CustomGeoJsonMapRow) => {
    if (!confirm(`Supprimer définitivement « ${row.name} » (fichier + métadonnées) ?`)) return;
    await supabase.storage.from("custom-geojson").remove([row.storage_path]);
    const { error } = await supabase.from("geojson_custom_maps").delete().eq("id", row.id);
    if (error) {
      alert(error.message);
      return;
    }
    try {
      await (supabase as any).rpc("log_admin_event", {
        p_action: "geojson_map_deleted",
        p_entity_type: "geojson_custom_maps",
        p_entity_id: row.id,
        p_details: { slug: row.slug },
      });
    } catch {
      /* */
    }
    loadRows();
  };

  const updatePreset = async (
    row: CustomGeoJsonMapRow,
    preset: Record<string, unknown>
  ): Promise<boolean> => {
    const { error, data } = await (supabase as any)
      .from("geojson_custom_maps")
      .update({ preset, updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .select("id");
    if (error) {
      const msg = [error.message, (error as { details?: string }).details]
        .filter(Boolean)
        .join(" — ");
      alert(msg || "Erreur lors de la mise à jour du preset.");
      return false;
    }
    if (!data?.length) {
      alert(
        "Aucune ligne mise à jour (droits insuffisants ou carte introuvable). Vérifiez que vous êtes admin et que la migration Supabase est appliquée."
      );
      return false;
    }
    await loadRows();
    return true;
  };

  if (profile?.role !== "admin") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès refusé</h2>
        </div>
      </div>
    );
  }

  const previewFc = analysis && !analysis.error ? analysis.featureCollection : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Map className="w-10 h-10 text-emerald-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Cartes GeoJSON</h1>
          <p className="text-gray-600 text-sm mt-1">
            Importez un fichier, vérifiez l’aperçu,{" "}
            <strong>cliquez sur chaque zone</strong> pour lui donner un nom affiché (liste des
            quiz / joueurs), ajustez le preset (centre, zoom, propriété d’id{" "}
            <code className="bg-gray-100 px-1 rounded">tc_id</code> recommandée), puis
            enregistrez. Après approbation, la carte est disponible pour tous les créateurs de
            quiz (puzzle / clic carte).
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Nouveau fichier
        </h2>
        <div className="space-y-4">
          <input
            type="file"
            accept=".geojson,.json,application/geo+json,application/json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
            className="block w-full text-sm text-gray-600"
          />
          {analysis?.warnings?.length ? (
            <ul className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 list-disc pl-4">
              {analysis.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          ) : null}
          {analysis?.error && (
            <p className="text-sm text-red-600">{analysis.error}</p>
          )}
          {previewFc && analysis && previewFc.features.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden p-3 space-y-2 bg-white">
              <p className="text-xs text-gray-500 px-1">
                Aperçu — {analysis.featureCount} entité(s)
                {analysis.bbox
                  ? ` — bbox [${analysis.bbox.map((n) => n.toFixed(2)).join(", ")}]`
                  : ""}
              </p>
              <GeoJsonInteractiveNameMap
                geography={previewFc as unknown as object}
                centerLat={draftCenterLat}
                centerLng={draftCenterLng}
                zoom={Math.max(1, Math.min(8, draftZoom))}
                idProperty={draftIdProperty.trim() || "tc_id"}
                featureLabels={draftFeatureLabels}
                onFeatureLabelsChange={setDraftFeatureLabels}
                summaries={analysis.featureSummaries}
              />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom affiché</label>
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Ex. Régions viticoles"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Slug (URL, minuscules, tirets)
              </label>
              <input
                value={draftSlug}
                onChange={(e) => setDraftSlug(slugifyGeoMapName(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="ex-regions-viticoles"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Propriété d’identifiant unique (chaque entité)
              </label>
              <input
                value={draftIdProperty}
                onChange={(e) => setDraftIdProperty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="tc_id"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Centre lat</label>
              <input
                type="number"
                value={draftCenterLat}
                onChange={(e) => setDraftCenterLat(Number(e.target.value))}
                className="w-full px-2 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Centre lng</label>
              <input
                type="number"
                value={draftCenterLng}
                onChange={(e) => setDraftCenterLng(Number(e.target.value))}
                className="w-full px-2 py-1 border rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Zoom (1–8)</label>
              <input
                type="number"
                min={1}
                max={8}
                step={0.1}
                value={draftZoom}
                onChange={(e) => setDraftZoom(Number(e.target.value))}
                className="w-full px-2 py-1 border rounded"
              />
            </div>
          </div>
          {message && (
            <p
              className={`text-sm rounded-lg px-2 py-1 border ${
                message.includes("Impossible") ||
                message.includes("invalide") ||
                message.includes("Erreur") ||
                message.includes("Slug")
                  ? "text-red-800 bg-red-50 border-red-200"
                  : "text-emerald-800 bg-emerald-50 border-emerald-100"
              }`}
            >
              {message}
            </p>
          )}
          {(saving || !fileText || !!analysis?.error) && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
              {!fileText && "Choisissez d’abord un fichier .geojson."}
              {fileText && analysis?.error && `Analyse : ${analysis.error}`}
              {fileText && analysis && !analysis.error && saving && "Envoi en cours…"}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving || !fileText || !!analysis?.error}
              onClick={() => void saveDraftUpload()}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Envoi…" : "Enregistrer en brouillon"}
            </button>
            <button
              type="button"
              onClick={resetDraft}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Catalogue</h2>
        {loading ? (
          <p className="text-gray-500">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="text-gray-500">Aucune carte.</p>
        ) : (
          <ul className="space-y-4">
            {rows.map((row) => (
              <li
                key={row.id}
                className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{row.name}</p>
                    <p className="text-xs text-gray-500">
                      {row.slug} · {row.feature_count} entités ·{" "}
                      <span
                        className={
                          row.status === "approved"
                            ? "text-emerald-600"
                            : row.status === "pending"
                            ? "text-amber-600"
                            : "text-red-600"
                        }
                      >
                        {row.status}
                      </span>
                    </p>
                    <a
                      href={row.public_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline break-all"
                    >
                      {row.public_url}
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {row.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => approveRow(row)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approuver
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteRow(row)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                </div>
                <RowPresetEditor
                  key={row.id}
                  row={row}
                  onSave={(preset) => updatePreset(row, preset)}
                />
                <CatalogueRowFeatureLabelsEditor
                  row={row}
                  onSavePreset={(preset) => updatePreset(row, preset)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function GeoJsonInteractiveNameMap({
  geography,
  centerLat,
  centerLng,
  zoom,
  idProperty,
  featureLabels,
  onFeatureLabelsChange,
  summaries,
}: {
  geography: object;
  centerLat: number;
  centerLng: number;
  zoom: number;
  idProperty: string;
  featureLabels: Record<string, string>;
  onFeatureLabelsChange: (next: Record<string, string>) => void;
  summaries: { id: string; label: string }[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [nameSavedHint, setNameSavedHint] = useState<string | null>(null);

  const selectZone = (zid: string) => {
    if (!zid) return;
    setSelectedId(zid);
    const def = summaries.find((s) => s.id === zid)?.label || "";
    setNameInput(featureLabels[zid] ?? def);
  };

  useEffect(() => {
    if (!selectedId) return;
    const def = summaries.find((s) => s.id === selectedId)?.label || "";
    setNameInput(featureLabels[selectedId] ?? def);
  }, [selectedId, featureLabels, summaries]);

  const applyName = () => {
    if (!selectedId) return;
    const trimmed = nameInput.trim();
    const next = { ...featureLabels };
    if (!trimmed) delete next[selectedId];
    else next[selectedId] = trimmed;
    onFeatureLabelsChange(next);
    setNameSavedHint(
      trimmed
        ? `« ${trimmed} » enregistré pour la zone ${selectedId} (pensez à enregistrer le brouillon ou le preset en base).`
        : `Nom personnalisé effacé pour ${selectedId}.`
    );
    window.setTimeout(() => setNameSavedHint(null), 5000);
  };

  const z = Math.max(1, Math.min(8, zoom));

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-600">
        Cliquez sur une partie de la carte, saisissez son nom affiché, puis « Enregistrer ce nom
        ». Les zones déjà nommées apparaissent en vert plus clair.
      </p>
      <div className="rounded border border-gray-200 overflow-hidden bg-white">
        <ComposableMap projection="geoMercator" style={{ width: "100%", height: 320 }}>
          <ZoomableGroup center={[centerLng, centerLat]} zoom={z}>
            <Geographies geography={geography}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const zid = getZoneIdFromRsmGeography(geo, idProperty);
                  const hasLabel = Boolean(zid && featureLabels[zid]);
                  const isSel = Boolean(zid && selectedId === zid);
                  const fill = !zid
                    ? "#E5E7EB"
                    : isSel
                    ? "#86EFAC"
                    : hasLabel
                    ? "#BBF7D0"
                    : "#E5E7EB";
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={(e: { stopPropagation?: () => void }) => {
                        e.stopPropagation?.();
                        if (zid) selectZone(zid);
                      }}
                      style={{
                        default: {
                          fill,
                          stroke: isSel ? "#059669" : "#6B7280",
                          strokeWidth: isSel ? 1.2 : 0.45,
                          outline: "none",
                          cursor: zid ? "pointer" : "default",
                        },
                        hover: {
                          fill: zid ? (isSel ? "#4ADE80" : "#D1D5DB") : "#E5E7EB",
                          stroke: "#4B5563",
                          strokeWidth: 0.55,
                          outline: "none",
                          cursor: zid ? "pointer" : "default",
                        },
                        pressed: {
                          fill: zid ? "#4ADE80" : "#E5E7EB",
                          outline: "none",
                          cursor: zid ? "pointer" : "default",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>
      {selectedId && (
        <div className="flex flex-wrap items-end gap-2 p-3 bg-sky-50 border border-sky-200 rounded-lg">
          <div className="min-w-[140px]">
            <span className="text-xs font-medium text-gray-600 block mb-0.5">
              Identifiant zone
            </span>
            <code className="text-sm text-gray-900 bg-white px-2 py-1 rounded border border-gray-200">
              {selectedId}
            </code>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-gray-600 block mb-0.5">
              Nom affiché
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyName();
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Ex. Région des lacs"
            />
          </div>
          <button
            type="button"
            onClick={() => applyName()}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium shrink-0"
          >
            Enregistrer ce nom
          </button>
        </div>
      )}
      {nameSavedHint && (
        <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1.5">
          {nameSavedHint}
        </p>
      )}
    </div>
  );
}

function CatalogueRowFeatureLabelsEditor({
  row,
  onSavePreset,
}: {
  row: CustomGeoJsonMapRow;
  onSavePreset: (preset: Record<string, unknown>) => Promise<boolean>;
}) {
  const presetKey = useMemo(() => JSON.stringify(row.preset), [row.preset]);
  const [fcData, setFcData] = useState<{
    fc: object;
    summaries: { id: string; label: string }[];
  } | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [savingNames, setSavingNames] = useState(false);
  const [namesFeedback, setNamesFeedback] = useState<string | null>(null);

  useEffect(() => {
    setLabels(presetFromRowPreset(row.preset).featureLabels || {});
  }, [row.id, presetKey]);

  useEffect(() => {
    let cancelled = false;
    setLoadErr("");
    setFcData(null);
    fetch(row.public_url)
      .then((r) => r.text())
      .then((text) => {
        if (cancelled) return;
        const idProp = presetFromRowPreset(row.preset).idProperty;
        const a = analyzeCustomGeoJsonText(text, idProp);
        if (a.error) {
          setLoadErr(a.error);
          return;
        }
        setFcData({
          fc: a.featureCollection as unknown as object,
          summaries: a.featureSummaries,
        });
      })
      .catch(() => {
        if (!cancelled) setLoadErr("Impossible de charger le fichier.");
      });
    return () => {
      cancelled = true;
    };
  }, [row.public_url, row.preset]);

  if (!fcData) {
    return loadErr ? (
      <p className="text-xs text-red-600 mt-2">{loadErr}</p>
    ) : (
      <p className="text-xs text-gray-500 mt-2">Chargement de la carte pour l’édition des noms…</p>
    );
  }

  const pr = presetFromRowPreset(row.preset);

  return (
    <div className="border-t border-gray-100 pt-3 mt-2 space-y-2">
      <p className="text-sm font-medium text-gray-800">Noms par zone (clic sur la carte)</p>
      <GeoJsonInteractiveNameMap
        geography={fcData.fc}
        centerLat={Number(pr.centerLat)}
        centerLng={Number(pr.centerLng)}
        zoom={Math.max(1, Math.min(8, pr.zoom))}
        idProperty={pr.idProperty}
        featureLabels={labels}
        onFeatureLabelsChange={setLabels}
        summaries={fcData.summaries}
      />
      <button
        type="button"
        disabled={savingNames}
        onClick={() => {
          void (async () => {
            setNamesFeedback(null);
            setSavingNames(true);
            const base =
              row.preset && typeof row.preset === "object" && !Array.isArray(row.preset)
                ? { ...(row.preset as Record<string, unknown>) }
                : {};
            const ok = await onSavePreset({ ...base, featureLabels: labels });
            setSavingNames(false);
            if (ok) {
              setNamesFeedback("Noms enregistrés sur le serveur.");
              window.setTimeout(() => setNamesFeedback(null), 4000);
            }
          })();
        }}
        className="text-sm px-4 py-2 rounded-lg bg-teal-600 text-white font-medium disabled:opacity-50"
      >
        {savingNames ? "Enregistrement…" : "Sauvegarder les noms dans le preset"}
      </button>
      {namesFeedback && (
        <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1">
          {namesFeedback}
        </p>
      )}
    </div>
  );
}

function RowPresetEditor({
  row,
  onSave,
}: {
  row: CustomGeoJsonMapRow;
  onSave: (preset: Record<string, unknown>) => void | Promise<void>;
}) {
  const p = (row.preset || {}) as Record<string, unknown>;
  const presetKey = useMemo(() => JSON.stringify(row.preset), [row.preset]);
  const [centerLat, setCenterLat] = useState(Number(p.centerLat ?? 20));
  const [centerLng, setCenterLng] = useState(Number(p.centerLng ?? 0));
  const [zoom, setZoom] = useState(Number(p.zoom ?? 2));
  const [idProperty, setIdProperty] = useState(
    typeof p.idProperty === "string" ? p.idProperty : "tc_id"
  );

  useEffect(() => {
    const pr = (row.preset || {}) as Record<string, unknown>;
    setCenterLat(Number(pr.centerLat ?? 20));
    setCenterLng(Number(pr.centerLng ?? 0));
    setZoom(Number(pr.zoom ?? 2));
    setIdProperty(typeof pr.idProperty === "string" ? pr.idProperty : "tc_id");
  }, [row.id, presetKey]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm bg-gray-50 rounded-lg p-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-600">Id propriété</span>
        <input
          value={idProperty}
          onChange={(e) => setIdProperty(e.target.value)}
          className="px-2 py-1 border rounded"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-600">Lat</span>
        <input
          type="number"
          value={centerLat}
          onChange={(e) => setCenterLat(Number(e.target.value))}
          className="px-2 py-1 border rounded"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-600">Lng</span>
        <input
          type="number"
          value={centerLng}
          onChange={(e) => setCenterLng(Number(e.target.value))}
          className="px-2 py-1 border rounded"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-gray-600">Zoom</span>
        <input
          type="number"
          min={1}
          max={8}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="px-2 py-1 border rounded"
        />
      </label>
      <div className="col-span-full">
        <button
          type="button"
          onClick={() => {
            void (async () => {
              const base =
                row.preset && typeof row.preset === "object" && !Array.isArray(row.preset)
                  ? { ...(row.preset as Record<string, unknown>) }
                  : {};
              await onSave({
                ...base,
                centerLat,
                centerLng,
                zoom: Math.max(1, Math.min(8, zoom)),
                idProperty: idProperty.trim() || "tc_id",
              });
            })();
          }}
          className="text-sm text-emerald-700 font-medium hover:underline"
        >
          Mettre à jour le preset
        </button>
      </div>
    </div>
  );
}
