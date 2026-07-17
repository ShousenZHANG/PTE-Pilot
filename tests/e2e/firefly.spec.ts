import { expect, test } from "./extension-fixture";

const exerciseUrl = "https://www.fireflyau.com/ptehome/exercise?pageSource=yc";

test("keyboard-only WFD flow follows Firefly, scores, and records word errors", async ({
  extensionContext,
}) => {
  const page = await extensionContext.newPage();
  await page.route("https://upload.fireflyau.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "audio/mpeg",
      headers: { "access-control-allow-origin": "*" },
      body: "fixture-audio",
    });
  });
  await page.route("https://www.fireflyau.com/**", async (route) => {
    await route.fulfill({ contentType: "text/html", body: fireflyFixture() });
  });
  await page.goto(exerciseUrl);

  const cockpit = page.getByTestId("pte-pilot-root");
  await expect(cockpit).toBeVisible();
  await expect(page.getByTestId("practice-state")).toContainText("ANSWERING");
  await expect(page.getByTestId("question-position")).toHaveText("1/3");
  await expect(page.getByTestId("index-status")).toContainText("COMPLETE");
  await expect(page.locator("#site-shell")).toHaveAttribute(
    "data-pte-pilot-isolated",
    "aria-added",
  );

  const answer = page.getByTestId("answer-input");
  await answer.pressSequentially(
    "Students should submit their assignments by Friday",
  );
  await expect(page.locator(".answer-foot output")).toHaveText(
    "Total Word Count: 7",
  );
  await page.keyboard.press("Alt+KeyP");
  await expect
    .poll(() => page.locator("#aplayer-control").getAttribute("data-count"))
    .toBe("1");
  await expect(page.getByTestId("audio-status")).toContainText("PLAYING");

  await page.keyboard.press("Alt+KeyR");
  await expect
    .poll(() => page.locator("#aplayer-back").getAttribute("data-count"))
    .toBe("1");
  await expect(page.getByTestId("audio-status")).toContainText("PLAYING");
  await expect(page.locator("#aplayer-control")).toHaveAttribute(
    "data-fetch-count",
    "1",
  );

  await page.keyboard.press("Enter");
  await expect(page.getByTestId("practice-state")).toContainText("REVIEW");
  const review = page.getByTestId("review-result");
  await expect(review).toContainText("before");
  await expect(review).toContainText("by");

  await page.waitForTimeout(450);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("command-layer")).toBeVisible();
  await page.keyboard.press("KeyW");
  await expect(page.getByTestId("word-library")).toContainText("before");

  await page.keyboard.press("Escape");
  await expect(review).toBeFocused();
  await page.keyboard.press("KeyJ");
  await expect(page.getByTestId("question-position")).toHaveText("2/3");
  await expect(page.locator("#position")).toHaveText("WFD 2/3");
  await expect(page.locator("#question-id")).toHaveText("131002");
  await expect(answer).toHaveValue("");

  await page.keyboard.press("Alt+KeyK");
  await expect(page.getByTestId("question-position")).toHaveText("1/3");
  await expect(answer).toHaveValue(
    "Students should submit their assignments by Friday",
  );

  await page.keyboard.press("Alt+Shift+KeyP");
  await expect(cockpit).toBeHidden();
  await expect(page.locator("#site-shell")).not.toHaveAttribute("inert", "");
  await expect(page.locator("#site-shell")).not.toHaveAttribute(
    "data-pte-pilot-isolated",
  );
  await page.keyboard.press("Alt+Shift+KeyP");
  await expect(cockpit).toBeVisible();
  await expect(answer).toHaveValue(
    "Students should submit their assignments by Friday",
  );
});

test("same-URL login page fails closed as AUTH_REQUIRED", async ({
  extensionContext,
}) => {
  const page = await extensionContext.newPage();
  await page.route("https://www.fireflyau.com/**", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><html><body><main class='login-panel'><h1>登录</h1><input type='password'></main></body></html>",
    });
  });
  await page.goto(exerciseUrl);

  await expect(page.getByTestId("pte-pilot-root")).toBeVisible();
  await expect(page.getByTestId("practice-state")).toContainText(
    "AUTH_REQUIRED",
  );
  await expect(page.getByTestId("recovery-retry")).toBeVisible();
});

