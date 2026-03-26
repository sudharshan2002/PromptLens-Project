import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { HomePage } from "./components/pages/HomePage";
import { ComposerPage } from "./components/pages/ComposerPage";
import { WhatIfPage } from "./components/pages/WhatIfPage";
import { DashboardPage } from "./components/pages/DashboardPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "composer", Component: ComposerPage },
      { path: "what-if", Component: WhatIfPage },
      { path: "dashboard", Component: DashboardPage },
      {
        path: "*",
        Component: HomePage,
      },
    ],
  },
]);
