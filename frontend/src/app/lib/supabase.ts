import { createClient } from "@supabase/supabase-js";
import { hasAuthRedirectParams } from "./authRedirect";

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseKey = String(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "",
).trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase environment variables are missing. Set VITE_SUPABASE_URL and a public auth key.");
}

function inferFallbackNextPath(url: URL) {
  if (url.pathname === "/" || url.pathname === "/login" || url.pathname === "/signup") {
    return "/dashboard";
  }

  return url.pathname;
}

function normalizeAuthCallbackLocation() {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  if (pathname === "/auth/callback" || !hasAuthRedirectParams(url)) {
    return;
  }

  const params = new URLSearchParams(url.search);
  if (!params.has("next")) {
    params.set("next", inferFallbackNextPath(url));
  }

  const query = params.toString();
  const nextUrl = `${url.origin}/auth/callback${query ? `?${query}` : ""}${url.hash}`;
  window.history.replaceState(window.history.state, "", nextUrl);
}

normalizeAuthCallbackLocation();

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
});
