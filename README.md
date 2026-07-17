# PTE Pilot

纯本地、键盘优先的 Chrome MV3 萤火虫 WFD 练习扩展。

萤火虫继续提供登录状态、题目、原始音频、评分、答案揭示和切题。PTE Pilot 只重做练习界面：专注输入、键盘导航、词级差异、草稿、错词与本地复习。无需账号绑定、API key 或额外本机服务。

## 快速使用

### 使用最新 ZIP

1. 解压仓库根目录的 `PTE-Pilot-Chrome-latest.zip`。
2. 打开 `chrome://extensions`。
3. 开启“开发者模式”。
4. 点击“加载已解压的扩展程序”，选择解压后的目录。
5. 打开并登录：
   `https://www.fireflyau.com/ptehome/exercise?pageSource=yc`
6. 刷新萤火虫页面。
7. 按 `Alt+Shift+P` 打开 PTE Pilot。

Chrome 不能直接加载 ZIP。扩展根目录必须直接包含 `manifest.json`。

### 从源码构建

要求：Node.js `>=24.14 <25`、pnpm `>=11.7 <12`。

```powershell
Set-Location D:\PTE_Pilot
npm install --global pnpm@11.7.0
pnpm install --frozen-lockfile
pnpm --filter @pte-pilot/extension build
```

加载目录：

```text
D:\PTE_Pilot\apps\extension\.output\chrome-mv3
```

## 全键盘操作

| 状态 | 按键 | 动作 |
| --- | --- | --- |
| 任意状态 | `Alt+Shift+P` | 打开/关闭驾驶舱 |
| 答题 | `Alt+P` | 播放/暂停原始音频 |
| 答题 | `Alt+R` | 从头重播 |
| 答题 | `Enter` | 提交 |
| 答题 | `Alt+J` / `Alt+K` | 下一题 / 上一题 |
| 答题 | `Alt+M` | 标记/取消标记 |
| 答题/复盘 | `Esc` | 打开命令层 |
| 复盘 | `Enter` 或 `J` / `K` | 下一题 / 上一题 |
| 复盘 | `Space` / `R` / `T` | 播放 / 重播 / 重做 |
| 同步故障 | `Alt+J` / `Alt+K` | 跳过当前题并恢复同步 |
| 故障页 | `R` / `O` / `?` | 重试 / 返回原网页 / 帮助 |
| 命令层 | `P` / `R` / `J` / `K` / `M` | 播放 / 重播 / 切题 / 标记 |
| 命令层 | `E` / `Q` / `W` / `S` | 模式 / 本地复习 / 错词库 / 设置 |
| 命令层 | `B` / `I` / `?` | 建立索引 / 聚焦输入 / 帮助 |
| 索引中 | `Esc` / `Enter` 或 `R` / `X` | 暂停 / 继续 / 取消 |

推荐循环：

```text
Alt+P 听音频 → 打字 → Enter 提交 → 查看词级差异 → Enter 下一题
```

输入区使用原生、非受控 `textarea`。逐键输入不会同步写入萤火虫输入框，也不会触发 React 逐键重渲染；提交时才执行一次原生写入。

## 音频

- 音频始终来自当前萤火虫题目。
- 插件驱动页面播放器，不下载、不归档、不建立音频库。
- 当前题首次播放会验证唯一音频请求。
- 首次验证后，暂停、继续和重播复用当前题绑定；浏览器缓存不需要再次产生网络请求。
- 切题后旧绑定立即失效，新题重新验证。

`EMPTY` 表示当前题尚未绑定音频。先按 `Alt+P`。

`AUDIO_ERROR` 表示原站播放器、登录权限、网络或唯一音频验证失败。先确认萤火虫原网页本身能播放，再刷新原网页和扩展。

## 本地数据

- 当前页临时会话：草稿、标记和已访问题索引只留在本次扩展上下文。
- 已验证题集：草稿、尝试、词级错误、题目进度和本地复习状态存入扩展 IndexedDB。
- 不保存音频字节、密码、Cookie、会话令牌或完整正确句子。
- 不向外部服务发送练习内容。

## 当前页优先

打开驾驶舱后立即练当前题，不自动遍历全部题目。只有按 `Esc`、再按 `B`，才显式建立完整索引。

页面显示多少题，插件就以多少题为准，不硬编码“192 题”。要练周预测，先在萤火虫原网页进入周预测入口。

## 权限边界

扩展只需要：

- `storage`：本地设置和学习数据。
- `webRequest`：验证当前播放触发的音频响应。
- `fireflyau.com`：读取并驱动当前练习页面。
- `upload.fireflyau.com`：识别萤火虫音频响应。

不申请 Cookie、下载、调试器、全部标签页或全部网站权限。

## 验证

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

完整执行：

```powershell
pnpm verify
```

更多安装、使用和排障信息见 [PTE_PILOT_COMPLETE_GUIDE.md](./PTE_PILOT_COMPLETE_GUIDE.md)。
