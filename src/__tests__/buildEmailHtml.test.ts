import { describe, it, expect } from "vitest";
import { buildEmailHtml, EmailData } from "@/lib/emailTemplate";

const BASE: EmailData = {
  nome: "Mario",
  cognome: "Rossi",
  email: "mario@example.com",
  match_percent: 85,
  product_name: "Test Product",
  product_price: "€49,00",
  discount_code: "WEBI-TEST",
};

describe("buildEmailHtml", () => {
  it("returns a non-empty HTML string", () => {
    const html = buildEmailHtml(BASE);
    expect(typeof html).toBe("string");
    expect(html.length).toBeGreaterThan(500);
  });

  it("includes the discount code verbatim", () => {
    const html = buildEmailHtml(BASE);
    expect(html).toContain("WEBI-TEST");
  });

  it("includes the recipient name", () => {
    const html = buildEmailHtml(BASE);
    expect(html).toContain("Mario");
  });

  it("includes the product name", () => {
    const html = buildEmailHtml(BASE);
    expect(html).toContain("Test Product");
  });

  it("escapes HTML in product name to prevent injection", () => {
    const html = buildEmailHtml({ ...BASE, product_name: "<script>alert(1)</script>" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes HTML in discount code", () => {
    const html = buildEmailHtml({ ...BASE, discount_code: "<b>XSS</b>" });
    expect(html).not.toContain("<b>XSS</b>");
    expect(html).toContain("&lt;b&gt;XSS&lt;/b&gt;");
  });

  it("rejects non-https product image URLs", () => {
    const html = buildEmailHtml({ ...BASE, product_image: "javascript:alert(1)" });
    expect(html).not.toContain("javascript:alert");
  });

  it("accepts a valid https product image URL", () => {
    const url = "https://cdn.example.com/image.jpg";
    const html = buildEmailHtml({ ...BASE, product_image: url });
    expect(html).toContain(url);
  });

  it("renders FAQ section when faq entries are provided", () => {
    const html = buildEmailHtml({
      ...BASE,
      faq: [{ q: "Domanda test?", a: "Risposta test." }],
    });
    expect(html).toContain("Domanda test?");
    expect(html).toContain("Risposta test.");
    expect(html).toContain("DOMANDE FREQUENTI");
  });

  it("omits FAQ section when faq is empty", () => {
    const html = buildEmailHtml({ ...BASE, faq: [] });
    expect(html).not.toContain("DOMANDE FREQUENTI");
  });

  it("omits video block when product_video is not provided", () => {
    const html = buildEmailHtml({ ...BASE });
    expect(html).not.toContain("Guarda la presentazione");
  });

  it("includes video block for a valid youtube URL", () => {
    const html = buildEmailHtml({
      ...BASE,
      product_video: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    });
    expect(html).toContain("Guarda la presentazione");
    expect(html).toContain("dQw4w9WgXcQ");
  });

  it("shows correct badge label for >= 90%", () => {
    const html = buildEmailHtml({ ...BASE, match_percent: 95 });
    expect(html).toContain("MATCH PERFETTO");
  });

  it("shows correct badge label for 80-89%", () => {
    const html = buildEmailHtml({ ...BASE, match_percent: 82 });
    expect(html).toContain("OTTIMO MATCH");
  });

  it("works without optional nome/cognome/email fields", () => {
    const { nome, cognome, email, ...minimal } = BASE;
    const html = buildEmailHtml(minimal);
    expect(html).toContain("Abbiamo trovato il tuo match!");
    expect(html).not.toContain("Ciao");
  });
});
