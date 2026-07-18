# PTE Pilot

[![CI](https://github.com/ShousenZHANG/PTE-Pilot/actions/workflows/ci.yml/badge.svg)](https://github.com/ShousenZHANG/PTE-Pilot/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Local-first, keyboard-first Chrome (MV3) extension that rebuilds the Firefly
PTE **Write From Dictation** practice experience: an exam-replica cockpit,
zero-latency typing, in-cockpit AI scoring with a word-level diff,
spaced-repetition review, a wrong-question drive, and a typing drill built
from your frequently missed words.

The Firefly site keeps providing login, questions, original audio, scoring
and navigation. PTE Pilot never exports the question bank, never stores full
answer sentences, and never bypasses any entitlement. Manifest permissions:
`storage` plus `https://www.fireflyau.com/*` — nothing else.

纯本地、键盘优先的 Chrome MV3 萤火虫 WFD 练习扩展。萤火虫继续提供登录、题目、
原始音频、评分与切题；插件只重做练习体验，不导出题库、不存完整答案、不绕过任何权限。

---

## 安装 / Install

1. 从 [Releases](https://github.com/ShousenZHANG/PTE-Pilot/releases) 下载最新
   `PTE-Pilot-*-chrome.zip` 并解压
2. 打开 `chrome://extensions`，开启右上角**开发者模式**
3. 点击**加载已解压的扩展程序**，选择解压后的目录
4. 登录并打开萤火虫 WFD 练习页（建议周预测入口）：
   `https://www.fireflyau.com/ptehome/exercise?pageSource=yc`
5. 刷新页面，按 `Alt+Shift+P` 打开驾驶舱

## 三分钟上手 / Quick guide

1. **建索引（首次一次）**：顶部橙色横幅点击**一键建立索引**。建立后才会
   长期记录错题、错词，并解锁复习与训练。若当前页超过 300 题，先在萤火虫
   切到周预测页再建
2. **刷题**：进入题目自动倒计时播放（`Alt+P` 跳过等待）→ 直接打字 →
   `Enter` 提交 → 驾驶舱内直接出 AI 评分（得分条、逐词绿/红/删除线、
   答案、译文）→ `Enter` 下一题
3. **刷错题**：`Esc` → `Q` 打开**错题集** → 点**只刷错题** → `Enter/J`
   只在错题之间循环，刷完一轮自动退出
4. **练错词**：`Esc` → `W` 打开**错词库** → 勾选 → **开始打字训练**，
   打对变绿、打错拒键，刷题前热手

复习顺序由本地间隔重复驱动：答错 30 分钟内重来，全对按 1/2/4/7 天指数退场。

## 快捷键 / Shortcuts

| 键 | 作用 |
|---|---|
| `Alt+Shift+P` | 打开 / 关闭驾驶舱 |
| `Alt+P` | 播放 / 暂停（倒计时中 = 立即播放） |
| `Alt+R` | 从头重播 |
| `Ctrl+Enter` | 提交（输入框内 `Enter` 为换行）；结果页 `Enter` = 下一题 |
| `Alt+J` / `Alt+K` | 下一题 / 上一题 |
| `Alt+M` | 标记本题（复习优先） |
| `Esc` | 命令层：`Q` 错题集 · `W` 错词库 · `E` 考试模式 · `S` 设置 · `B` 建索引 |
| 结果页 `T` / `K` / `R` | 重做 / 上一题 / 重播 |

底部导航栏有对应按钮，全部支持鼠标点击。`Alt` 系列键位可在设置中自定义。

## 从源码构建 / Build from source

Node `>=24.14 <25`, pnpm `>=11.7 <12`:

```sh
pnpm install --frozen-lockfile
pnpm build          # 扩展输出到 apps/extension/.output/chrome-mv3
pnpm verify         # lint + typecheck + unit + build + e2e（与 CI 相同门禁）
```

## 隐私与边界 / Privacy & boundaries

- 所有学习数据只存本机 IndexedDB；无遥测、无外部服务
- 只在评分后短暂读取正确答案计算词级差异，不落盘完整句子
- 音频由页面自身的播放元素播放，不下载、不归档
- 使用者需自行遵守萤火虫服务条款与个人订阅范围

## License

[MIT](./LICENSE) · Issues and PRs welcome.
