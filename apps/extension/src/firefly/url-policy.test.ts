import { describe, expect, it } from "vitest";
import { isSupportedFireflyExerciseUrl } from "./url-policy";

describe("isSupportedFireflyExerciseUrl", () => {
  it("accepts the explicit weekly prediction route", () => {
    expect(
      isSupportedFireflyExerciseUrl(
        new URL("https://www.fireflyau.com/ptehome/exercise?pageSource=yc"),
      ),
    ).toBe(true);
  });

  it("accepts the live exercise route after Firefly strips pageSource", () => {
    expect(
      isSupportedFireflyExerciseUrl(
        new URL("https://www.fireflyau.com/ptehome/exercise"),
      ),
    ).toBe(true);
    expect(
      isSupportedFireflyExerciseUrl(
        new URL("https://www.fireflyau.com/ptehome/exercise?harmless=1"),
      ),
    ).toBe(true);
  });

  it("rejects other sources, duplicate sources, and other paths", () => {
    for (const value of [
      "https://www.fireflyau.com/ptehome/exercise?pageSource=practice",
      "https://www.fireflyau.com/ptehome/exercise?pageSource=",
      "https://www.fireflyau.com/ptehome/exercise?pageSource=yc&pageSource=yc",
      "https://www.fireflyau.com/ptehome/exercise?pageSource=yc&pageSource=other",
      "https://www.fireflyau.com/ptehome/mock?pageSource=yc",
      "https://www.fireflyau.com/ptehome/exercise/?pageSource=yc",
      "http://www.fireflyau.com/ptehome/exercise?pageSource=yc",
      "https://fireflyau.com/ptehome/exercise?pageSource=yc",
      "https://evil.fireflyau.com/ptehome/exercise?pageSource=yc",
      "https://www.fireflyau.com:444/ptehome/exercise?pageSource=yc",
    ]) {
      expect(isSupportedFireflyExerciseUrl(new URL(value))).toBe(false);
    }
  });
});
