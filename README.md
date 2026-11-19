# Antigravity 简体中文汉化

为 Google Antigravity 2.x 桌面版（Windows）做的简体中文界面汉化。在 2.33.0 版上验证过。

## 安装

前提：已安装 Antigravity 和 [Node.js](https://nodejs.org/)。

```powershell
git clone https://github.com/callaumyan-design/antigravity-zh-cn.git
cd antigravity-zh-cn
powershell -ExecutionPolicy Bypass -File .\安装汉化.ps1
```

脚本会做这几件事：
1. 关闭 Antigravity。
2. 把英文原版备份为 `resources\app.asar.en-backup`。
3. 用本机的原版文件生成汉化包。
4. 换上汉化包并重新启动 Antigravity。

整个过程不需要管理员权限。

还原英文：运行 `还原英文.ps1`。

Antigravity 自动更新后界面会变回英文，重新运行一次 `安装汉化.ps1` 即可。新版本新增的文字可能暂时还是英文。

## 原理

Antigravity 2.x 的界面是 `language_server.exe` 在本机提供的网页（`https://127.0.0.1:<端口>/`），外壳 `resources\app.asar` 里的 `dist/preload.js` 会在每个窗口加载前运行。

- **界面**：在 `preload.js` 末尾追加一段注入脚本（`tools/injector.template.js`）。它用 MutationObserver 按词典替换界面文本和 `placeholder` / `title` / `aria-label`，带插值的句子按正则规则替换。
- **不碰**：AI 回复正文、你发出的消息、对话标题、输入框、代码块、编辑器和终端。
- **主进程**：托盘菜单、退出确认、检查更新、打开工作区等原生对话框、WSL 提示和欢迎向导，直接替换字面文字（`tools/patch-main.mjs`）。

本仓库不包含 Antigravity 的任何程序文件，汉化包在你本机用你自己安装的原版生成。

## 目录

| 路径 | 说明 |
| --- | --- |
| `dict/zh-CN.json` | 主词典，约 3,300 条，机器翻译加抽查 |
| `dict/rules.json` | 正则规则，约 380 条 |
| `dict/overrides*.json` / `dict/rules.base.json` | 人工校正，优先级最高 |
| `tools/build.mjs` | 用原版 `app.asar` 生成汉化版 |
| `tools/injector.template.js` | 运行时翻译脚本 |
| `tools/patch-main.mjs` | 主进程文字替换 |
| `tools/extract*.mjs`、`filter.mjs`、`merge.mjs` | 从新版前端抽取待翻译字符串 |
| `tools/cdp.mjs`、`fetch.mjs`、`tour*.mjs`、`collect-miss.js` | 通过 `--remote-debugging-port=9333` 调试、抓取前端、巡检漏翻 |

## 修改译法

在 `dict/overrides.json` 里加 `"英文原文": "中文"`，重新运行 `安装汉化.ps1`。

## 免责声明

非官方项目，与 Google 无关。修改 `app.asar` 后，Antigravity 自动更新会覆盖它。
