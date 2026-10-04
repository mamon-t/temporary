import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// A new route opens at the top. React Router keeps the window's scroll offset
// across a navigation, so someone who scrolled to the foot of a listing and
// clicked an item would land in the middle of the next page.
//
// Three deliberate exceptions:
//   • POP — the back / forward button. The person is returning to a place they
//     left, and the browser restores that offset on its own.
//   • a #hash in the URL — that is an anchor, and jumping to the top would
//     override where it points.
//   • a changed query string on its own — filters, tabs and sort orders live on
//     the same screen, so this depends on `pathname` and never on `search`.
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP") return;
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash, navigationType]);

  return null;
}
