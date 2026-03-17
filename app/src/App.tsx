import { createHashRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { LandingPage } from "./components/landing/LandingPage";
import { SpellListView } from "./components/spells/SpellListView";
import { ClassListView } from "./components/classes/ClassListView";
import { SpeciesListView } from "./components/species/SpeciesListView";
import { FeatListView } from "./components/feats/FeatListView";
import { BestiaryListView } from "./components/bestiary/BestiaryListView";

const router = createHashRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/spells", element: <SpellListView /> },
  { path: "/spells/:spellId", element: <SpellListView /> },
  { path: "/species", element: <SpeciesListView /> },
  { path: "/species/:speciesId", element: <SpeciesListView /> },
  { path: "/classes", element: <ClassListView /> },
  { path: "/classes/:classId", element: <ClassListView /> },
  { path: "/feats", element: <FeatListView /> },
  { path: "/feats/:featId", element: <FeatListView /> },
  { path: "/bestiary", element: <BestiaryListView /> },
  { path: "/bestiary/:monsterId", element: <BestiaryListView /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
