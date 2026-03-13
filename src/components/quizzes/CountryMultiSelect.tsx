import { useMemo, useState } from "react";
import { getAllCountries } from "../../lib/countryGameData";

interface CountryMultiSelectProps {
  selectedIso3: string[];
  onChange: (next: string[]) => void;
  label?: string;
}

export function CountryMultiSelect({
  selectedIso3,
  onChange,
  label = "Pays sélectionnés",
}: CountryMultiSelectProps) {
  const [query, setQuery] = useState("");

  const allCountries = useMemo(
    () => [...getAllCountries()].sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const selectedSet = useMemo(
    () => new Set((selectedIso3 || []).map((iso) => iso.toUpperCase())),
    [selectedIso3]
  );

  const selectedCountries = useMemo(
    () => allCountries.filter((country) => selectedSet.has(country.iso3)),
    [allCountries, selectedSet]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allCountries
      .filter(
        (country) =>
          country.name.toLowerCase().includes(q) ||
          country.iso3.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [allCountries, query]);

  const addCountry = (iso3: string) => {
    const normalized = iso3.toUpperCase();
    if (selectedSet.has(normalized)) return;
    onChange([...(selectedIso3 || []), normalized]);
    setQuery("");
  };

  const removeCountry = (iso3: string) => {
    onChange((selectedIso3 || []).filter((value) => value !== iso3));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un pays (ex: France, JPN...)"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
      />

      {query.trim() && (
        <div className="border border-gray-200 rounded-lg bg-white max-h-48 overflow-y-auto">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500">Aucun pays trouvé</p>
          ) : (
            results.map((country) => {
              const isSelected = selectedSet.has(country.iso3);
              return (
                <button
                  key={country.iso3}
                  type="button"
                  disabled={isSelected}
                  onClick={() => addCountry(country.iso3)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {country.name} ({country.iso3})
                </button>
              );
            })
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {selectedCountries.map((country) => (
          <button
            key={country.iso3}
            type="button"
            onClick={() => removeCountry(country.iso3)}
            className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm hover:bg-emerald-200"
          >
            {country.name} ×
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Sélectionne 1 ou plusieurs pays. Si vide, le jeu utilise le monde entier.
      </p>
    </div>
  );
}
