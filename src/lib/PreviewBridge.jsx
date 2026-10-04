import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Preview bridge — lets the Vibeli platform's preview toolbar drive this app
// across the iframe's cross-origin boundary. The platform is served from a
// different origin than the preview, so it can't read our location or call
// history.back() on us directly (that throws a cross-origin SecurityError). We
// speak postMessage instead:
//   • we announce ourselves ("ready") and, once the platform acks ("hello"),
//     report our current path + the app's page list on every route change;
//   • we execute back / forward / reload / navigate commands from the platform.
// Opened standalone (outside the platform) window.parent === window: nobody
// acks, the bridge stays dormant, and the app behaves normally.

const CHILD = "vibeli-preview";
const PARENT = "vibeli-platform";

export function PreviewBridge({ routes = [] }) {
  const location = useLocation();
  const navigate = useNavigate();
  // Origin of the trusted platform frame, learned from its "hello" ack. Until
  // it's set we send page data nowhere and accept no commands.
  const parentOrigin = useRef(null);

  // Serialisable page list for the platform's page switcher. Drop param /
  // wildcard routes (":id", "*") — they aren't directly navigable entries.
  const pages = routes
    .filter(
      (r) =>
        typeof r.path === "string" &&
        !r.path.includes(":") &&
        !r.path.includes("*"),
    )
    .map((r) => ({ path: r.path, label: r.label ?? r.path }));

  // Latest path/pages in a ref so the once-bound message handler reads current
  // values without re-binding (and re-announcing) on every navigation.
  const stateRef = useRef({ pages, path: location.pathname });
  stateRef.current = { pages, path: location.pathname };

  // Handshake + inbound commands. Bound once for the app's lifetime.
  useEffect(() => {
    if (window.parent === window) return; // not embedded → dormant

    const onMessage = (event) => {
      if (event.source !== window.parent) return;
      const data = event.data;
      if (!data || data.source !== PARENT) return;

      if (data.type === "hello") {
        parentOrigin.current = event.origin;
        // Report where we are + what pages exist, right away.
        window.parent.postMessage(
          {
            source: CHILD,
            type: "nav",
            path: stateRef.current.path,
            pages: stateRef.current.pages,
          },
          event.origin,
        );
        return;
      }

      // Commands are honoured only from the acked platform origin.
      if (event.origin !== parentOrigin.current || data.type !== "cmd") return;
      switch (data.cmd) {
        case "back":
          window.history.back();
          break;
        case "forward":
          window.history.forward();
          break;
        case "reload":
          window.location.reload();
          break;
        case "navigate":
          if (typeof data.path === "string") navigate(data.path);
          break;
        default:
          break;
      }
    };
    window.addEventListener("message", onMessage);

    // Announce readiness, retrying a while in case the platform's listener
    // mounts after us. "ready" carries no data, so broadcasting it is safe.
    let tries = 0;
    let timer = 0;
    const announce = () => {
      if (parentOrigin.current) return; // already acked
      window.parent.postMessage({ source: CHILD, type: "ready" }, "*");
      if (++tries < 20) timer = window.setTimeout(announce, 300);
    };
    announce();

    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timer);
    };
  }, [navigate]);

  // Push path/page changes to the platform once handshaked.
  useEffect(() => {
    if (!parentOrigin.current || window.parent === window) return;
    window.parent.postMessage(
      {
        source: CHILD,
        type: "nav",
        path: location.pathname,
        pages: stateRef.current.pages,
      },
      parentOrigin.current,
    );
  }, [location.pathname]);

  return null;
}
