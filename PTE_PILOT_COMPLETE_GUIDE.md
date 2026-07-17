# PTE Pilot 完整项目文档

> 项目路径：`D:\PTE_Pilot`
>
> 形态：Chrome Manifest V3 扩展
>
> 核心：纯本地、当前页优先、原站音频、全键盘 WFD 练习

## 1. 项目定位

PTE Pilot 不提供独立题库，不绕过萤火虫登录、订阅或访问控制。它在用户正常登录的萤火虫 WFD 页面上运行，读取当前题目状态并驱动原站已有动作。

插件负责：

- 读取当前题号、位置、总数和可用控件。
- 使用萤火虫原始音频、评分、答案揭示和切题能力。
- 提供独立 Shadow DOM 驾驶舱。
- 提供低延迟输入、全键盘操作和词级差异。
- 在扩展 IndexedDB 保存已验证题集的草稿、错词和进度。
- 使用确定性本地规则生成复习顺序。

插件不负责：

- 登录、破解付费权限、绕过验证码或限流。
- 批量下载音频或导出完整答案库。
- 保存密码、Cookie、会话令牌、音频字节或完整正确句子。
- 连接外部记忆、排名或模型服务。

## 2. 最快安装

### 2.1 使用打包文件

仓库根目录提供：

```text
D:\PTE_Pilot\PTE-Pilot-Chrome-latest.zip
```

解压到一个新目录：

```powershell
Expand-Archive `
  -LiteralPath "D:\PTE_Pilot\PTE-Pilot-Chrome-latest.zip" `
  -DestinationPath "D:\PTE_Pilot\PTE-Pilot-Chrome-latest"
```

然后：

1. 打开 `chrome://extensions`。
2. 开启右上角“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择解压目录。
5. 确认所选目录根部直接存在 `manifest.json`。
6. 打开并登录萤火虫练习页。
7. 刷新萤火虫页面。
8. 按 `Alt+Shift+P`。

Chrome 不能直接加载 ZIP。更新扩展后，需要同时在 `chrome://extensions` 刷新扩展，并刷新萤火虫页面。

### 2.2 直接加载构建目录

也可加载：

```text
D:\PTE_Pilot\apps\extension\.output\chrome-mv3
```

## 3. 最短使用流程

1. 打开：
   `https://www.fireflyau.com/ptehome/exercise?pageSource=yc`
2. 确认原网页当前题和 Play 控件已加载。
3. 按 `Alt+Shift+P` 打开驾驶舱。
4. 按 `Alt+P` 播放原始音频。
5. 直接打字。
6. 按 `Enter` 提交。
7. 查看词级差异。
8. 按 `Enter` 进入下一题。

不提交也可切题：

- `Alt+J`：下一题。
- `Alt+K`：上一题。

插件切题时驱动原网页同步切换，并在新题身份确认后重新聚焦输入区。

## 4. 完整快捷键

### 4.1 答题状态

| 按键 | 动作 |
| --- | --- |
| `Alt+P` | 播放/暂停 |
| `Alt+R` | 从头重播 |
| `Enter` | 提交 |
| `Alt+J` | 下一题 |
| `Alt+K` | 上一题 |
| `Alt+M` | 标记/取消标记 |
| `Esc` | 打开命令层 |
| `Alt+Shift+P` | 关闭/重新打开驾驶舱 |

### 4.2 复盘状态

| 按键 | 动作 |
| --- | --- |
| `Enter` 或 `J` | 下一题 |
| `K` | 上一题 |
| `Space` | 播放/暂停 |
| `R` | 从头重播 |
| `T` | 重做当前题 |
| `M` | 标记/取消标记 |
| `Esc` | 打开命令层 |

提交键带物理释放保护：进入复盘后，必须先松开刚才的 `Enter`，新的按键才会触发下一题，避免一次长按连续提交和切题。

### 4.3 命令层

先按 `Esc`：

| 按键 | 动作 |
| --- | --- |
| `P` / `R` | 播放 / 重播 |
| `J` / `K` | 下一题 / 上一题 |
| `M` | 标记 |
| `E` | 切换练习/考试模式 |
| `Q` | 本地排序复习 |
| `W` | 错词库 |
| `S` | 设置 |
| `B` | 显式建立完整题集索引 |
| `I` | 返回输入区 |
| `?` | 帮助 |
| `Esc` | 关闭命令层 |

### 4.4 索引与故障

| 状态 | 按键 | 动作 |
| --- | --- | --- |
| 索引中 | `Esc` | 暂停 |
| 已暂停 | `Enter` 或 `R` | 继续 |
| 索引中/已暂停 | `X` | 取消并恢复起始题 |
| 同步故障 | `Alt+J` / `Alt+K` | 跳过当前题并恢复同步 |
| 故障页 | `R` | 重试安全动作 |
| 故障页 | `O` | 关闭驾驶舱并返回原网页 |
| 故障页 | `?` | 查看帮助 |

