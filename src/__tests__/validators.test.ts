import { describe, it, expect } from "vitest";
import { isValidStoreId, youtubeId, STORE_ID_RE } from "@/lib/validators";

describe("isValidStoreId", () => {
  it("accepts the current production store slugs", () => {
    for (const id of ["rio-de-janeiro", "lisboa", "dublino", "milano"]) {
      expect(isValidStoreId(id)).toBe(true);
    }
  });

  it("accepts arbitrary kebab-case slugs (allows new stores without redeploying the edge function)", () => {
    expect(isValidStoreId("milano-centro")).toBe(true);
    expect(isValidStoreId("a1")).toBe(true);
    expect(isValidStoreId("9-store-test")).toBe(true);
  });

  it("rejects non-string values", () => {
    expect(isValidStoreId(null)).toBe(false);
    expect(isValidStoreId(undefined)).toBe(false);
    expect(isValidStoreId(123)).toBe(false);
    expect(isValidStoreId({})).toBe(false);
  });

  it("rejects malformed slugs", () => {
    expect(isValidStoreId("")).toBe(false);
    expect(isValidStoreId("a")).toBe(false); // too short (regex requires ≥2)
    expect(isValidStoreId("Rio-De-Janeiro")).toBe(false); // uppercase
    expect(isValidStoreId("with spaces")).toBe(false);
    expect(isValidStoreId("special!char")).toBe(false);
    expect(isValidStoreId("-leading-hyphen")).toBe(false);
    expect(isValidStoreId("a".repeat(51))).toBe(false); // > 50 chars
  });

  it("regex is exported and reusable", () => {
    expect(STORE_ID_RE.test("rio-de-janeiro")).toBe(true);
  });
});

describe("youtubeId", () => {
  it("extracts ID from a watch?v= URL", () => {
    expect(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from a youtu.be short URL", () => {
    expect(youtubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://youtu.be/dQw4w9WgXcQ?t=42")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from a /shorts/ URL", () => {
    expect(youtubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from a /embed/ URL", () => {
    expect(youtubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from a youtube-nocookie embed URL", () => {
    expect(youtubeId("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("returns null for non-YouTube URLs", () => {
    expect(youtubeId("https://example.com/video")).toBeNull();
    expect(youtubeId("https://vimeo.com/12345")).toBeNull();
  });

  it("returns null for malformed input", () => {
    expect(youtubeId("")).toBeNull();
    expect(youtubeId("not-a-url")).toBeNull();
    expect(youtubeId("https://youtu.be/short")).toBeNull(); // ID too short
  });
});
