import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { Link } from "react-router";
import { useSpeciesStore } from "../../store/useSpeciesStore";
import { useSpeciesFilters } from "../../hooks/useSpeciesFilters";
import { useSpeciesSearch } from "../../hooks/useSpeciesSearch";
import { SpeciesList } from "./SpeciesList";
import { SpeciesDetail } from "./SpeciesDetail";
import { SpeciesFilters } from "./SpeciesFilters";

export function SpeciesListView() {
  const navigate = useNavigate();
  const { speciesId } = useParams<{ speciesId?: string }>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { species, loading, error, loadSpecies, allSources } = useSpeciesStore();

  // Load species on mount if not loaded
  useEffect(() => {
    if (species.length === 0 && !loading) {
      loadSpecies();
    }
  }, []);

  const {
    filters,
    filtered,
    hasActiveFilters,
    toggleSize,
    setSources,
    toggleDarkvision,
    clearAll,
  } = useSpeciesFilters(species);

  const { query, setQuery, results } = useSpeciesSearch(filtered);

  // Find selected species
  const selectedSpecies = speciesId
    ? results.find((s) => s.id === speciesId) ?? null
    : null;

  // Keyboard shortcut: "/" focuses search when detail not open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (speciesId) return; // detail is open
      if (e.key === "/" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [speciesId]);

  // Prev / Next navigation
  const selectedIndex = speciesId ? results.findIndex((s) => s.id === speciesId) : -1;

  function handlePrev() {
    if (selectedIndex > 0) {
      navigate(`/species/${results[selectedIndex - 1].id}`);
    }
  }

  function handleNext() {
    if (selectedIndex >= 0 && selectedIndex < results.length - 1) {
      navigate(`/species/${results[selectedIndex + 1].id}`);
    }
  }

  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center h-screen"
        style={{ background: "var(--bg-base)" }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "3px solid var(--border-subtle)",
            borderTopColor: "var(--accent-primary)",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <p style={{ color: "var(--text-muted)", marginTop: "12px" }}>
          Loading species…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center h-screen gap-3"
        style={{ background: "var(--bg-base)" }}
      >
        <p style={{ color: "var(--accent-danger)" }}>{error}</p>
        <button
          type="button"
          onClick={() => loadSpecies()}
          className="px-3 py-1.5 rounded-[2px] text-[13px] cursor-pointer"
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 flex-shrink-0"
        style={{
          height: "48px",
          background: "var(--bg-base)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-2">
          <Link
            to="/"
            style={{
              color: "var(--text-secondary)",
              fontSize: "18px",
              textDecoration: "none",
              padding: "4px",
            }}
            aria-label="Back to home"
          >
            ←
          </Link>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: "18px",
              color: "var(--text-primary)",
            }}
          >
            Species
          </span>
        </div>

        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {results.length.toLocaleString()} species
        </span>
      </div>

      {/* Search */}
      <div className="px-4 py-2 bg-[var(--bg-base)]">
        <div
          className="flex items-center gap-2 px-2 rounded-[2px] border"
          style={{
            background: "var(--bg-panel)",
            borderColor: "var(--border-subtle)",
            transition: "border-color 120ms",
          }}
        >
          <span style={{ color: "var(--text-muted)", fontSize: "16px", lineHeight: 1 }}>
            ⌕
          </span>
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search species..."
            className="w-full bg-transparent outline-none py-1.5"
            style={{
              fontSize: "15px",
              color: "var(--text-primary)",
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="flex items-center justify-center cursor-pointer flex-shrink-0"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "14px",
                padding: "4px",
                lineHeight: 1,
              }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <SpeciesFilters
        filters={filters}
        toggleSize={toggleSize}
        toggleDarkvision={toggleDarkvision}
        setSources={setSources}
        allSources={allSources()}
        hasActiveFilters={hasActiveFilters}
        onClearAll={clearAll}
      />

      {/* Species list */}
      <SpeciesList
        species={results}
        selectedId={speciesId ?? null}
        onSelect={(s) => navigate(`/species/${s.id}`)}
      />

      {/* Detail overlay */}
      {selectedSpecies && (
        <SpeciesDetail
          species={selectedSpecies}
          onClose={() => navigate("/species")}
          onPrev={selectedIndex > 0 ? handlePrev : undefined}
          onNext={selectedIndex < results.length - 1 ? handleNext : undefined}
        />
      )}
    </div>
  );
}
