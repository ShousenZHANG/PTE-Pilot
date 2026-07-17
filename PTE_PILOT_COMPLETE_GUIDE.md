# PTE Pilot 完整项目文档

> 文档状态：与当前仓库源码同步。面向使用者、维护者和后续开发者。
> 项目路径：`D:\PTE_Pilot`
> 主要目标：在萤火虫 WFD 原网页登录态内，提供全键盘、低干扰、Local-first 的 PTE 听写练习体验。

## 1. 项目结论

PTE Pilot 是 Chrome Manifest V3 浏览器扩展，不是独立题库，也不绕过萤火虫权限。

它负责：

- 读取当前萤火虫 WFD 题号、位置、总题数和标签。
- 继续使用萤火虫原始音频、评分、答案揭示和上一题/下一题。
- 在独立 Shadow DOM 驾驶舱中提供专注输入框和全键盘控制。
- 提交后只计算词级差异，不保存完整正确句子。
- 对已验证题集保存草稿、错词统计、题目进度和复习顺序。
- 可选连接本机 Gateway 与隔离的 Hermes memory profile。

它不负责：

- 登录、破解付费权限、绕过验证码、限流或站点访问控制。
- 批量下载音频、导出萤火虫完整答案库。
- 让 AI 控制浏览器、播放、切题、提交或答案揭示。
- 直接使用 ChatGPT 账号 OAuth。当前 AI 边界是可选的本机 Hermes API。

## 2. 当前实现状态

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| Chrome MV3 扩展 | 已实现 | WXT + React 19 + TypeScript |
| 当前页优先 | 已实现 | 打开页面后先练当前题，不自动遍历全部题目 |
| `<li>` 位置识别 | 已实现 | 支持萤火虫直接在列表项显示 `WFD 7/1256` |
| 原网页同步切题 | 已实现 | 插件下一题/上一题会驱动原网页并校验结果 |
| 原始音频控制 | 已实现 | 使用萤火虫播放器；只观察唯一音频请求，不建立下载库 |
| 键盘优先输入 | 已实现 | 原生 textarea，不受 React 逐键重渲染影响 |
| 评分与词级差异 | 已实现 | 答案仅在可信评分/揭示后读取并立即降维为错误事实 |
| 本地 IndexedDB | 已实现 | 草稿、尝试、错词、题目进度、索引、设置、outbox |
| 显式完整索引 | 已实现 | 只有命令层 `B` 会遍历全部题目；可按 `X` 取消 |
| Local ranking | 已实现 | Hermes 不可用时仍可生成确定性本地顺序 |
| 本机 Gateway | 已实现 | Fastify + SQLite，仅监听 `127.0.0.1:8642` |
| Hermes memory/ranking | 可选 | 仅允许隔离的 `memory + no_mcp` profile |
| 自动获取“固定 192 题” | 受原网页限制 | 插件读取当前页面实际题集；页面显示 1256 就不会伪装成 192 |

## 3. 最关键的“当前页优先”行为

### 3.1 为什么不再一次性加载全部

萤火虫页面可能没有稳定、可验证的周预测版本号。旧做法为了生成题集身份，会在启动时遍历所有题目；当页面是完整 WFD 库时，总数可能是 1256，启动体验很差，也更容易受页面变化影响。

现在流程如下：

1. 插件读取当前页面的 `题号 + 位置/总数 + 控件`。
2. 如果网页提供稳定题集版本，直接进入已验证模式。
3. 如果只有题目、没有稳定版本，创建 `session:<随机令牌>` 当前标签页身份。
4. 当前题立即可听、可打字、可提交、可切换。
5. 每次切题只把刚访问的题增量加入内存索引。
6. 初始化绝不自动遍历 192、1256 或任何完整题集。

### 3.2 会话模式的数据边界

`session:` 是未验证题集，只存在当前扩展上下文：

- 草稿只放内存。
- 标记只放内存。
- 已访问题目的增量索引只放内存。
- 可以评分并查看本次词级差异。
- 不写 IndexedDB 的题集数据。
- 不写错误历史、outbox、Gateway 或 Hermes 长期记忆。
- 不执行 Hermes 自动健康检查或 AI 排名。

后台 Service Worker 还有第二道 fail-closed 防线：任何携带 `session:` 或 `provisional:` 题集身份的 runtime 存储/排名请求都会被拒绝为 `invalid-request`。