`Alt+P/R/J/K/M` 可在设置中改成互不重复的单个英文字母。

## 5. 打字体验

输入区使用原生、非受控 `textarea`：

- 每次按键直接由浏览器处理。
- 不把每个字符写进 React state。
- 不逐字同步萤火虫原输入框。
- 提交时才执行一次原生写入，再触发原站评分。
- 切题后自动清空当前草稿并聚焦输入区。
- 组合输入、按键长按和提交后的 `Enter` 抬起都有保护。
- 每次有效输入触发 82ms 微压感和底部短光轨，不触发 React 逐字重渲染。

视觉反馈短、轻、可关闭；系统开启“减少动态效果”后自动停用。

## 6. 音频工作方式

音频始终由萤火虫原播放器提供：

1. 插件绑定当前题号和 navigation epoch。
2. `Alt+P` 驱动当前页面唯一的 APlayer 播放控件。
3. Service Worker 在短窗口内观察 `upload.fireflyau.com` 音频响应。
4. 只接受成功 HTTP 状态和 `Content-Type: audio/*` 的唯一候选。
5. 首次验证成功后，暂停、继续和 `Alt+R` 重播复用当前题绑定。
6. 浏览器缓存没有再次产生网络请求时，已验证题目的重播仍可工作。
7. 切题立即清除旧绑定；新题重新验证。

插件不读取响应正文，不保存音频字节，不下载或建立音频库。

## 7. 当前页优先与题集索引

### 7.1 默认行为

打开插件后，当前题立即可练。初始化不会自动遍历 192、1256 或任何完整题集。

流程：

1. 读取当前题号、位置/总数和控件。
2. 有稳定题集身份时进入已验证模式。
3. 没有稳定版本时创建本标签页临时 `session:` 身份。
4. 每次手动切题只增量记录刚访问的题。

### 7.2 临时会话

未验证题集只在当前扩展上下文保留：

- 草稿、标记和已访问题索引只放内存。
- 可播放、打字、提交、看本次词级差异和切题。
- 不写长期题集、错词历史或复习状态。

### 7.3 完整索引

需要长期错词和题目进度时：

1. 按 `Esc`。
2. 按 `B`。
3. 索引期间不要手动操作原网页。
4. 需要中断时按 `Esc` 暂停，或按 `X` 取消。

完成后，插件按完整有序题号生成稳定题集身份，并启用持久草稿、错词、进度和本地复习。

页面显示多少题，插件就索引多少题。插件不猜测固定题数。只练周预测时，先确认原网页已经进入周预测筛选。

## 8. 本地数据

扩展数据库：`pte-pilot-facts-v1`。

已验证题集可保存：

- 草稿。
- 尝试事件。
- expected/actual/type 词级错误事实。
- 题目尝试次数、错误数、准确率、到期时间和标记。
- 题号、站点位置、索引快照和恢复位置。
- 模式和快捷键设置。

完整正确答案只在评分后短暂进入内存对齐计算，随后转换成词级错误事实。音频内容不写数据库。

所有排序都由本地确定性规则完成。练习数据不离开扩展。

## 9. 架构

```text
萤火虫 exercise 页面
  ├─ FireflyDomAdapter：读取题号、位置、控件和标签
  ├─ NavigationCoordinator：驱动原站切题并校验 epoch
  ├─ AudioBroker：控制原站播放器并验证当前题音频
  ├─ AnswerGate：提交、评分证明、揭示与词级差异
  └─ React Shadow DOM Cockpit：输入、状态、快捷键和命令层
                │
                │ 严格 runtime 消息
                ▼
扩展 Service Worker
  ├─ 来源与 schema 校验
  ├─ Dexie / IndexedDB 本地事实库
  └─ 当前标签页音频响应观察
```

关键约束：

- 页面脚本不能直接读取扩展数据库。
- 每次提交、切题、揭示和音频操作绑定当前题与单调 epoch。
- 身份模糊、控件重复或站点结构未知时停止危险动作。
- 本地存储和音频观察不依赖外部服务。

## 10. 权限

Manifest 只需要：

- `storage`：扩展设置和本地学习数据。
- `webRequest`：验证当前播放触发的音频响应。
- `https://www.fireflyau.com/*`：当前练习页面。
- `https://upload.fireflyau.com/*`：萤火虫音频响应。

不申请：

- `cookies`
- `downloads`
- `debugger`
- `tabs`
- `<all_urls>`

