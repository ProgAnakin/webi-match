import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { resizeImage } from "@/lib/imageProcessing";

// jsdom neither loads images nor rasterises a canvas, so we stub Image (driving
// onload/onerror ourselves) and the canvas 2d context + toBlob.
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 0;
  height = 0;
  private _src = "";
  set src(value: string) {
    this._src = value;
    queueMicrotask(() => {
      if (MockImage.shouldFail) { this.onerror?.(); return; }
      this.width = MockImage.w;
      this.height = MockImage.h;
      this.onload?.();
    });
  }
  get src() { return this._src; }
  static shouldFail = false;
  static w = 2000;
  static h = 1000;
}

describe("resizeImage", () => {
  let toBlobResult: Blob | null;

  beforeEach(() => {
    MockImage.shouldFail = false;
    MockImage.w = 2000;
    MockImage.h = 1000;
    toBlobResult = new Blob(["x"], { type: "image/jpeg" });
    vi.stubGlobal("Image", MockImage);
    Object.defineProperty(URL, "createObjectURL", { value: vi.fn(() => "blob:mock"), configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: vi.fn(), configurable: true });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      (cb: BlobCallback) => cb(toBlobResult),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const makeFile = () => new File(["data"], "photo.png", { type: "image/png" });

  it("returns a JPEG File on success, preserving the original name", async () => {
    const out = await resizeImage(makeFile());
    expect(out).toBeInstanceOf(File);
    expect(out.type).toBe("image/jpeg");
    expect(out.name).toBe("photo.png");
  });

  it("scales the canvas down so the longest side fits maxPx", async () => {
    MockImage.w = 2000;
    MockImage.h = 1000;
    const realCreate = document.createElement.bind(document);
    let canvasEl: HTMLCanvasElement | undefined;
    vi.spyOn(document, "createElement").mockImplementation(((tag: string) => {
      const el = realCreate(tag);
      if (tag === "canvas") canvasEl = el as HTMLCanvasElement;
      return el;
    }) as typeof document.createElement);

    await resizeImage(makeFile(), 1024);

    expect(canvasEl?.width).toBe(1024);  // 2000 * (1024/2000)
    expect(canvasEl?.height).toBe(512);  // 1000 * (1024/2000)
  });

  it("never upscales an image smaller than maxPx", async () => {
    MockImage.w = 400;
    MockImage.h = 300;
    const realCreate = document.createElement.bind(document);
    let canvasEl: HTMLCanvasElement | undefined;
    vi.spyOn(document, "createElement").mockImplementation(((tag: string) => {
      const el = realCreate(tag);
      if (tag === "canvas") canvasEl = el as HTMLCanvasElement;
      return el;
    }) as typeof document.createElement);

    await resizeImage(makeFile(), 1024);

    expect(canvasEl?.width).toBe(400);
    expect(canvasEl?.height).toBe(300);
  });

  it("returns the original file when toBlob yields null", async () => {
    toBlobResult = null;
    const file = makeFile();
    const out = await resizeImage(file);
    expect(out).toBe(file);
  });

  it("returns the original file when the image fails to load", async () => {
    MockImage.shouldFail = true;
    const file = makeFile();
    const out = await resizeImage(file);
    expect(out).toBe(file);
  });
});
