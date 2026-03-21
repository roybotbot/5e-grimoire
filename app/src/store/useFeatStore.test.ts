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
    useFeatStore.setState({ error: "old error" });
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
    useFeatStore.setState({
      feats: [
        makeFeat({ source: "XPHB" }),
        makeFeat({ source: "PHB" }),
        makeFeat({ source: "TCE" }),
      ],
    });
    expect(useFeatStore.getState().allSources()).toEqual(["PHB", "TCE", "XPHB"]);
  });

  it("deduplicates sources", () => {
    useFeatStore.setState({
      feats: [
        makeFeat({ source: "PHB" }),
        makeFeat({ source: "PHB" }),
        makeFeat({ source: "XGE" }),
      ],
    });
    expect(useFeatStore.getState().allSources()).toEqual(["PHB", "XGE"]);
  });
});

// ── allCategories ─────────────────────────────────────────────────────────────

describe("allCategories", () => {
  it("returns empty array when no feats", () => {
    expect(useFeatStore.getState().allCategories()).toEqual([]);
  });

  it("returns unique sorted categoryDisplay values", () => {
    useFeatStore.setState({
      feats: [
        makeFeat({ categoryDisplay: "Origin" }),
        makeFeat({ categoryDisplay: "General" }),
        makeFeat({ categoryDisplay: "Epic Boon" }),
      ],
    });
    expect(useFeatStore.getState().allCategories()).toEqual([
      "Epic Boon",
      "General",
      "Origin",
    ]);
  });

  it("deduplicates categories", () => {
    useFeatStore.setState({
      feats: [
        makeFeat({ categoryDisplay: "General" }),
        makeFeat({ categoryDisplay: "General" }),
        makeFeat({ categoryDisplay: "Origin" }),
      ],
    });
    expect(useFeatStore.getState().allCategories()).toEqual(["General", "Origin"]);
  });
});