### 3.3 什么时候建立完整索引

只有你明确执行以下操作时才遍历全题集：

1. 按 `Esc` 打开命令层。
2. 按 `B` 建立完整索引。
3. 索引期间不要操作原网页。
4. 按 `X` 可取消并恢复当前题。

遍历完成后，插件根据完整有序题号生成 `yc-set-<总数>-<hash>` 身份，保存经过验证的索引，然后启用持久草稿、错词、复习和 Hermes 记忆链路。

注意：如果当前页面显示 `WFD 7/1256`，完整索引就是 1256 题。若只想处理周预测，请先在萤火虫原网页进入真正的周预测筛选页面；推荐入口：

`https://www.fireflyau.com/ptehome/exercise?pageSource=yc`

插件不会自行猜测或伪造“192 题”。周预测题数由萤火虫当前页面决定，也可能随周更新。

## 4. 系统架构

```text
萤火虫 exercise 页面
  ├─ FireflyDomAdapter：语义读取题号、位置、控件、标签
  ├─ NavigationCoordinator：切题 + epoch 防串题
  ├─ AudioBroker：驱动站点播放器 + 校验唯一音频请求
  ├─ AnswerGate：评分/揭示证明 + 词级差异
  └─ React Shadow DOM Cockpit：输入、状态、快捷键、命令层
                │
                │ chrome.runtime 严格消息合同
                ▼
扩展 Service Worker
  ├─ Runtime handler：来源和 schema 校验
  ├─ Dexie / IndexedDB：本地事实库
  ├─ Outbox synchronizer：幂等事件同步
  └─ Audio capture：仅观察当前标签页的唯一音频响应
                │
                │ http://127.0.0.1:8642（可选）
                ▼
PTE Gateway
  ├─ Fastify API
  ├─ SQLite 学习投影
  ├─ 一次性配对码 + Bearer token
  ├─ 本地确定性 ranking
  └─ Hermes adapter（可选）
                │
                │ http://127.0.0.1:8643（可选）
                ▼
隔离 Hermes profile
  └─ 只允许 memory_store / memory_recall；MCP 禁用
```

## 5. 主要组件

### 5.1 `apps/extension`

- `entrypoints/firefly.content.tsx`：匹配受支持的萤火虫 exercise URL，挂载 Shadow DOM UI。
- `entrypoints/background.ts`：启动 runtime、存储、Gateway 同步和音频观察。
- `src/app/Cockpit.tsx`：驾驶舱 UI、键盘事件和命令面板。
- `src/app/practice-controller.ts`：练习总协调器、当前页会话模式、持久模式。
- `src/app/keyboard.ts`：状态化快捷键路由和自定义键位校验。
- `src/firefly/dom-adapter.ts`：萤火虫 DOM 语义适配，不依赖脆弱的单一 CSS 类。
- `src/firefly/navigation-coordinator.ts`：切题后等待身份变化并校验 epoch。
- `src/firefly/audio-broker.ts`：站点播放器控制与音频绑定。
- `src/firefly/answer-gate.ts`：提交、评分、答案揭示所有权证明。
- `src/firefly/question-indexer.ts`：当前题学习、结构化发现、显式遍历。
- `src/firefly/prediction-edition-bootstrap.ts`：完整题集验证和确定性版本生成。
- `src/background/storage/`：Dexie 数据库与 repository。
- `src/background/runtime-handler.ts`：消息边界和临时题集拒绝逻辑。
- `src/background/audio-capture.ts`：4 秒窗口内观察唯一 `audio/*` 响应。
- `src/background/gateway-http-client.ts`：本机 Gateway 客户端。
- `src/background/outbox-synchronizer.ts`：重试、租约和幂等批次同步。
- `src/learning/`：本地排名和 Gateway fallback。

### 5.2 `apps/gateway`

- `src/main.ts` / `src/server.ts`：本机 Fastify 服务。
- `src/routes/health.ts`：健康状态。
- `src/routes/pairing.ts`：一次性配对。
- `src/routes/events.ts`：尝试事件批量 upsert。
- `src/routes/rank.ts`：受限候选集排名。
- `src/db/database.ts`：SQLite schema 和连接。
- `src/projection/attempt-projection.ts`：从尝试事件重建学习状态。
- `src/ranking/rank-service.ts`：本地排序与 Hermes fallback。
- `src/memory/memory-sync.ts`：Hermes memory 同步。
- `src/hermes/hermes-client.ts`：Hermes 能力发现与严格校验。
- `src/security/`：Origin、Bearer 和配对码安全边界。
- `scripts/install-startup.ps1`：Windows 登录启动任务。

