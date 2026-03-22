import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Link } from "react-router";
import { useBestiaryStore } from "../../store/useBestiaryStore";
import { useBestiaryFilters } from "../../hooks/useBestiaryFilters";
import { useBestiarySearch } from "../../hooks/useBestiarySearch";
import { BestiaryFilters } from "./BestiaryFilters";
import { MonsterList } from "./MonsterList";
import { MonsterDetail } from "./MonsterDetail";

// Inline search component (same pattern as SpellSearch)
function BestiarySearch({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (q: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="px-4 py-2 bg-[var(--bg-base)]">
      <div
        className="flex items-center gap-2 px-2 rounded-[2px] border"
        style={{
          background: "var(--bg-panel)",
          borderColor: focused ? "var(--accent-danger)" : "var(--border-subtle)",
          transition: "border-color 120ms",
        }}
      >
        <span style={{ color: "var(--text-muted)", fontSize: "16px", lineHeight: 1 }}>
          ⌕
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search creatures..."
          className="w-full bg-transparent outline-none py-1.5"
          style={{ fontSize: "15px", color: "var(--text-primary)" }}
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
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
  );
}

export function BestiaryListView() {
  const navigate = useNavigate();
  const { monsterId } = useParams<{ monsterId?: string }>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    monsters,
    loading,
    error,
    loadMonsters,
    allTypes,
    allSources,
    allEnvironments,
  } = useBestiaryStore();

  // Load monsters on mount if not loaded
  useEffect(() => {
    if (monsters.length === 0 && !loading) {
      loadMonsters();
    }
  }, []);

  const {
    filters,
    filtered,
    hasActiveFilters,
    toggleCrRange,
    toggleType,
    toggleSize,
    setSources,
    setEnvironments,
    clearAll,
  } = useBestiaryFilters(monsters);

  const { query, setQuery, results } = useBestiarySearch(filtered);

  // Find selected monster
  const selectedMonster = monsterId
    ? results.find((m) => m.id === monsterId) ?? null
    : null;

  // Keyboard shortcut: "/" focuses search when detail not open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (monsterId) return;
      if (e.key === "/" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [monsterId]);

  // Prev / Next navigation
  const selectedIndex = monsterId
    ? results.findIndex((m) => m.id === monsterId)
    : -1;

  function handlePrev() {
    if (selectedIndex > 0) {
      navigate(`/bestiary/${results[selectedIndex - 1].id}`);
    }
  }

  function handleNext() {
    if (selectedIndex >= 0 && selectedIndex < results.length - 1) {
      navigate(`/bestiary/${results[selectedIndex + 1].id}`);
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
            borderTopColor: "var(--accent-danger)",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
        <p style={{ color: "var(--text-muted)", marginTop: "12px" }}>
          Loading bestiary…
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
          onClick={() => loadMonsters()}
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
            Bestiary
          </span>
        </div>

        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {results.length.toLocaleString()} creatures
        </span>
      </div>

      {/* Search */}
      <BestiarySearch query={query} onQueryChange={setQuery} />

      {/* Filters */}
      <BestiaryFilters
        filters={filters}
        toggleCrRange={toggleCrRange}
        toggleType={toggleType}
        toggleSize={toggleSize}
        setSources={setSources}
        setEnvironments={setEnvironments}
        hasActiveFilters={hasActiveFilters}
        onClearAll={clearAll}
        allTypes={allTypes()}
        allSources={allSources()}
        allEnvironments={allEnvironments()}
      />

      {/* Monster list */}
      <MonsterList
        monsters={results}
        selectedId={monsterId ?? null}
        onSelect={(monster) => navigate(`/bestiary/${monster.id}`)}
      />

      {/* Detail overlay */}
      {selectedMonster && (
        <MonsterDetail
          monster={selectedMonster}
          onClose={() => navigate("/bestiary")}
          onPrev={selectedIndex > 0 ? handlePrev : undefined}
          onNext={
            selectedIndex < results.length - 1 ? handleNext : undefined
          }
        />
      )}
    </div>
  );
}
