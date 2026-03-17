import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSpeciesStore } from "./useSpeciesStore";
import type { SpeciesData } from "../data/speciesTypes";

// ── Mock loader ───────────────────────────────────────────────────────────────

vi.mock("../data/speciesLoader", () => ({
  loadAllSpecies: vi.fn(),
}));

import { loadAllSpecies } from "../data/speciesLoader";
const mockLoadAllSpecies = vi.mocked(loadAllSpecies);

// ── Helper ────────────────────────────────────────────────────────────────────

const makeSpecies = (overrides: Partial<SpeciesData> = {}): SpeciesData => ({
  id: "test_phb",
  name: "Test",
  source: "PHB",
  size: ["M"],
  sizeDisplay: "Medium",
  speed: { walk: 30 },
  speedDisplay: "30 ft.",
  darkvision: null,
  traits: [],
  ...overrides,
});

// ── Reset before each test ────────────────────────────────────────────────────

beforeEach(() => {
  useSpeciesStore.setState({
    species: [],
    loading: false,
    error: null,
    warnings: [],
  });
  vi.clearAllMocks();
});

// ── Initial state ─────────────────────────────────────────────────────────────

describe("initial state", () => {
  it("species is empty array", () => {
    expect(useSpeciesStore.getState().species).toEqual([]);
  });

  it("loading is false", () => {
    expect(useSpeciesStore.getState().loading).toBe(false);
  });

  it("error is null", () => {
    expect(useSpeciesStore.getState().error).toBeNull();
  });

  it("warnings is empty array", () => {
    expect(useSpeciesStore.getState().warnings).toEqual([]);
  });
});

// ── loadSpecies ───────────────────────────────────────────────────────────────

describe("loadSpecies", () => {
  it("sets species and clears loading on success", async () => {
    const species = [makeSpecies({ id: "human_phb", name: "Human" })];
    mockLoadAllSpecies.mockResolvedValueOnce({ species, warnings: [] });

    await useSpeciesStore.getState().loadSpecies();

    const state = useSpeciesStore.getState();
    expect(state.species).toHaveLength(1);
    expect(state.species[0].name).toBe("Human");
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("captures warnings on success", async () => {
    mockLoadAllSpecies.mockResolvedValueOnce({
      species: [],
      warnings: ["warn1", "warn2"],
    });

    await useSpeciesStore.getState().loadSpecies();

    expect(useSpeciesStore.getState().warnings).toEqual(["warn1", "warn2"]);
  });

  it("sets error and clears loading on failure", async () => {
    mockLoadAllSpecies.mockRejectedValueOnce(new Error("fetch failed"));

    await useSpeciesStore.getState().loadSpecies();

    const state = useSpeciesStore.getState();
    expect(state.loading).toBe(false);
    expect(state.error).toBe("fetch failed");
    expect(state.species).toEqual([]);
  });

  it("handles non-Error throws", async () => {
    mockLoadAllSpecies.mockRejectedValueOnce("network error");

    await useSpeciesStore.getState().loadSpecies();

    expect(useSpeciesStore.getState().error).toBe("network error");
  });
});

// ── allSources ────────────────────────────────────────────────────────────────

describe("allSources", () => {
  it("returns empty array when no species", () => {
    expect(useSpeciesStore.getState().allSources()).toEqual([]);
  });

  it("returns unique sorted sources", () => {
    useSpeciesStore.setState({
      species: [
        makeSpecies({ id: "a", source: "XPHB" }),
        makeSpecies({ id: "b", source: "PHB" }),
        makeSpecies({ id: "c", source: "TCE" }),
      ],
    });
    expect(useSpeciesStore.getState().allSources()).toEqual(["PHB", "TCE", "XPHB"]);
  });

  it("deduplicates sources", () => {
    useSpeciesStore.setState({
      species: [
        makeSpecies({ id: "a", source: "PHB" }),
        makeSpecies({ id: "b", source: "PHB" }),
        makeSpecies({ id: "c", source: "XGE" }),
      ],
    });
    expect(useSpeciesStore.getState().allSources()).toEqual(["PHB", "XGE"]);
  });
});

// ── allSizes ──────────────────────────────────────────────────────────────────

describe("allSizes", () => {
  it("returns empty array when no species", () => {
    expect(useSpeciesStore.getState().allSizes()).toEqual([]);
  });

  it("returns unique sorted sizes", () => {
    useSpeciesStore.setState({
      species: [
        makeSpecies({ id: "a", sizeDisplay: "Small" }),
        makeSpecies({ id: "b", sizeDisplay: "Medium" }),
        makeSpecies({ id: "c", sizeDisplay: "Large" }),
      ],
    });
    expect(useSpeciesStore.getState().allSizes()).toEqual(["Large", "Medium", "Small"]);
  });

  it("deduplicates sizes", () => {
    useSpeciesStore.setState({
      species: [
        makeSpecies({ id: "a", sizeDisplay: "Medium" }),
        makeSpecies({ id: "b", sizeDisplay: "Medium" }),
        makeSpecies({ id: "c", sizeDisplay: "Small" }),
      ],
    });
    expect(useSpeciesStore.getState().allSizes()).toEqual(["Medium", "Small"]);
  });
});
