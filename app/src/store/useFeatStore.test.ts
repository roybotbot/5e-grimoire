import { describe, it, expect, beforeEach, vi } from "vitest";
import { useFeatStore } from "./useFeatStore";
import type { FeatData } from "../data/featTypes";

// Mock loadAllFeats
vi.mock("../data/featLoader", () => ({
  loadAllFeats: vi.fn(),
}));

import { loadAllFeats } from "../data/featLoader";

const makeFeat = (overrides: Partial<FeatData> = {}): FeatData => ({
  id: "test-feat_phb",
  name: "Test Feat",
  source: "PHB",
  category: "G",
  categoryDisplay: "General",
  prerequisite: null,
  entries: [],
  ...overrides,
});

beforeEach(() => {
  useFeatStore.setState({
    feats: [],
    loading: false,
    error: null,
    warnings: [],
  });
  vi.clearAllMocks();
});

// ── Initial state ─────────────────────────────────────────────────────────────

describe("initial state", () => {
  it("feats is empty array", () => {
    expect(useFeatStore.getState().feats).toEqual([]);
  });

  it("loading is false", () => {
    expect(useFeatStore.getState().loading).toBe(false);
  });

  it("error is null", () => {
    expect(useFeatStore.getState().error).toBeNull();
  });

  it("warnings is empty array", () => {
    expect(useFeatStore.getState().warnings).toEqual([]);
  });
});

// ── Setters ───────────────────────────────────────────────────────────────────

describe("setFeats", () => {
  it("updates feats array", () => {
    const feat = makeFeat({});
    useFeatStore.getState().setFeats([feat]);
    expect(useFeatStore.getState().feats).toHaveLength(1);
    expect(useFeatStore.getState().feats[0].name).toBe("Test Feat");
  });

  it("replaces existing feats", () => {
    useFeatStore.getState().setFeats([makeFeat({ name: "Feat 1" })]);
    useFeatStore.getState().setFeats([makeFeat({ name: "Feat 2" })]);
    expect(useFeatStore.getState().feats).toHaveLength(1);
    expect(useFeatStore.getState().feats[0].name).toBe("Feat 2");
  });

  it("can set empty array", () => {
    useFeatStore.getState().setFeats([makeFeat()]);
    useFeatStore.getState().setFeats([]);
    expect(useFeatStore.getState().feats).toHaveLength(0);
  });
});

describe("setLoading", () => {
  it("sets loading to true", () => {
    useFeatStore.getState().setLoading(true);
    expect(useFeatStore.getState().loading).toBe(true);
  });

  it("sets loading to false", () => {
    useFeatStore.getState().setLoading(true);
    useFeatStore.getState().setLoading(false);
    expect(useFeatStore.getState().loading).toBe(false);
  });
});

describe("setError", () => {
  it("sets an error message", () => {
    useFeatStore.getState().setError("Something went wrong");
    expect(useFeatStore.getState().error).toBe("Something went wrong");
  });

  it("clears error with null", () => {
    useFeatStore.getState().setError("An error");
    useFeatStore.getState().setError(null);
    expect(useFeatStore.getState().error).toBeNull();
  });
});

describe("setWarnings", () => {
  it("sets warnings array", () => {
    useFeatStore.getState().setWarnings(["warn1", "warn2"]);
    expect(useFeatStore.getState().warnings).toEqual(["warn1", "warn2"]);
  });

  it("replaces existing warnings", () => {
    useFeatStore.getState().setWarnings(["old"]);
    useFeatStore.getState().setWarnings(["new"]);
    expect(useFeatStore.getState().warnings).toEqual(["new"]);
  });

  it("can clear warnings with empty array", () => {
    useFeatStore.getState().setWarnings(["warn"]);
    useFeatStore.getState().setWarnings([]);
    expect(useFeatStore.getState().warnings).toHaveLength(0);
  });
});

// ── loadFeats ─────────────────────────────────────────────────────────────────

describe("loadFeats", () => {
  it("sets loading true then false on success", async () => {
    vi.mocked(loadAllFeats).mockResolvedValue({ feats: [], warnings: [] });
    const promise = useFeatStore.getState().loadFeats();
    expect(useFeatStore.getState().loading).toBe(true);
    await promise;
    expect(useFeatStore.getState().loading).toBe(false);
  });

  it("populates feats on success", async () => {
    const feat = makeFeat({ name: "Athlete" });
    vi.mocked(loadAllFeats).mockResolvedValue({ feats: [feat], warnings: [] });
    await useFeatStore.getState().loadFeats();
    expect(useFeatStore.getState().feats).toHaveLength(1);
    expect(useFeatStore.getState().feats[0].name).toBe("Athlete");
  });

  it("sets warnings on success", async () => {
    vi.mocked(loadAllFeats).mockResolvedValue({ feats: [], warnings: ["warn"] });
    await useFeatStore.getState().loadFeats();
    expect(useFeatStore.getState().warnings).toEqual(["warn"]);
  });

  it("sets error and loading false on failure", async () => {
    vi.mocked(loadAllFeats).mockRejectedValue(new Error("Network error"));
    await useFeatStore.getState().loadFeats();
    expect(useFeatStore.getState().loading).toBe(false);
    expect(useFeatStore.getState().error).toBe("Network error");
  });

  it("clears error before loading", async () => {
    useFeatStore.getState().setError("old error");
    vi.mocked(loadAllFeats).mockResolvedValue({ feats: [], warnings: [] });
    await useFeatStore.getState().loadFeats();
    expect(useFeatStore.getState().error).toBeNull();
  });
});

// ── allSources ────────────────────────────────────────────────────────────────

describe("allSources", () => {
  it("returns empty array when no feats", () => {
    expect(useFeatStore.getState().allSources()).toEqual([]);
  });

  it("returns unique sorted source abbreviations", () => {
    useFeatStore.getState().setFeats([
      makeFeat({ source: "XPHB" }),
      makeFeat({ source: "PHB" }),
      makeFeat({ source: "TCE" }),
    ]);
    expect(useFeatStore.getState().allSources()).toEqual(["PHB", "TCE", "XPHB"]);
  });

  it("deduplicates sources", () => {
    useFeatStore.getState().setFeats([
      makeFeat({ source: "PHB" }),
      makeFeat({ source: "PHB" }),
      makeFeat({ source: "XGE" }),
    ]);
    expect(useFeatStore.getState().allSources()).toEqual(["PHB", "XGE"]);
  });
});

// ── allCategories ─────────────────────────────────────────────────────────────

describe("allCategories", () => {
  it("returns empty array when no feats", () => {
    expect(useFeatStore.getState().allCategories()).toEqual([]);
  });

  it("returns unique sorted categoryDisplay values", () => {
    useFeatStore.getState().setFeats([
      makeFeat({ categoryDisplay: "Origin" }),
      makeFeat({ categoryDisplay: "General" }),
      makeFeat({ categoryDisplay: "Epic Boon" }),
    ]);
    expect(useFeatStore.getState().allCategories()).toEqual([
      "Epic Boon",
      "General",
      "Origin",
    ]);
  });

  it("deduplicates categories", () => {
    useFeatStore.getState().setFeats([
      makeFeat({ categoryDisplay: "General" }),
      makeFeat({ categoryDisplay: "General" }),
      makeFeat({ categoryDisplay: "Origin" }),
    ]);
    expect(useFeatStore.getState().allCategories()).toEqual(["General", "Origin"]);
  });
});
