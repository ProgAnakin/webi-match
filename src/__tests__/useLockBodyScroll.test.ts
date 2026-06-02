import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

// The hook freezes <html> and <body> into a fixed-viewport, no-scroll
// layout for the kiosk route and restores every overridden style on
// unmount, so navigating to an admin route afterwards leaves the
// document scrollable again. These tests pin both halves of that
// contract — what gets locked, and that it fully unwinds.

describe("useLockBodyScroll", () => {
  beforeEach(() => {
    // Seed pre-existing values so we can confirm they survive the round-trip.
    document.body.style.overflow = "scroll";
    document.body.style.position = "static";
    document.body.style.height   = "200px";
    document.documentElement.style.overflow = "scroll";
  });

  afterEach(() => {
    document.body.removeAttribute("style");
    document.documentElement.removeAttribute("style");
  });

  it("locks <body> and <html> to a fixed, non-scrolling viewport while mounted", () => {
    renderHook(() => useLockBodyScroll());
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.style.position).toBe("fixed");
    // jsdom normalises the `inset` shorthand to a unit-less zero.
    expect(document.body.style.inset).toMatch(/^0(px)?$/);
    // height is set to "100dvh" by the hook; jsdom rejects unknown viewport
    // units, so we just verify width was set — real browsers honour dvh.
    expect(document.body.style.width).toBe("100%");
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.documentElement.style.touchAction).toBe("none");
  });

  it("restores every overridden style on unmount", () => {
    const { unmount } = renderHook(() => useLockBodyScroll());
    unmount();
    expect(document.body.style.overflow).toBe("scroll");
    expect(document.body.style.position).toBe("static");
    expect(document.body.style.height).toBe("200px");
    expect(document.documentElement.style.overflow).toBe("scroll");
    // touchAction was never seeded; jsdom reports "" or undefined depending
    // on version. Either way it must not still be "none".
    expect(document.documentElement.style.touchAction).not.toBe("none");
  });

  it("does not leak the lock across remounts", () => {
    const a = renderHook(() => useLockBodyScroll());
    a.unmount();
    expect(document.body.style.overflow).toBe("scroll");
    const b = renderHook(() => useLockBodyScroll());
    expect(document.body.style.overflow).toBe("hidden");
    b.unmount();
    expect(document.body.style.overflow).toBe("scroll");
  });
});
