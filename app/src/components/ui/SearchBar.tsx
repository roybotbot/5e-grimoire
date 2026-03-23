import { forwardRef, useState } from "react";

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  placeholder?: string;
  accentColor?: string;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar({ query, onQueryChange, placeholder = "Search...", accentColor = "var(--accent-primary)" }, ref) {
    const [focused, setFocused] = useState(false);

    return (
      <div className="px-4 py-2 bg-[var(--bg-base)]">
        <div
          className="flex items-center gap-2 px-2 rounded-[2px] border"
          style={{
            background: "var(--bg-panel)",
            borderColor: focused ? accentColor : "var(--border-subtle)",
            transition: "border-color 120ms",
          }}
        >
          <span style={{ color: "var(--text-muted)", fontSize: "16px", lineHeight: 1 }}>
            ⌕
          </span>
          <input
            ref={ref}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            className="w-full bg-transparent outline-none py-1.5"
            style={{
              fontSize: "15px",
              color: "var(--text-primary)",
            }}
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
);