### 5.3 `packages/contracts`

共享 Zod/TypeScript 合同：

- Firefly 题目和能力类型。
- Draft、Attempt、Index、Settings 和 WordStat。
- 扩展 runtime 请求/响应。
- Gateway event、rank、health、pairing。

所有跨上下文消息先过 schema 校验，不接受任意对象。

### 5.4 `tests/e2e`

Playwright 覆盖：

- Manifest 权限边界。
- Firefly fixture 交互。
- Cockpit Shadow DOM 隔离。
- 基础端到端练习链路。

## 6. 本地数据模型

扩展数据库名：`pte-pilot-facts-v1`。

| 表 | 用途 |
| --- | --- |
| `drafts` | 已验证题集的逐题草稿 |
| `attempts` | 尝试事实，不含完整正确句子 |
| `outbox` | 等待发送给 Gateway 的幂等事件 |
| `wordStats` | expected/actual/type 词级错误统计 |
| `questionProgress` | 尝试次数、错误数、准确率、dueAt、marked |
| `questions` | 已验证题集的题号与站点位置 |
| `snapshots` | 题集索引完整性和 checkpoint |
| `sessions` | 上次已验证题目的恢复位置 |
| `settings` | 模式和快捷键 |
| `meta` | learner state / projection 版本 |

完整答案文本只在可信揭示后的内存计算中短暂出现，随后转为词级错误事实。音频内容不写数据库。

## 7. Chrome 安装与授权

### 7.1 直接使用最新包

仓库根目录生成包：`PTE-Pilot-Chrome-latest.zip`。

Chrome 开发者模式不能直接“加载 ZIP”，需要先解压：

```powershell
Expand-Archive -LiteralPath "D:\PTE_Pilot\PTE-Pilot-Chrome-latest.zip" `
  -DestinationPath "D:\PTE_Pilot\PTE-Pilot-Chrome-latest" -Force
```

然后：

1. 打开 `chrome://extensions`。
2. 打开右上角“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择 `D:\PTE_Pilot\PTE-Pilot-Chrome-latest`。
5. 打开萤火虫 exercise 页面并正常登录。
6. 刷新萤火虫页面一次。
7. 按 `Alt+Shift+P` 打开驾驶舱。

也可直接选择构建目录：

`D:\PTE_Pilot\apps\extension\.output\chrome-mv3`

### 7.2 权限说明

Manifest 只申请：

- `storage`：扩展设置和本地数据。
- `webRequest`：观察当前播放触发的音频响应。
- `https://www.fireflyau.com/*`：读取和驱动练习页面。
- `https://upload.fireflyau.com/*`：识别萤火虫音频响应。
- `http://127.0.0.1:8642/*`：可选本机 Gateway。

不申请 cookies、downloads、debugger、全部网站或远程控制权限。

萤火虫授权来自你在原网页的正常登录态。插件不读取密码，也没有额外的“题库授权码”。若 Chrome 把站点访问设成“点击时”，在扩展详情中把 `fireflyau.com` 改为“在此网站上”。

## 8. 使用流程

### 8.1 最短流程

1. 打开 `https://www.fireflyau.com/ptehome/exercise?pageSource=yc`。
2. 确认原网页显示一题 WFD、播放按钮、输入框、评分和切题按钮。
3. 按 `Alt+Shift+P`。
4. 按 `Alt+P` 播放。
5. 直接打字。
6. 按 `Enter` 提交。
7. 查看词级错误。
8. 按 `Enter` 或 `J` 下一题；`K` 上一题。

### 8.2 默认快捷键

