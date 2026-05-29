import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// A component that throws on demand, so we can exercise the boundary.
function Bomb({ explode }: { explode: boolean }) {
  if (explode) throw new Error("boom");
  return <div>safe content</div>;
}

describe("ErrorBoundary (granular fallback)", () => {
  // React logs the caught error to console.error — silence it for clean output.
  beforeEach(() => { vi.spyOn(console, "error").mockImplementation(() => {}); });
  afterEach(() => { vi.restoreAllMocks(); });

  it("renders children when nothing throws", () => {
    render(
      <ErrorBoundary fallback={() => <div>fallback</div>}>
        <Bomb explode={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("safe content")).toBeInTheDocument();
  });

  it("renders the custom fallback when a child throws", () => {
    render(
      <ErrorBoundary fallback={() => <div>custom fallback</div>}>
        <Bomb explode={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("custom fallback")).toBeInTheDocument();
  });

  it("recovers via the reset callback passed to the fallback", () => {
    function Harness() {
      const [explode, setExplode] = useState(true);
      return (
        <ErrorBoundary
          fallback={(reset) => (
            <button onClick={() => { setExplode(false); reset(); }}>retry</button>
          )}
        >
          <Bomb explode={explode} />
        </ErrorBoundary>
      );
    }
    render(<Harness />);
    expect(screen.getByText("retry")).toBeInTheDocument();
    fireEvent.click(screen.getByText("retry"));
    expect(screen.getByText("safe content")).toBeInTheDocument();
  });

  it("clears the error when a reset key changes", () => {
    function Harness() {
      const [tab, setTab] = useState("a");
      const [explode, setExplode] = useState(true);
      return (
        <>
          <button onClick={() => { setExplode(false); setTab("b"); }}>switch tab</button>
          <ErrorBoundary
            resetKeys={[tab]}
            fallback={() => <div>tab crashed</div>}
          >
            <Bomb explode={explode} />
          </ErrorBoundary>
        </>
      );
    }
    render(<Harness />);
    expect(screen.getByText("tab crashed")).toBeInTheDocument();
    fireEvent.click(screen.getByText("switch tab"));
    expect(screen.getByText("safe content")).toBeInTheDocument();
  });
});
