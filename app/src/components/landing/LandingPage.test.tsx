import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { LandingPage } from "./LandingPage";

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );
}

describe("LandingPage", () => {
  it("renders the site name", () => {
    renderLanding();
    expect(screen.getByText("5e Grimoire")).toBeInTheDocument();
  });

  it("renders the spells link", () => {
    renderLanding();
    const link = screen.getByRole("link", { name: /spells/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/spells");
  });

  it("renders the species link", () => {
    renderLanding();
    const link = screen.getByRole("link", { name: /species/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/species");
  });

  it("renders coming soon text for inactive entries", () => {
    renderLanding();
    const comingSoon = screen.getAllByText("coming soon");
    expect(comingSoon.length).toBeGreaterThan(0);
  });

  it("renders bestiary and items as inactive entries", () => {
    renderLanding();
    expect(screen.getByText("bestiary")).toBeInTheDocument();
    expect(screen.getByText("items")).toBeInTheDocument();
  });

  it("renders the bestiary link", () => {
    renderLanding();
    const link = screen.getByRole("link", { name: /bestiary/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/bestiary");
  });

  it("renders the footer", () => {
    renderLanding();
    expect(
      screen.getByText(/digital reference for products you already own/i)
    ).toBeInTheDocument();
  });

  it("renders the classes link", () => {
    renderLanding();
    const link = screen.getByRole("link", { name: /classes/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/classes");
  });
});