| 状态 | 按键 | 动作 |
| --- | --- | --- |
| 任意页面状态 | `Alt+Shift+P` | 打开/关闭驾驶舱 |
| 答题 | `Enter` | 提交一次 |
| 答题 | `Alt+P` | 播放/暂停原始音频 |
| 答题 | `Alt+R` | 从头重播 |
| 答题 | `Alt+J` | 下一题 |
| 答题 | `Alt+K` | 上一题 |
| 答题 | `Alt+M` | 标记/取消标记 |
| 答题/复盘 | `Esc` | 打开命令层 |
| 复盘 | `Enter` 或 `J` | 下一题 |
| 复盘 | `K` | 上一题 |
| 复盘 | `Space` | 播放/暂停 |
| 复盘 | `R` | 重播 |
| 复盘 | `T` | 重做本题 |
| 命令层 | `P` / `R` | 播放 / 重播 |
| 命令层 | `J` / `K` | 下一题 / 上一题 |
| 命令层 | `M` | 标记 |
| 命令层 | `E` | 练习/考试模式切换 |
| 命令层 | `Q` | 排名复习 |
| 命令层 | `W` | 错词库 |
| 命令层 | `S` | 设置/Gateway 配对 |
| 命令层 | `B` | 显式建立完整索引 |
| 命令层 | `I` | 聚焦输入框 |
| 命令层 | `?` | 帮助 |
| 普通索引中 | `Esc` | 暂停 |
| 已暂停 | `Enter` 或 `R` | 继续 |
| 索引中 | `X` | 取消并恢复起始题 |
| 故障页 | `R` | 重试 |
| 故障页 | `O` | 返回原网页 |

`Alt+P/R/J/K/M` 可在设置内改成其他不重复的单个英文字母。

### 8.3 满分打字体验原则

- 输入框保持原生 uncontrolled textarea。
- 打字期间不向萤火虫 input 逐字同步，避免卡顿和站点监听器干扰。
- 提交时才执行一次 native write，再触发站点评分。
- 组合输入、按键长按、提交后的 Enter 抬起均有保护。
- 切题、提交、答案揭示和音频都绑定当前题号与单调递增 epoch，避免串题。

## 9. 音频工作方式

音频仍由萤火虫原播放器提供：

1. 插件先为“当前题号 + navigation epoch”建立捕获绑定。
2. 点击/快捷键驱动萤火虫播放控件。
3. Service Worker 在 4 秒窗口内观察 `upload.fireflyau.com` 请求。
4. 只接受 HTTP 2xx/3xx 且 `Content-Type: audio/*` 的候选。
5. 250ms settle 后必须只有一个唯一候选；0 个显示 missing，多个显示 ambiguous。
6. 插件不保存音频字节，不批量下载，不建立音频库。

因此，音频能否播放仍取决于萤火虫登录态、题目权限、原站播放器和网络。

## 10. Gateway 配置

本地练习不需要 Gateway。只有需要跨会话投影、outbox 同步和可选 Hermes 记忆时才安装。

### 10.1 环境要求

- Node.js：`>=24.14.0 <25`
- pnpm：`>=11.7.0 <12`
- 当前 lockfile packageManager：`pnpm@11.7.0`

### 10.2 构建

```powershell
Set-Location D:\PTE_Pilot
pnpm install --frozen-lockfile
pnpm --filter @pte-pilot/gateway build
```

把 `.env.example` 复制到仓库外，避免提交密钥：

```powershell
Copy-Item .\apps\gateway\.env.example "$env:LOCALAPPDATA\PTEPilot\gateway.env"
```

关键配置：

```dotenv
PTE_GATEWAY_HOST=127.0.0.1
PTE_GATEWAY_PORT=8642
PTE_GATEWAY_DB_PATH=C:\Users\YOU\AppData\Local\PTEPilot\pte-pilot.sqlite
PTE_GATEWAY_ALLOWED_ORIGIN=chrome-extension://你的扩展ID
PTE_GATEWAY_TOKEN_PEPPER=至少32字符的随机值
```

扩展 ID 可在 `chrome://extensions` 的 PTE Pilot 卡片查看。

### 10.3 配对

建议先停止 Gateway，写入一次性配对码：

```powershell
node.exe --env-file="$env:LOCALAPPDATA\PTEPilot\gateway.env" `
  .\apps\gateway\dist\cli\create-pairing-code.js
```

它输出 12 位、一次性、5 分钟有效的代码。随后启动 Gateway：

```powershell
node.exe --env-file="$env:LOCALAPPDATA\PTEPilot\gateway.env" `
  .\apps\gateway\dist\main.js
```

在 5 分钟内：驾驶舱 `Esc` → `S` → 输入配对码 → “配对 Gateway”。

Gateway 路由只有：

