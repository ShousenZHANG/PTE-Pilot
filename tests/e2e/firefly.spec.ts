import { expect, test } from "./extension-fixture";

const exerciseUrl = "https://www.fireflyau.com/ptehome/exercise?pageSource=yc";

test("keyboard-only WFD flow follows Firefly, scores, and records word errors", async ({
  extensionContext,
}) => {
  const page = await extensionContext.newPage();
  await page.route("https://upload.fireflyau.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "audio/wav",
      headers: { "access-control-allow-origin": "*" },
      body: silentWav(),
    });
  });
  await page.route("https://www.fireflyau.com/**", async (route) => {
    await route.fulfill({ contentType: "text/html", body: fireflyFixture() });
  });
  await page.goto(exerciseUrl);

  const cockpit = page.getByTestId("pte-pilot-root");
  await expect(cockpit).toBeVisible();
  await expect(page.getByTestId("practice-state")).toContainText("ANSWERING");
  await expect(page.getByTestId("audio-status")).toContainText("Beginning in");
  await page.keyboard.press("Alt+KeyP");
  await expect(page.getByTestId("audio-status")).toContainText("PLAYING");
  await expect
    .poll(() =>
      page
        .locator("#site-audio")
        .evaluate((element) => !(element as HTMLAudioElement).paused),
    )
    .toBe(true);

  await expect(page.getByTestId("question-position")).toHaveText("1/3");
  await expect(page.getByTestId("index-status")).toContainText("COMPLETE");
  await expect(page.locator("#site-shell")).toHaveAttribute(
    "data-pte-pilot-isolated",
    "aria-added",
  );

  await page.keyboard.press("Alt+KeyR");
  await expect(page.getByTestId("audio-status")).toContainText("PLAYING");
  await expect
    .poll(() =>
      page
        .locator("#site-audio")
        .evaluate((element) => (element as HTMLAudioElement).currentTime < 1.5),
    )
    .toBe(true);

  const answer = page.getByTestId("answer-input");
  await answer.pressSequentially(
    "Students should submit their assignments by Friday",
  );
  await expect(page.locator(".answer-foot output")).toHaveText(
    "Total Word Count: 7",
  );

  await page.keyboard.press("Enter");
  await expect(page.getByTestId("practice-state")).toContainText("REVIEW");
  const review = page.getByTestId("review-result");
  await expect(review).toContainText("before");
  await expect(review).toContainText("by");
  await expect(page.getByTestId("review-answer")).toContainText(
    "Students should submit their assignments before Friday",
  );
  await expect(page.getByTestId("review-translation")).toContainText(
    "fixture translation",
  );
  await expect(page.getByTestId("review-score")).toHaveText("6/7");
  await expect(page.locator(".ai-score")).toBeHidden();

  await page.waitForTimeout(450);
  await page.keyboard.press("KeyT");
  await expect(page.getByTestId("practice-state")).toContainText("ANSWERING");
  await answer.pressSequentially(
    "Students should submit their assignments before Friday",
  );
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("practice-state")).toContainText("REVIEW");
  await expect(page.getByTestId("review-score")).toHaveText("7/7");
  await expect(page.locator(".ai-score")).toBeHidden();

  await page.waitForTimeout(450);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("command-layer")).toBeVisible();
  await page.keyboard.press("KeyW");
  await expect(page.getByTestId("word-library")).toContainText("before");

  await page.getByTestId("drill-start").click();
  const drillInput = page.getByLabel("输入当前单词");
  await drillInput.pressSequentially("bez");
  await expect(page.getByTestId("word-drill")).toBeVisible();
  await expect(drillInput).toHaveValue("be");
  await drillInput.pressSequentially("fore");
  await expect(page.getByTestId("drill-summary")).toContainText(
    "1 词 · 全对 0 · 错键 1",
  );

  await page.keyboard.press("Escape");
  await expect(review).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("command-layer")).toBeVisible();
  await page.keyboard.press("KeyQ");
  await expect(page.getByTestId("ranked-review")).toContainText("错题集");
  await page.getByTestId("wrong-drive-start").click();
  await expect(page.getByTestId("review-queue")).toHaveText("错题循环 1/1");
  await page.keyboard.press("KeyJ");
  await expect(page.getByTestId("review-queue")).toBeHidden();
  await expect(page.getByTestId("question-position")).toHaveText("1/3");

  await page.keyboard.press("KeyJ");
  await expect(page.getByTestId("question-position")).toHaveText("2/3");
  await expect(page.locator("#position")).toHaveText("WFD 2/3");
  await expect(page.locator("#question-id")).toHaveText("131002");
  await expect(answer).toHaveValue("");

  await page.keyboard.press("Alt+KeyK");
  await expect(page.getByTestId("question-position")).toHaveText("1/3");
  await expect(answer).toHaveValue(
    "Students should submit their assignments before Friday",
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
    "Students should submit their assignments before Friday",
  );
});