function fireflyFixture(): string {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><style>body{font-family:sans-serif}#site-shell{padding:30px}textarea{display:block;width:500px;height:100px}.aplayer-bar-wrap{width:160px;height:8px}.aplayer-button,.aplayer-icon-back{display:none}.ai-score[hidden]{display:none}</style></head>
<body>
  <main id="site-shell">
    <h1 data-prediction-edition="weekly-2026-29">周预测 weekly-2026-29</h1>
    <strong id="position">WFD 1/3</strong>
    <span id="question-id" data-question-id="131001">131001</span>
    <select aria-label="选择题号" id="question-select">
      <option value="131001" data-question-id="131001">1</option>
      <option value="131002" data-question-id="131002">2</option>
      <option value="131003" data-question-id="131003">3</option>
    </select>
    <div class="aplayer">
      <div class="aplayer-bar-wrap"></div>
      <div id="aplayer-control" class="aplayer-button aplayer-play"></div>
      <span id="aplayer-back" class="aplayer-icon-back"></span>
      <ol class="aplayer-list"><li>1</li></ol>
    </div>
    <div class="audio-pause-btn">Play</div>
    <textarea id="site-answer" placeholder="请输入内容"></textarea>
    <button id="redo">重做</button>
    <button id="answer">答案</button>
    <button id="score">评分</button>
    <button id="previous">上一题</button>
    <button id="next">下一题</button>
    <div class="el-dialog__wrapper ai-score" hidden>
      <div class="el-dialog" role="dialog" aria-modal="true" aria-label="AI 评分">
        <div class="el-dialog__body">
          <h3 class="h3">答案</h3>
          <pre id="score-answer"><span class="oneword">Stale</span> answer from another question.</pre>
          <h3 class="h3">译文</h3>
          <pre>fixture translation</pre>
        </div>
      </div>
    </div>
  </main>
  <script>
    const questions = [
      { id: "131001", answer: "Students should submit their assignments before Friday" },
      { id: "131002", answer: "The library will remain open during the summer" },
      { id: "131003", answer: "Economic growth depends on sustainable development" }
    ];
    let current = 0;
    const byId = (id) => document.getElementById(id);
    function render() {
      const question = questions[current];
      byId("position").textContent = "WFD " + (current + 1) + "/" + questions.length;
      byId("question-id").textContent = question.id;
      byId("question-id").dataset.questionId = question.id;
      byId("question-select").selectedIndex = current;
      byId("site-answer").value = "";
      document.querySelector(".ai-score").hidden = true;
      byId("aplayer-control").className = "aplayer-button aplayer-play";
      delete byId("aplayer-control").dataset.fetchCount;
      delete byId("aplayer-control").dataset.count;
      delete byId("aplayer-back").dataset.count;
      document.querySelector(".audio-pause-btn").textContent = "Play";
    }
    function setScoreAnswer(answer) {
      const node = byId("score-answer");
      node.replaceChildren();
      answer.split(" ").forEach((word, index) => {
        if (index > 0) node.append(document.createTextNode(" "));
        const span = document.createElement("span");
        span.className = "oneword";
        span.textContent = word;
        node.append(span);
      });
    }
    function reveal() {
      document.querySelector(".ai-score").hidden = false;
      setTimeout(() => setScoreAnswer(questions[current].answer), 10);
    }
    byId("aplayer-control").addEventListener("click", () => {
      const control = byId("aplayer-control");
      if (control.classList.contains("aplayer-pause")) {
        control.className = "aplayer-button aplayer-play";
        document.querySelector(".audio-pause-btn").textContent = "Play";
        return;
      }
      control.className = "aplayer-button aplayer-pause";
      document.querySelector(".audio-pause-btn").textContent = "Pause";
      control.dataset.count = String(Number(control.dataset.count || 0) + 1);
      if (!control.dataset.fetchCount) {
        control.dataset.fetchCount = "1";
        void fetch("https://upload.fireflyau.com/audio/" + questions[current].id + ".mp3", { cache: "no-store" });
      }
    });
    byId("aplayer-back").addEventListener("click", () => {
      const back = byId("aplayer-back");
      back.dataset.count = String(Number(back.dataset.count || 0) + 1);
      byId("aplayer-control").className = "aplayer-button aplayer-pause";
      document.querySelector(".audio-pause-btn").textContent = "Pause";
    });
    byId("score").addEventListener("click", reveal);
    byId("answer").addEventListener("click", reveal);
    byId("redo").addEventListener("click", render);
    byId("next").addEventListener("click", () => { if (current < questions.length - 1) { current += 1; render(); } });
    byId("previous").addEventListener("click", () => { if (current > 0) { current -= 1; render(); } });
    byId("question-select").addEventListener("change", (event) => { current = event.currentTarget.selectedIndex; render(); });
  </script>
</body>
</html>`;
}
