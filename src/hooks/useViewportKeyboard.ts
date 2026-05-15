import { useEffect } from "react";

/**
 * Sets --keyboard-height CSS variable whenever the virtual keyboard appears on iOS/iPadOS.
 * Works alongside `interactive-widget=resizes-content` in the viewport meta tag.
 * Components can use `padding-bottom: var(--keyboard-height, 0px)` to push content up.
 */
export function useViewportKeyboard() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const kbHeight = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty("--keyboard-height", `${kbHeight}px`);
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      document.documentElement.style.removeProperty("--keyboard-height");
    };
  }, []);
}