test("restores the verified set and learning data after a reload", async ({
  extensionContext,
}) => {
  const page = await extensionContext.newPage();
  await page.route("https://upload.fireflyau.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "audio/wav",
      headers: { "access-control-allow-origin": "*" },
      body: silentWav(),
    });
  });
  await page.route("https://www.fireflyau.com/**", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: fireflyFixture({ verified: false }),
    });
  });
  await page.goto(exerciseUrl);

  await expect(page.getByTestId("practice-state")).toContainText("ANSWERING");
  await expect(page.getByTestId("onboarding")).toBeVisible();
  await page
    .getByTestId("onboarding")
    .getByRole("button", { name: "一键建立索引" })
    .click();
  await expect(page.getByTestId("index-status")).toContainText("COMPLETE", {
    timeout: 20_000,
  });
  await expect(page.getByTestId("onboarding")).toBeHidden();

  const answer = page.getByTestId("answer-input");
  await answer.pressSequentially(
    "Students should submit their assignments by Friday",
  );
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("practice-state")).toContainText("REVIEW");
  await expect(page.getByTestId("review-score")).toHaveText("6/7");

  await page.reload();
  await expect(page.getByTestId("practice-state")).toContainText("ANSWERING");
  await expect(page.getByTestId("onboarding")).toBeHidden();
  await expect(page.getByTestId("index-status")).toContainText("COMPLETE");

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("command-layer")).toBeVisible();
  await page.keyboard.press("KeyW");
  await expect(page.getByTestId("word-library")).toContainText("before");
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

/*
 * verified=true mirrors a page that can express its own edition (explicit
 * attribute plus a native select whose options enumerate the set).
 * verified=false mirrors the real production page: a generic heading and an
 * el-select style custom dropdown, which cannot produce a stable edition —
 * the extension must bootstrap and later restore it from storage.
 */
function fireflyFixture(options: { verified?: boolean } = {}): string {
  const verified = options.verified ?? true;
  const heading = verified
    ? '<h1 data-prediction-edition="weekly-2026-29">周预测 weekly-2026-29</h1>'
    : "<h1>周预测</h1>";
  const questionPicker = verified
    ? `<select aria-label="选择题号" id="question-select">
      <option value="131001" data-question-id="131001">1</option>
      <option value="131002" data-question-id="131002">2</option>
      <option value="131003" data-question-id="131003">3</option>
    </select>`
    : `<div class="el-select">
      <input readonly placeholder="选择题号" value="1">
      <ul>
        <li class="el-select-dropdown__item">1</li>
        <li class="el-select-dropdown__item">2</li>
        <li class="el-select-dropdown__item">3</li>
      </ul>
    </div>`;
  return fireflyFixtureBody(heading, questionPicker);
}

function fireflyFixtureBody(heading: string, questionPicker: string): string {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><style>body{font-family:sans-serif}#site-shell{padding:30px}textarea{display:block;width:500px;height:100px}.player-card{width:280px;padding:10px;border:1px solid #ddd}.audio-pause-btn{cursor:pointer}.ai-score[hidden]{display:none}</style></head>
<body>
  <main id="site-shell">
    ${heading}
    <strong id="position">WFD 1/3</strong>
    <span id="question-id" data-question-id="131001">131001</span>
    ${questionPicker}
    <div class="player-card">
      <div class="player-title">正常难度（女1）</div>
      <audio id="site-audio" preload="auto" src="https://upload.fireflyau.com/audio/131001.mp3"></audio>
      <div class="audio-pause-btn">Play</div>
    </div>
    <textarea id="site-answer" placeholder="请输入内容"></textarea>
    <button id="redo">重做</button>
    <button id="answer">答案</button>
    <button id="score">评分</button>
    <button id="previous">上一题</button>
    <button id="next">下一题</button>
    <div class="el-dialog__wrapper ai-score" hidden>
      <div class="el-dialog" role="dialog" aria-modal="true" aria-label="AI 评分">
        <button class="el-dialog__headerbtn" aria-label="Close" type="button">×</button>
        <div class="el-dialog__body">
          <h3 class="h3">本次评分</h3>
          <div>Overall <span class="ai-overall">7/10</span></div>
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
      const nativeSelect = byId("question-select");
      if (nativeSelect) nativeSelect.selectedIndex = current;
      const picker = document.querySelector(".el-select input");
      if (picker) picker.value = String(current + 1);
      byId("site-answer").value = "";
      document.querySelector(".ai-score").hidden = true;
      const audio = byId("site-audio");
      audio.pause();
      audio.src = "https://upload.fireflyau.com/audio/" + question.id + ".mp3";
      audio.load();
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
    document.querySelector(".audio-pause-btn").addEventListener("click", () => {
      const audio = byId("site-audio");
      if (audio.paused) {
        void audio.play();
        document.querySelector(".audio-pause-btn").textContent = "Pause";
      } else {
        audio.pause();
        document.querySelector(".audio-pause-btn").textContent = "Play";
      }
    });
    byId("site-audio").addEventListener("ended", () => {
      document.querySelector(".audio-pause-btn").textContent = "Play";
    });
    byId("score").addEventListener("click", reveal);
    byId("answer").addEventListener("click", reveal);
    document.querySelector(".el-dialog__headerbtn").addEventListener("click", () => {
      document.querySelector(".ai-score").hidden = true;
    });
    byId("redo").addEventListener("click", render);
    byId("next").addEventListener("click", () => { if (current < questions.length - 1) { current += 1; render(); } });
    byId("previous").addEventListener("click", () => { if (current > 0) { current -= 1; render(); } });
    const nativePicker = byId("question-select");
    if (nativePicker) nativePicker.addEventListener("change", (event) => { current = event.currentTarget.selectedIndex; render(); });
    document.querySelectorAll(".el-select-dropdown__item").forEach((item, index) => {
      item.addEventListener("click", () => { current = index; render(); });
    });
  </script>
</body>
</html>`;
}

function silentWav(seconds = 2, sampleRate = 8_000): Buffer {
  const samples = seconds * sampleRate;
  const wav = Buffer.alloc(44 + samples);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + samples, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate, 28);
  wav.writeUInt16LE(1, 32);
  wav.writeUInt16LE(8, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(samples, 40);
  wav.fill(128, 44);
  return wav;
}
