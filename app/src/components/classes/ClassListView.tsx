import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { Link } from "react-router";
import { useClassStore } from "../../store/useClassStore";
import { useClassSearch } from "../../hooks/useClassSearch";
import { ClassList } from "./ClassList";
import { ClassDetail } from "./ClassDetail";

export function ClassListView() {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId?: string }>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { classes, loading, error, loadClasses } = useClassStore();

  // Load classes on mount if not loaded
  useEffect(() => {
    if (classes.length === 0 && !loading) {
      loadClasses();
    }
  }, []);

  const { query, setQuery, results } = useClassSearch(classes);

  // Find selected class
  const selectedClass = classId
    ? results.find((c) => c.id === classId) ?? null
    : null;

  // Keyboard shortcut: "/" focuses search when detail not open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (classId) return; // detail is open
      if (e.key === "/" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [classId]);

  // Prev / Next navigation
  const selectedIndex = classId ? results.findIndex((c) => c.id === classId) : -1;

  function handlePrev() {
    if (selectedIndex > 0) {
      navigate(`/classes/${results[selectedIndex - 1].id}`);
    }
  }

  function handleNext() {
    if (selectedIndex >= 0 && selectedIndex < results.length - 1) {
      navigate(`/classes/${results[selectedIndex + 1].id}`);
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
          Loading classes…
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
          onClick={() => loadClasses()}
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
            Classes
          </span>
        </div>

        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {results.length.toLocaleString()} classes
        </span>
      </div>

      {/* Search input */}
      <div
        className="px-4 py-2 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div
          className="flex items-center gap-2 px-2 rounded-[2px] border"
          style={{
            background: "var(--bg-panel)",
            borderColor: "var(--border-subtle)",
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
            placeholder="Search classes…"
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

      {/* Class list */}
      <ClassList
        classes={results}
        selectedId={classId ?? null}
        onSelect={(classData) => navigate(`/classes/${classData.id}`)}
      />

      {/* Detail overlay */}
      {selectedClass && (
        <ClassDetail
          classData={selectedClass}
          onClose={() => navigate("/classes")}
          onPrev={selectedIndex > 0 ? handlePrev : undefined}
          onNext={selectedIndex < results.length - 1 ? handleNext : undefined}
        />
      )}
    </div>
  );
}
