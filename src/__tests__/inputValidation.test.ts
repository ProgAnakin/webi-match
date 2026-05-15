import { describe, it, expect } from "vitest";

// Pure validation functions mirrored from ManagerDashboard / ProductCatalogTab.

function isValidPrice(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "") return true;
  return /^€?\d+([.,]\d{1,2})?$/.test(trimmed);
}

function isValidVideoUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed === "") return true;
  return trimmed.includes("youtube.com") || trimmed.includes("youtu.be") || trimmed.includes("vimeo.com");
}

function isValidImageFile(file: { size: number; type: string }): string | null {
  if (file.size > 5 * 1024 * 1024) return "Immagine troppo grande — massimo 5 MB.";
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type))
    return "Formato non supportato — usa JPEG, PNG, WebP o GIF.";
  return null;
}

describe("isValidPrice", () => {
  it("accepts empty string (allow clearing)", () => expect(isValidPrice("")).toBe(true));
  it("accepts €49,00", () => expect(isValidPrice("€49,00")).toBe(true));
  it("accepts 49.00", () => expect(isValidPrice("49.00")).toBe(true));
  it("accepts €49", () => expect(isValidPrice("€49")).toBe(true));
  it("accepts 49,00", () => expect(isValidPrice("49,00")).toBe(true));
  it("rejects €€€", () => expect(isValidPrice("€€€")).toBe(false));
  it("rejects abc", () => expect(isValidPrice("abc")).toBe(false));
  it("rejects 49.001 (3 decimal places)", () => expect(isValidPrice("49.001")).toBe(false));
});

describe("isValidVideoUrl", () => {
  it("accepts empty string", () => expect(isValidVideoUrl("")).toBe(true));
  it("accepts youtube.com url", () => expect(isValidVideoUrl("https://www.youtube.com/watch?v=abc123")).toBe(true));
  it("accepts youtu.be url", () => expect(isValidVideoUrl("https://youtu.be/abc123")).toBe(true));
  it("accepts vimeo.com url", () => expect(isValidVideoUrl("https://vimeo.com/123456")).toBe(true));
  it("rejects random url", () => expect(isValidVideoUrl("https://example.com/video")).toBe(false));
  it("rejects plain text", () => expect(isValidVideoUrl("not a url")).toBe(false));
});

describe("isValidImageFile", () => {
  it("accepts a 1 MB JPEG", () =>
    expect(isValidImageFile({ size: 1 * 1024 * 1024, type: "image/jpeg" })).toBeNull());
  it("accepts a 5 MB PNG exactly", () =>
    expect(isValidImageFile({ size: 5 * 1024 * 1024, type: "image/png" })).toBeNull());
  it("rejects a 6 MB JPEG", () =>
    expect(isValidImageFile({ size: 6 * 1024 * 1024, type: "image/jpeg" })).toMatch(/troppo grande/));
  it("rejects a SVG file", () =>
    expect(isValidImageFile({ size: 100, type: "image/svg+xml" })).toMatch(/Formato/));
  it("rejects a PDF", () =>
    expect(isValidImageFile({ size: 100, type: "application/pdf" })).toMatch(/Formato/));
  it("accepts WebP", () =>
    expect(isValidImageFile({ size: 2 * 1024 * 1024, type: "image/webp" })).toBeNull());
});
