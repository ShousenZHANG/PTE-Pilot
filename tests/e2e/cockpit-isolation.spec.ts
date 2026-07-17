import { expect, test } from "./extension-fixture";

const exerciseUrl = "https://www.fireflyau.com/ptehome/exercise?pageSource=yc";

test("keeps dynamically added and replaced body children isolated and restores their state", async ({
  extensionContext,
}) => {
  const page = await extensionContext.newPage();
  await page.route("https://www.fireflyau.com/**", async (route) => {
    await route.fulfill({ contentType: "text/html", body: loginFixture() });
  });
  await page.goto(exerciseUrl);
  await expect(page.getByTestId("pte-pilot-root")).toBeVisible();

  await page.evaluate(() => {
    const dynamic = document.createElement("section");
    dynamic.id = "dynamic-shell";
    dynamic.setAttribute("aria-hidden", "false");
    dynamic.setAttribute("data-pte-pilot-isolated", "upstream");
    document.body.append(dynamic);

    const first = document.createElement("section");
    first.id = "spa-first";
    document.body.append(first);
  });

  const dynamic = page.locator("#dynamic-shell");
  await expect(dynamic).toHaveAttribute("inert", "");
  await expect(dynamic).toHaveAttribute("aria-hidden", "true");
  await expect(dynamic).toHaveAttribute(
    "data-pte-pilot-isolated",
    "aria-added",
  );

  await dynamic.evaluate((element) => {
    (element as HTMLElement).inert = false;
    element.removeAttribute("aria-hidden");
    element.setAttribute("data-pte-pilot-isolated", "overwritten");
  });
  await expect(dynamic).toHaveAttribute("inert", "");
  await expect(dynamic).toHaveAttribute("aria-hidden", "true");
  await expect(dynamic).toHaveAttribute(
    "data-pte-pilot-isolated",
    "aria-added",
  );

  await expect(page.locator("#spa-first")).toHaveAttribute("inert", "");
  await page.evaluate(() => {
    const replacement = document.createElement("section");
    replacement.id = "spa-replacement";
    document.querySelector("#spa-first")?.replaceWith(replacement);
  });
  const replacement = page.locator("#spa-replacement");
  await expect(replacement).toHaveAttribute("inert", "");
  await expect(replacement).toHaveAttribute("aria-hidden", "true");

  const host = page.locator("[data-pte-pilot-host]");
  await expect(host).not.toHaveAttribute("inert", "");
  await expect(host).not.toHaveAttribute("aria-hidden", "true");

  await page.keyboard.press("Alt+Shift+KeyP");
  await expect(page.getByTestId("pte-pilot-root")).toBeHidden();
  await expect(dynamic).not.toHaveAttribute("inert", "");
  await expect(dynamic).toHaveAttribute("aria-hidden", "false");
  await expect(dynamic).toHaveAttribute("data-pte-pilot-isolated", "upstream");
  await expect(replacement).not.toHaveAttribute("inert", "");
  await expect(replacement).not.toHaveAttribute("aria-hidden", "true");
  await expect(replacement).not.toHaveAttribute("data-pte-pilot-isolated");
});

test("moves ShadowRoot focus to the phase status during navigation", async ({
  extensionContext,
}) => {
  const page = await extensionContext.newPage();
  await page.route("https://www.fireflyau.com/**", async (route) => {
    await route.fulfill({ contentType: "text/html", body: exerciseFixture() });
  });
  await page.goto(exerciseUrl);
  await expect(page.getByTestId("practice-state")).toContainText("ANSWERING", {
    timeout: 10_000,
  });

  await page.keyboard.press("Alt+KeyJ");
  await expect(page.getByTestId("practice-state")).toContainText("NAVIGATING");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const host = document.querySelector<HTMLElement>(
          "[data-pte-pilot-host]",
        );
        return (host?.shadowRoot?.activeElement as HTMLElement | null)?.dataset
          .testid;
      }),
    )
    .toBe("practice-state");
  await expect(page.getByTestId("practice-state")).toContainText("ANSWERING");
});

test("shows fault help for Shift+/ and clears it before recovery actions", async ({
  extensionContext,
}) => {
  const page = await extensionContext.newPage();
  await page.route("https://www.fireflyau.com/**", async (route) => {
    await route.fulfill({ contentType: "text/html", body: loginFixture() });
  });
  await page.goto(exerciseUrl);
  await expect(page.getByTestId("practice-state")).toContainText(
    "AUTH_REQUIRED",
  );

  await page.keyboard.press("Shift+Slash");
  await expect(page.getByTestId("help-panel")).toBeVisible();
  await page.keyboard.press("KeyR");
  await expect(page.getByTestId("help-panel")).toBeHidden();
  await expect(page.getByTestId("practice-state")).toContainText(
    "AUTH_REQUIRED",
  );

  await page.keyboard.press("Shift+Slash");
  await expect(page.getByTestId("help-panel")).toBeVisible();
  await page.keyboard.press("KeyO");
  await expect(page.getByTestId("pte-pilot-root")).toBeHidden();
});

function loginFixture(): string {
  return "<!doctype html><html><body><main class='login-panel'><h1>Login</h1><input type='password'></main></body></html>";
}

function exerciseFixture(): string {
  return `<!doctype html>
<html>
<body>
  <main id="site-shell">
    <h1 data-prediction-edition="weekly-2026-29">Weekly prediction</h1>
    <strong id="position">WFD 1/3</strong>
    <span id="question-id" data-question-id="131001">131001</span>
    <select aria-label="Select question" id="question-select">
      <option value="131001" data-question-id="131001">1</option>
      <option value="131002" data-question-id="131002">2</option>
      <option value="131003" data-question-id="131003">3</option>
    </select>
    <button id="play">Play</button>
    <textarea id="site-answer" placeholder="Type your answer"></textarea>
    <button id="redo">Redo</button>
    <button id="answer">Answer</button>
    <button id="score">Score</button>
    <button id="previous">Previous</button>
    <button id="next">Next</button>
    <div data-pte-answer hidden></div>
  </main>
  <script>
    const questions = ["131001", "131002", "131003"];
    let current = 0;
    const byId = (id) => document.getElementById(id);
    function render() {
      byId("position").textContent = "WFD " + (current + 1) + "/" + questions.length;
      byId("question-id").textContent = questions[current];
      byId("question-id").dataset.questionId = questions[current];
      byId("question-select").selectedIndex = current;
    }
    byId("next").addEventListener("click", () => {
      if (current >= questions.length - 1) return;
      current += 1;
      render();
    });
    byId("previous").addEventListener("click", () => {
      if (current <= 0) return;
      current -= 1;
      render();
    });
    byId("question-select").addEventListener("change", (event) => {
      current = event.currentTarget.selectedIndex;
      render();
    });
  </script>
</body>
</html>`;
}
