# PTE Pilot

[![CI](https://github.com/ShousenZHANG/PTE-Pilot/actions/workflows/ci.yml/badge.svg)](https://github.com/ShousenZHANG/PTE-Pilot/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

> **免责声明 / Disclaimer**
>
> 本项目是独立的第三方个人练习工具，**与萤火虫教育（fireflyau.com）、Pearson
> 及 PTE 考试官方均无任何隶属、合作或授权关系**。"PTE" 为 Pearson 的商标，此处
> 仅作描述性使用。
>
> 本仓库**不包含、不分发、不转售任何题库内容**——没有题目句子、没有音频、没有
> 译文。插件只在使用者自己的浏览器中运行，需要使用者**自备有效的萤火虫账号与
> 订阅**；所有题目、音频与原始评分服务始终由萤火虫本站提供。本地只保存使用者
> **自己的练习记录**（题号、正确率、自己拼错的单词）。
>
> 使用本工具需自行遵守萤火虫的服务条款与订阅范围，风险由使用者自负。若权利方
> 认为本项目有任何不当之处，请提 issue 联系，我会配合处理。
>
> This is an independent personal study tool with **no affiliation,
> partnership, or endorsement from Firefly Education (fireflyau.com), Pearson,
> or the official PTE exam**. It contains and distributes **no question-bank
> content whatsoever**. It requires your own valid Firefly account and
> subscription, and stores only your own practice records locally. Use at your
> own risk and in accordance with Firefly's terms of service. Rights holders:
> please open an issue and I will respond.

Local-first, keyboard-first Chrome (MV3) extension that rebuilds the Firefly
PTE **Write From Dictation** practice experience: an exam-replica cockpit,
zero-latency typing, instant audio control through a MAIN-world hook (even
when the site keeps its player off-DOM), in-cockpit AI scoring with a
word-level diff, spaced-repetition review, a wrong-question drive, and a
typing drill built from your frequently missed words. Your index and
learning data are stored locally and survive reloads.

The Firefly site keeps providing login, questions, original audio, scoring
and navigation. PTE Pilot never exports the question bank, never stores full
answer sentences, and never bypasses any entitlement. Manifest permissions:
`storage` plus `https://www.fireflyau.com/*` — nothing else.

纯本地、键盘优先的 Chrome MV3 萤火虫 WFD 练习扩展。萤火虫继续提供登录、题目、
原始音频、评分与切题；插件只重做练习体验，不导出题库、不存完整答案、不绕过任何权限。

---

## 安装 / Install

1. 从 [Releases](https://github.com/ShousenZHANG/PTE-Pilot/releases) 下载最新
   `PTE-Pilot-*-chrome.zip` 并解压（升级时**覆盖解压到同一目录**，数据不丢）
2. 打开 `chrome://extensions`，开启右上角**开发者模式**
3. 点击**加载已解压的扩展程序**，选择解压后的目录

## 首次设置（照做即可）/ First-time setup

1. 登录萤火虫，进入 **PTE 练习 → 周预测** 的 WFD 题目列表
2. **随机点进任意一道题**（进入正常做题页面）
3. **刷新一次网页**（`F5`）——插件驾驶舱会自动全屏出现（没出现就按
   `Alt+Shift+P`）
4. 顶部橙色横幅点击 **「一键建立索引」**，等它自动遍历完当前题集
   （周预测约一两百题，几分钟；索引期间不要操作原网页）
5. 索引完成后一切解锁：错题、错词自动长期记录，`Esc → Q` 错题集、
   `Esc → W` 错词库随时可看。**此设置只需做一次**，之后每次打开
   都自动恢复（换周预测新题集后重建一次即可）

## 日常练习 / Daily loop

1. **刷题**：进题自动 5 秒倒计时后播放 → 直接打字（`Enter` 换行，支持先敲
   首字母试词——评分按真实考试规则，多写不扣分）→ `Ctrl+Enter` 提交 →
   驾驶舱内直接出 AI 评分（得分、逐词绿/删除线/红括号、答案、译文）→
   `Enter` 下一题
2. **刷错题**：`Esc` → `Q` → 点**只刷错题** → `Enter/J` 只在错题之间循环，
   刷完一轮自动退出
3. **练错词**：`Esc` → `W` → 勾选高频错词 → **开始打字训练**，打对变绿、
   打错拒键，刷题前热手

复习顺序由本地间隔重复驱动：答错 30 分钟内重来，全对按 1/2/4/7 天指数退场。

## 快捷键 / Shortcuts

| 键 | 作用 |
|---|---|
| `Alt+Shift+P` | 打开 / 关闭驾驶舱 |
| `Alt+P` | 播放 / 暂停（5 秒倒计时为考试式强制预备，期间播放键锁定） |
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

**本地只保存这些**（全部在本机 IndexedDB，无遥测、无服务器、无外部请求）：

| 保存 | 不保存 |
|---|---|
| 题号、题序、标签、时间戳 | ❌ 题目句子原文 |
| 你的正确率、用时、重播次数 | ❌ 音频文件（由页面自身播放元素播放，不下载不归档） |
| 你自己拼错的单词对 | ❌ 译文与完整答案（仅在当次评分界面出现，刷新即消失） |

换句话说，本地数据是**一份以题号为索引的个人成绩单**，不是题库副本。索引功能
只记录题号与题序，用于定位你自己的错题，不抓取任何题目内容。

- 插件不绕过登录、付费或任何权限校验；未登录/无订阅时它什么也做不了
- 权限最小化：仅 `storage` 与 `https://www.fireflyau.com/*`
- 使用者需自行遵守萤火虫服务条款与个人订阅范围

## License

[MIT](./LICENSE) · Issues and PRs welcome.
