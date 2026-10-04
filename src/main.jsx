import React from "react";
import ReactDOM from "react-dom/client";
import bootstrap from "virtual:vibeli/bootstrap";
import "@/index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

// The SDK client throws at construction if appId/gatewayUrl are missing (e.g.
// VIBELI_APP_ID / VIBELI_GATEWAY_URL weren't injected). Since that construction
// happens at import time inside @/lib/vibeli.js, importing the app eagerly would
// blank-screen with an opaque TypeError. Validate the bootstrap first and only
// lazy-load the app once it's configured; otherwise render a clear notice.
if (!bootstrap.appId || !bootstrap.gatewayUrl) {
  root.render(
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-2">
        <h1 className="text-xl font-semibold">App not configured</h1>
        <p className="text-sm text-[var(--muted)]">
          Missing Vibeli bootstrap config (appId / gatewayUrl). These are injected
          at build time via <code>VIBELI_APP_ID</code> and{" "}
          <code>VIBELI_GATEWAY_URL</code> by the provisioner / vite-plugin.
        </p>
      </div>
    </div>,
  );
} else {
  import("@/App.jsx")
    .then(({ default: App }) => {
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      );
    })
    .catch((err) => {
      // A rebuilt shell can reference a code-split chunk that no longer exists
      // (404) → the import rejects and #root stays empty (white screen). Show a
      // clear reload prompt instead of a silent blank.
      console.error("Failed to load the app bundle:", err);
      root.render(
        <div className="min-h-screen flex items-center justify-center px-4 text-center">
          <div className="max-w-md space-y-3">
            <h1 className="text-xl font-semibold">Couldn’t load the app</h1>
            <p className="text-sm text-[var(--muted)]">
              A newer version may have just been deployed. Reload to continue.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--accent)] px-4 text-sm font-medium text-[var(--on-accent)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-press)]"
            >
              Reload
            </button>
          </div>
        </div>,
      );
    });
}
