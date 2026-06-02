import { useEffect } from "react";

// Locks the document body to a fixed-viewport, no-scroll layout for the
// duration of the calling component's lifetime. Used by the kiosk Index
// route so a Safari touch-drag never reveals the URL bar or rubber-bands
// past the design, while the admin dashboards (Manager / Stats /
// Consulente) keep their normal document scroll for long lists.
//
// What it sets, and why:
//   • overflow: hidden            — blocks every scroll axis on the page
//   • position: fixed + inset: 0  — Safari treats the body as non-scrollable,
//                                   so the URL bar stops slide-in on touch
//   • height: 100dvh              — exact viewport height (no overflow even
//                                   when the on-screen keyboard opens)
//   • touch-action: none on html  — kills the elastic-bounce drag
//
// Every original value is captured before mount and restored on cleanup,
// so switching to a non-kiosk route leaves the body in its default state.
export function useLockBodyScroll() {
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    const prev = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyInset:    body.style.inset,
      bodyHeight:   body.style.height,
      bodyWidth:    body.style.width,
      htmlOverflow: html.style.overflow,
      htmlTouch:    html.style.touchAction,
    };

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.inset    = "0";
    body.style.height   = "100dvh";
    body.style.width    = "100%";
    html.style.overflow = "hidden";
    html.style.touchAction = "none";

    return () => {
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.inset    = prev.bodyInset;
      body.style.height   = prev.bodyHeight;
      body.style.width    = prev.bodyWidth;
      html.style.overflow = prev.htmlOverflow;
      html.style.touchAction = prev.htmlTouch;
    };
  }, []);
}
