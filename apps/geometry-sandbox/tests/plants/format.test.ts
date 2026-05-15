import { describe, it, expect } from "vitest";
import {
  ecLabel,
  fmtLux,
  fmtMicroS,
  fmtPct,
  fmtTemp,
  parseSunCategory,
  sunCategoryLabel,
} from "../../src/plants/format.js";

describe("plant formatters", () => {
  it("fmtLux uses thin-space thousands and 'lux' suffix", () => {
    expect(fmtLux(3000)).toBe("3 000 lux");
    expect(fmtLux(55000)).toBe("55 000 lux");
    expect(fmtLux(0)).toBe("0 lux");
  });

  it("fmtTemp uses decimal-comma and ° C", () => {
    expect(fmtTemp(12)).toBe("12 °C");
    expect(fmtTemp(-5)).toBe("-5 °C");
  });

  it("fmtPct rounds to integer percent", () => {
    expect(fmtPct(40)).toBe("40 %");
    expect(fmtPct(75)).toBe("75 %");
  });

  it("fmtMicroS uses thin space and µS/cm suffix", () => {
    expect(fmtMicroS(2000)).toBe("2 000 µS/cm");
    expect(fmtMicroS(350)).toBe("350 µS/cm");
  });
});

describe("ecLabel boundaries", () => {
  it("< 800 → Låg näring", () => {
    expect(ecLabel(0)).toBe("Låg näring");
    expect(ecLabel(799)).toBe("Låg näring");
  });

  it("800 ≤ x ≤ 1600 → Medelhög näring", () => {
    expect(ecLabel(800)).toBe("Medelhög näring");
    expect(ecLabel(1200)).toBe("Medelhög näring");
    expect(ecLabel(1600)).toBe("Medelhög näring");
  });

  it("> 1600 → Hög näring", () => {
    expect(ecLabel(1601)).toBe("Hög näring");
    expect(ecLabel(2400)).toBe("Hög näring");
  });
});

describe("parseSunCategory", () => {
  it("returns [] for undefined and empty string", () => {
    expect(parseSunCategory(undefined)).toEqual([]);
    expect(parseSunCategory("")).toEqual([]);
  });

  it("recognises canonical Swedish tokens", () => {
    expect(parseSunCategory("Full sol")).toEqual(["full"]);
    expect(parseSunCategory("Halvskugga")).toEqual(["partial"]);
    expect(parseSunCategory("Skugga")).toEqual(["shade"]);
  });

  it("recognises English equivalents", () => {
    expect(parseSunCategory("Full sun")).toEqual(["full"]);
    expect(parseSunCategory("Partial shade")).toEqual(["partial"]);
    expect(parseSunCategory("Shade")).toEqual(["shade"]);
  });

  it("splits compound categories on '/' preserving order", () => {
    expect(parseSunCategory("Full sol / Halvskugga")).toEqual(["full", "partial"]);
    expect(parseSunCategory("Halvskugga / Full sol")).toEqual(["partial", "full"]);
  });

  it("dedupes repeated tokens", () => {
    expect(parseSunCategory("Full sol / Full sol")).toEqual(["full"]);
  });

  it("ignores unknown segments", () => {
    expect(parseSunCategory("Diffust ljus")).toEqual([]);
    expect(parseSunCategory("Full sol / Okänt")).toEqual(["full"]);
  });

  it("is case-insensitive and tolerates whitespace", () => {
    expect(parseSunCategory("  FULL SOL  ")).toEqual(["full"]);
    expect(parseSunCategory("full sol/halvskugga")).toEqual(["full", "partial"]);
  });
});

describe("sunCategoryLabel", () => {
  it("returns em-dash for undefined", () => {
    expect(sunCategoryLabel(undefined)).toBe("—");
  });

  it("passes through the raw string", () => {
    expect(sunCategoryLabel("Full sol / Halvskugga")).toBe("Full sol / Halvskugga");
  });
});