- `GET /pte/v1/health`
- `POST /pte/v1/pair`
- `POST /pte/v1/events:batchUpsert`
- `POST /pte/v1/rank`

### 10.4 Windows 登录自启

```powershell
.\apps\gateway\scripts\install-startup.ps1 `
  -EnvFile "$env:LOCALAPPDATA\PTEPilot\gateway.env"
```

卸载：

```powershell
.\apps\gateway\scripts\uninstall-startup.ps1
```

## 11. Hermes 配置与 AI 边界

Hermes 不是练习运行的必要条件。AI 只用于：

- 接收经过最小化的词级错误/学习事件记忆。
- 在本地预先生成的有限候选集中辅助排序。

AI 不用于：

- 解释错误。
- 总结答案。
- 生成题目。
- 操作网页、播放、提交、揭示答案或切题。

Hermes 必须运行独立 profile：

```dotenv
API_SERVER_ENABLED=true
API_SERVER_HOST=127.0.0.1
API_SERVER_PORT=8643
API_SERVER_KEY=至少32字符的随机值
API_SERVER_MODEL_NAME=pte-pilot
```

配置必须严格包含：

```yaml
platform_toolsets:
  api_server:
    - memory
    - no_mcp
```

Gateway `.env` 再加入：

```dotenv
HERMES_BASE_URL=http://127.0.0.1:8643
HERMES_CONFIG_PATH=C:\Users\YOU\.hermes\profiles\pte-pilot\config.yaml
HERMES_API_KEY=与API_SERVER_KEY一致
HERMES_EXPECTED_MODEL=pte-pilot
HERMES_TIMEOUT_MS=1500
```

三个核心 Hermes 值 `BASE_URL / CONFIG_PATH / API_KEY` 必须一起配置或全部省略。Gateway 会同时检查本地 YAML 和 Hermes live discovery；模型名、toolset 或 MCP 状态不符时，Hermes 自动禁用，本地练习继续工作。

## 12. 开发命令

### 12.1 安装依赖

```powershell
Set-Location D:\PTE_Pilot
pnpm install --frozen-lockfile
```

### 12.2 构建扩展

```powershell
pnpm --filter @pte-pilot/extension build
```

输出：

`D:\PTE_Pilot\apps\extension\.output\chrome-mv3`

### 12.3 打包 ZIP

```powershell
Compress-Archive `
  -Path .\apps\extension\.output\chrome-mv3\* `
  -DestinationPath .\PTE-Pilot-Chrome-latest.zip `
  -Force
```

ZIP 根目录应直接包含 `manifest.json`，不能多套一层 `chrome-mv3` 文件夹。

### 12.4 测试和静态检查

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

一次执行：

```powershell
pnpm verify
```

常用聚焦测试：

```powershell
pnpm test apps/extension/src/firefly/dom-adapter.test.ts
pnpm test apps/extension/src/app/practice-controller.test.ts
pnpm test apps/extension/src/background/runtime-handler.test.ts
```

## 13. 故障排查

### 13.1 `pnpm: command not found`

先确认 Node：

```powershell
node --version
```

安装固定 pnpm：

```powershell
npm install --global pnpm@11.7.0
pnpm --version
```

重新打开 PowerShell。不要在 Git Bash 中使用尚未进入 PATH 的 Windows pnpm。

### 13.2 扩展安装后“没有任何反应”

按顺序检查：

1. `chrome://extensions` 中 PTE Pilot 已启用。
2. 加载的是解压目录，不是 ZIP 文件。
3. 当前 URL 必须是：
   - `https://www.fireflyau.com/ptehome/exercise`
   - 或 `https://www.fireflyau.com/ptehome/exercise?pageSource=yc`
4. 已正常登录，页面上存在 WFD 题目、输入框和评分按钮。
5. 安装/更新扩展后刷新原网页。
6. 按 `Alt+Shift+P`，不是只点击扩展图标。
7. 在扩展详情确认站点访问允许 `fireflyau.com`。

### 13.3 `SITE_CHANGED · question:position:missing`

含义：适配器找不到唯一的 `当前位置/总数`。

当前版本已支持 `<li>` 中的 `WFD 7/1256`。如果仍出现：

1. 在 `chrome://extensions` 点击 PTE Pilot 的刷新按钮。
2. 刷新萤火虫页面。
3. 确认加载的是最新 `chrome-mv3` 或最新 ZIP 解压目录。
4. 确认原网页题目区域已加载完成，不是骨架屏。
5. 若萤火虫再次改版，记录页面中实际位置文本和诊断信息。