萤火虫授权来自用户在原网页的正常登录状态。插件不读取密码，也没有额外题库授权码。

## 11. 从源码构建

### 11.1 环境

- Node.js：`>=24.14.0 <25`
- pnpm：`>=11.7.0 <12`
- lockfile：`pnpm@11.7.0`

### 11.2 安装

```powershell
Set-Location D:\PTE_Pilot
npm install --global pnpm@11.7.0
pnpm install --frozen-lockfile
```

### 11.3 构建扩展

```powershell
pnpm --filter @pte-pilot/extension build
```

输出：

```text
D:\PTE_Pilot\apps\extension\.output\chrome-mv3
```

### 11.4 打包

```powershell
Compress-Archive `
  -Path .\apps\extension\.output\chrome-mv3\* `
  -DestinationPath .\PTE-Pilot-Chrome-latest.zip `
  -Force
```

ZIP 根目录必须直接包含 `manifest.json`。

## 12. 验证

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

## 13. 故障排查

### 13.1 `pnpm: command not found`

```powershell
node --version
npm install --global pnpm@11.7.0
pnpm --version
```

安装后重新打开 PowerShell。若 Git Bash 没有更新 PATH，改用新开的 PowerShell。

### 13.2 安装后没有反应

依次确认：

1. `chrome://extensions` 中 PTE Pilot 已启用。
2. 加载的是解压目录，不是 ZIP。
3. 当前 URL 是萤火虫 exercise 页面。
4. 用户已登录，页面已显示 WFD、Play、输入区和评分控件。
5. 扩展更新后已刷新扩展和萤火虫页面。
6. 使用 `Alt+Shift+P` 打开，不是只点击扩展图标。
7. 扩展详情中允许访问 `fireflyau.com`。

### 13.3 `SITE_CHANGED · question:position:missing`

表示插件找不到唯一的“当前位置/总数”：

1. 在 `chrome://extensions` 刷新 PTE Pilot。
2. 刷新萤火虫页面。
3. 确认加载的是最新构建。
4. 等待题目区完全加载，不要停留在骨架屏。
5. 若原站再次改版，记录页面实际位置文本和诊断信息。

当前适配器支持列表项中的 `WFD 7/1256`。

### 13.4 `question:prediction-edition-unverified`

最新版本应直接进入当前页临时会话，不会因此自动扫描全部题目。若仍停在错误页：

- Chrome 中加载的不是最新构建；重新构建并刷新。
- 页面同时缺失题号、位置或评分控件；查看更具体诊断字段。

### 13.5 `EMPTY` / `AUDIO_ERROR`

`EMPTY`：当前题尚未完成音频绑定。按一次 `Alt+P`。

`AUDIO_ERROR`：检查：

1. 原网页 Play 本身能否播放。
2. 用户登录和题目权限是否正常。
3. 切题同步是否已经结束。
4. 页面是否出现多个候选播放器。
5. Chrome 是否允许扩展访问 `upload.fireflyau.com`。

当前题首次播放成功后，`Alt+R` 不依赖浏览器再次发起音频网络请求。

### 13.6 无法只用键盘下一题

- 答题状态使用 `Alt+J`。
- 提交后的复盘状态使用 `Enter` 或 `J`。
- 同步故障状态使用 `Alt+J` 跳过当前题并恢复同步。
- 索引状态先按 `Esc` 暂停或 `X` 取消。
- 设置输入框正在编辑时，先按 `Esc` 退出设置字段。

若快捷键仍无效，按 `R` 重试；再不行按 `O` 返回原网页，刷新页面后用 `Alt+Shift+P` 重开。

### 13.7 更新后仍是旧界面

1. 删除旧解压目录，或解压到新目录。
2. 在 `chrome://extensions` 删除旧 PTE Pilot。
3. 加载新目录。
4. 刷新萤火虫标签页。

只替换 ZIP、不重新加载扩展，不会更新正在运行的代码。

## 14. 安全与限制

- 仅在受支持的萤火虫 exercise URL 注入。
- 不绕过登录、订阅、验证码、限流或访问控制。
- 不保存密码、Cookie 或萤火虫会话令牌。
- 不下载、归档或批量导出音频。
- 不保存完整正确答案。
- 用户应遵守萤火虫服务条款、版权和个人订阅范围。
- 萤火虫改版后，适配器可能 fail closed，需要更新语义识别。
- 完整索引会逐题驱动原网页；题目很多时耗时较长。

## 15. 一句话交接

加载 `D:\PTE_Pilot\apps\extension\.output\chrome-mv3`，登录萤火虫周预测页，刷新页面，按 `Alt+Shift+P`；用 `Alt+P` 听音频、直接打字、`Enter` 提交、`Enter` 下一题，全程无需鼠标。
