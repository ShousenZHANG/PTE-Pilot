import { describe, expect, it } from "vitest";
import { verifiedPredictionEdition } from "./dom-adapter";

describe("verifiedPredictionEdition", () => {
  it("rejects a generic weekly heading and client calendar fallback", () => {
    for (const heading of [
      "Weekly prediction",
      "Weekly prediction - 100 questions",
      "Weekly prediction W29",
      "周预测 100题",
    ]) {
      expect(() =>
        verifiedPredictionEdition({
          explicitValues: [],
          headingTexts: [heading],
          optionQuestionIds: [],
          expectedTotal: 192,
        }),
      ).toThrow("question:prediction-edition-unverified");
    }
  });

  it("accepts only headings with a full site-owned year and week/date", () => {
    for (const heading of [
      "Weekly prediction 2026 W29",
      "周预测 2026年第29周",
      "Weekly prediction 2026-07-16",
    ]) {
      expect(
        verifiedPredictionEdition({
          explicitValues: [],
          headingTexts: [heading],
          optionQuestionIds: [],
          expectedTotal: 192,
        }),
      ).toBe(heading);
    }
  });

  it("rejects conflicting visible edition evidence", () => {
    for (const evidence of [
      {
        explicitValues: ["weekly-2026-W29", "weekly-2026-W30"],
        headingTexts: [] as string[],
      },
      {
        explicitValues: [] as string[],
        headingTexts: [
          "Weekly prediction 2026 W29",
          "Weekly prediction 2026 W30",
        ],
      },
      {
        explicitValues: ["weekly-2026-W29"],
        headingTexts: ["Weekly prediction 2026 W30"],
      },
    ]) {
      expect(() =>
        verifiedPredictionEdition({
          ...evidence,
          optionQuestionIds: [],
          expectedTotal: 192,
        }),
      ).toThrow("question:prediction-edition-ambiguous");
    }
    expect(
      verifiedPredictionEdition({
        explicitValues: ["weekly-2026-W29", "weekly-2026-W29"],
        headingTexts: ["Weekly prediction 2026 W29"],
        optionQuestionIds: [],
        expectedTotal: 192,
      }),
    ).toBe("weekly-2026-W29");
  });

  it("derives a stable namespace from a complete ordered question set", () => {
    const first = verifiedPredictionEdition({
      explicitValues: [],
      headingTexts: ["Weekly prediction"],
      optionQuestionIds: ["131001", "131002", "131003"],
      expectedTotal: 3,
    });
    const second = verifiedPredictionEdition({
      explicitValues: [],
      headingTexts: ["Weekly prediction"],
      optionQuestionIds: ["131001", "131004", "131003"],
      expectedTotal: 3,
    });

    expect(first).toMatch(/^yc-set-3-[0-9a-f]{16}$/u);
    expect(second).not.toBe(first);
  });

  it("accepts a site-owned explicit edition and rejects incomplete options", () => {
    expect(
      verifiedPredictionEdition({
        explicitValues: ["weekly-2026-W29"],
        headingTexts: [],
        optionQuestionIds: [],
        expectedTotal: 192,
      }),
    ).toBe("weekly-2026-W29");
    expect(() =>
      verifiedPredictionEdition({
        explicitValues: [],
        headingTexts: ["周预测"],
        optionQuestionIds: ["131001"],
        expectedTotal: 192,
      }),
    ).toThrow("question:prediction-edition-unverified");
  });
});