这不是“没有配置 Hermes”导致的；Hermes 与题目位置识别无关。

### 13.4 `question:prediction-edition-unverified`

当前版本不会因此自动扫描全部题目。它会进入 `session:` 当前页模式，顶部应显示“仅本次会话，不写入 Hermes”。

若仍直接停在该错误：

- 扩展不是最新构建；重新 build、在 Chrome 中刷新扩展、再刷新网页。
- 页面同时缺失题号、位置或评分控件；查看更具体的诊断字段。

### 13.5 音频显示 `EMPTY`

`EMPTY` 表示尚未完成当前题音频绑定，不等于没有权限配置。检查：

1. 原网页 Play 自己是否能播放。
2. 先在驾驶舱按一次 `Alt+P`。
3. 当前题是否刚切换；等待切题同步结束。
4. 是否有多个同时播放的萤火虫音频请求。
5. Chrome 是否允许扩展访问 `upload.fireflyau.com`。

`AUDIO_ERROR` 常见原因是捕获窗口内没有唯一 `audio/*` 响应；插件会 fail closed，不猜测音频。

### 13.6 Gateway 配对失败

- Gateway 必须监听 `127.0.0.1:8642`。
- `PTE_GATEWAY_ALLOWED_ORIGIN` 必须精确等于当前扩展 ID。
- 配对码只有 5 分钟且只能用一次。
- `PTE_GATEWAY_TOKEN_PEPPER` 至少 32 字符。
- 重新加载扩展可能改变临时扩展 ID；更新 `.env` 后重启 Gateway。

### 13.7 Hermes 离线

本地练习应继续可用。检查：

- Hermes 是否监听 `127.0.0.1:8643`。
- model 是否精确为 `pte-pilot`。
- 只有 memory toolset，且 `no_mcp` 已启用。
- `HERMES_API_KEY` 与 Hermes server key 一致。
- 五个 Hermes 环境值不要只填一部分。

## 14. 安全、隐私与版权

- 只在受支持的萤火虫 exercise URL 注入。
- 页面 DOM 读取依赖你自己的正常登录权限。
- 不保存密码、Cookie 或萤火虫会话令牌。
- 不下载、归档或批量导出音频。
- 不保存完整正确答案文本。
- 未验证题集不进入长期存储或 Hermes。
- Gateway 仅允许 loopback，且固定扩展 Origin。
- 配对码一次性、短期有效；Bearer token 不写日志。
- Hermes 被限制为 memory，MCP 必须禁用。
- 使用者应遵守萤火虫服务条款、版权和个人订阅范围。

## 15. 已知限制

- 萤火虫是第三方页面；DOM、按钮名称或评分流程改版后，适配器可能 fail closed。
- 当前页会话模式关闭/重载扩展后不会保留未验证草稿和标记。
- 未完整验证前，不会把错词写入长期词库；这是防止串题和污染记忆的设计。
- 显式完整索引会实际逐题切换；1256 题会比周预测题集耗时很多。
- 音频捕获要求当前播放窗口内只有一个唯一候选。
- Chrome 开发者模式扩展没有商店签名；重新加载目录时扩展 ID 可能变化。
- Hermes 不是 ChatGPT 账号授权；需要你自己的本机 Hermes 服务和 API key。

## 16. 后续建议路线

优先级从高到低：

1. 增加真实萤火虫页面 fixture，覆盖 `<li> WFD 7/1256` 和周预测页面。
2. 为 session 初始化增加更完整的 controller integration test。
3. 给显式首次验证增加暂停/继续，而不只支持取消。
4. 在 UI 明确显示“当前页面总题数”和“是否为周预测筛选”。
5. 允许用户导出自己的词级学习事实，不导出题库或音频。
6. 增加适配器诊断包，只包含选择器计数和状态，不包含答案/音频内容。
7. 完成真实 Gateway + Hermes 隔离 profile 的端到端验收。

## 17. 一句话交接

先加载 `apps/extension/.output/chrome-mv3`，登录萤火虫，按 `Alt+Shift+P`；插件立即练当前题。只有你按 `Esc` → `B` 时才遍历完整题集，验证成功后才启用长期错词、复习与 Hermes 记忆。
