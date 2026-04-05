
import { createRoot } from "react-dom/client";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./app/App.tsx";
import { AuthProvider } from "./app/lib/auth";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
    <SpeedInsights />
  </AuthProvider>,
);
  
