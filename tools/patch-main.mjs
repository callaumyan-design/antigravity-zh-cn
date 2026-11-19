// 主进程（托盘/对话框/欢迎向导）字面替换。幂等：已替换则跳过。
import fs from 'node:fs';
import path from 'node:path';
const dist = process.argv[2];
const P = {
  'main.js': [
    ["title: 'WSL distro not found'", "title: '未找到 WSL 发行版'"],
    ["message: `The WSL distro \"${WSL_DISTRO}\" is no longer installed.`", "message: `WSL 发行版 \"${WSL_DISTRO}\" 已不再安装。`"],
    ["detail: 'Antigravity opened on Windows instead.'", "detail: 'Antigravity 已改为在 Windows 上打开。'"],
    ["label: 'No agents running'", "label: '没有正在运行的智能体'"],
    ["label: `Open ${electron_1.app.getName()}`", "label: `打开 ${electron_1.app.getName()}`"],
    ["label: 'Quit',\n                click: () => {\n                    // Triggers", "label: '退出',\n                click: () => {\n                    // Triggers"],
    ["buttons: ['Cancel', 'Quit']", "buttons: ['取消', '退出']"],
    ["title: 'Confirm Quit'", "title: '确认退出'"],
    ["message: 'Are you sure you want to quit?'", "message: '确定要退出吗？'"],
    ["detail: 'There may be agents or background tasks running.'", "detail: '可能仍有智能体或后台任务正在运行。'"],
  ],
  'tray.js': [
    ["(count > 0 ? `${count}` : 'No') +\n                    ' agent' +\n                    (count === 1 ? '' : 's') +\n                    ' running';",
     "(count > 0 ? `${count} 个智能体正在运行` : '没有正在运行的智能体');"],
  ],
  'updater.js': [
    ['MenuUpdateStep["CheckForUpdates"] = "Check for Updates"', 'MenuUpdateStep["CheckForUpdates"] = "检查更新"'],
    ['MenuUpdateStep["CheckingForUpdates"] = "Checking for Updates..."', 'MenuUpdateStep["CheckingForUpdates"] = "正在检查更新…"'],
    ['MenuUpdateStep["DownloadingUpdate"] = "Downloading Update..."', 'MenuUpdateStep["DownloadingUpdate"] = "正在下载更新…"'],
    ['MenuUpdateStep["RestartToUpdate"] = "Restart to Update"', 'MenuUpdateStep["RestartToUpdate"] = "重启以更新"'],
    ["title: 'Check for Updates'", "title: '检查更新'"],
    ["message: 'No updates available'", "message: '当前已是最新版本'"],
    ["buttons: ['OK']", "buttons: ['确定']"],
  ],
  'ipcHandlers.js': [
    ["message: 'Folder is on the Windows filesystem'", "message: '该文件夹位于 Windows 文件系统上'"],
    ["title: 'Open workspace'", "title: '打开工作区'"],
    ["title: 'Open workspaces'", "title: '打开多个工作区'"],
    ["title: 'Select Download Folder'", "title: '选择下载文件夹'"],
  ],
  'menu.js': [
    ["label: 'New Window',\n        accelerator", "label: '新建窗口',\n        accelerator"],
    ["label: 'Docs',", "label: '文档',"],
    ["return { label: 'Connect to WSL', submenu };", "return { label: '连接到 WSL', submenu };"],
    ["return { label: 'Reopen Locally', click", "return { label: '在本地重新打开', click"],
  ],
  'ideInstall/wizardHtml.js': [
    ['<title>Welcome to Antigravity</title>', '<title>欢迎使用 Antigravity</title>'],
    ['>Setting up…</div>', '>正在设置…</div>'],
    ['<h1>Welcome to the new Antigravity!</h1>', '<h1>欢迎使用全新的 Antigravity！</h1>'],
    ["<p>Antigravity has been redesigned to put agents first with new capabilities. If you'd still like a code editor, you can download it as a separate app named <b>Antigravity IDE</b>.</p>",
     '<p>Antigravity 已全面重新设计，以智能体为核心并带来全新功能。如果你仍需要代码编辑器，可以单独下载名为 <b>Antigravity IDE</b> 的应用。</p>'],
    ['<span>Download the Antigravity IDE</span>', '<span>下载 Antigravity IDE</span>'],
    ['id="btn-skip">Explore the new Antigravity</button>', 'id="btn-skip">探索全新的 Antigravity</button>'],
  ],
  'provisionSplash.js': [
    ['<div>Setting up WSL: ${escapeHtml(distro)}</div>', '<div>正在设置 WSL：${escapeHtml(distro)}</div>'],
  ],
};
let ok = 0, miss = [];
for (const [f, pairs] of Object.entries(P)) {
  const fp = path.join(dist, f);
  let s = fs.readFileSync(fp, 'utf8');
  const crlf = s.includes('\r\n');
  if (crlf) s = s.replace(/\r\n/g, '\n');
  for (const [a, b] of pairs) {
    if (s.includes(a)) { s = s.split(a).join(b); ok++; }
    else if (s.includes(b)) ok++;
    else miss.push(`${f}: ${a.slice(0, 60)}`);
  }
  if (crlf) s = s.replace(/\n/g, '\r\n');
  fs.writeFileSync(fp, s);
}
console.log('main-process replacements ok:', ok);
if (miss.length) console.log('MISSING:\n' + miss.join('\n'));
