import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/AuthContext.jsx";
import { RequireAuth } from "@/lib/RequireAuth.jsx";
import { ErrorBoundary } from "@/lib/ErrorBoundary.jsx";
import { PreviewBridge } from "@/lib/PreviewBridge.jsx";
import { ScrollToTop } from "@/lib/ScrollToTop.jsx";
import { routes } from "@/routes.jsx";

export default function App() {
  return (
    // Top-level boundary: a crash in any page renders a recoverable notice
    // instead of a blank white screen.
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          {/* Bridges preview-toolbar navigation across the iframe boundary. */}
          <PreviewBridge routes={routes} />
          {/* A new route opens at the top; back / forward keeps its position. */}
          <ScrollToTop />
          <Routes>
            {/* `access` из routes.jsx — гейт на ЧАСТЬ приложения (IMPR-85).
                Без него маршрут публичный, как и было. */}
            {routes.map(({ path, element, access }) => (
              <Route
                key={path}
                path={path}
                element={
                  access === undefined || access === "public" ? (
                    element
                  ) : (
                    <RequireAuth access={access}>{element}</RequireAuth>
                  )
                }
              />
            ))}
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
