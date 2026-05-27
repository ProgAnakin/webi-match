import { useEffect } from "react";

interface KeybindingHandlers {
  onRefresh: () => void;
  onEscape: () => void;
}

/**
 * Wires the two global keyboard shortcuts the catalog supports:
 * Ctrl/⌘+S to refresh, Esc to close whatever's open (bulk selection,
 * confirm banner, modals, inline editors). Events fired while the user
 * is typing in an input / textarea / select are ignored.
 */
export const useManagerKeybindings = ({ onRefresh, onEscape }: KeybindingHandlers) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        onRefresh();
      }
      if (e.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onRefresh, onEscape]);
};
