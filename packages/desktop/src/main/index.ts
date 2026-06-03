import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

// ── 最近文件存储 ──────────────────────────────────────────
const userDataPath = app.getPath('userData');
const recentFilesPath = path.join(userDataPath, 'recent-files.json');

function loadRecentFiles(): string[] {
  try {
    if (fs.existsSync(recentFilesPath)) {
      const data = fs.readFileSync(recentFilesPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch { /* ignore */ }
  return [];
}

function saveRecentFiles(files: string[]): void {
  // 去重，保留最多 20 条
  const unique = files.filter((f, i, arr) => arr.indexOf(f) === i).slice(0, 20);
  try {
    const dir = path.dirname(recentFilesPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(recentFilesPath, JSON.stringify(unique, null, 2), 'utf-8');
  } catch { /* ignore */ }
}

function addRecentFile(filePath: string): void {
  const files = loadRecentFiles();
  // 移到最前面
  const idx = files.indexOf(filePath);
  if (idx !== -1) files.splice(idx, 1);
  files.unshift(filePath);
  saveRecentFiles(files);
}

// ── 菜单栏 ──────────────────────────────────────────────
function createMenu(): void {
  const template: MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu:action', 'new'),
        },
        {
          label: '打开...',
          accelerator: 'CmdOrCtrl+O',
          click: handleOpenFile,
        },
        {
          label: '打开文件夹...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: handleOpenFolder,
        },
        { type: 'separator' },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:action', 'save'),
        },
        {
          label: '关闭标签',
          accelerator: 'CmdOrCtrl+W',
          click: () => mainWindow?.webContents.send('menu:action', 'closeTab'),
        },
        { type: 'separator' },
        { label: '退出', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
      ],
    },
    {
      label: '视图',
      submenu: [
        {
          label: '切换文件树',
          accelerator: 'CmdOrCtrl+B',
          click: () => mainWindow?.webContents.send('menu:action', 'toggleSidebar'),
        },
        { type: 'separator' },
        { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
        { label: '重新加载', accelerator: 'CmdOrCtrl+R', role: 'reload' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ── 递归读取目录结构 ─────────────────────────────────────
interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
}

function readDirectory(dirPath: string, depth: number = 3): FileTreeNode[] {
  if (depth <= 0) return [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const nodes: FileTreeNode[] = [];

    for (const entry of entries) {
      // 跳过隐藏文件和 node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        nodes.push({
          name: entry.name,
          path: fullPath,
          isDirectory: true,
          children: readDirectory(fullPath, depth - 1),
        });
      } else {
        // 显示 md 文件和常见文档格式
        const ext = path.extname(entry.name).toLowerCase();
        const supportedExts = [
          '.md', '.markdown', '.mdx',
          '.txt', '.pdf', '.docx', '.xlsx', '.csv', '.pptx',
        ];
        if (supportedExts.includes(ext)) {
          nodes.push({
            name: entry.name,
            path: fullPath,
            isDirectory: false,
          });
        }
      }
    }

    // 排序：目录在前，文件在后，各自按名称排序
    nodes.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return nodes;
  } catch {
    return [];
  }
}

// ── 文件操作 ──────────────────────────────────────────────
async function handleOpenFile(): Promise<void> {
  if (!mainWindow) return;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: '支持的文档', extensions: ['md', 'markdown', 'mdx', 'txt', 'pdf', 'docx', 'xlsx', 'csv', 'pptx'] },
      { name: 'Markdown 文件', extensions: ['md', 'markdown', 'mdx'] },
      { name: '所有文件', extensions: ['*'] },
    ],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    addRecentFile(filePath);
    mainWindow.webContents.send('file:opened', { filePath, content });
  }
}

async function handleOpenFolder(): Promise<void> {
  if (!mainWindow) return;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    mainWindow.webContents.send('folder:opened', result.filePaths[0]);
  }
}

// ── IPC 处理 ──────────────────────────────────────────────
ipcMain.handle('dialog:openFile', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: '支持的文档', extensions: ['md', 'markdown', 'mdx', 'txt', 'pdf', 'docx', 'xlsx', 'csv', 'pptx'] },
      { name: 'Markdown 文件', extensions: ['md', 'markdown', 'mdx'] },
      { name: '所有文件', extensions: ['*'] },
    ],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    addRecentFile(filePath);
    return { filePath, content };
  }
  return null;
});

ipcMain.handle('file:save', async (_event, content: string, filePath?: string) => {
  if (!mainWindow) return { success: false };

  if (filePath) {
    fs.writeFileSync(filePath, content, 'utf-8');
    addRecentFile(filePath);
    return { success: true, filePath };
  }

  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'Markdown 文件', extensions: ['md'] }],
    defaultPath: 'untitled.md',
  });

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, content, 'utf-8');
    addRecentFile(result.filePath);
    return { success: true, filePath: result.filePath };
  }

  return { success: false };
});

ipcMain.handle('file:read', async (_event, filePath: string) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { content };
  } catch {
    return { content: null };
  }
});

ipcMain.handle('dir:read', async (_event, dirPath: string) => {
  return readDirectory(dirPath);
});

ipcMain.handle('recentFiles:get', async () => {
  return loadRecentFiles();
});

ipcMain.handle('recentFiles:add', async (_event, filePath: string) => {
  addRecentFile(filePath);
});

ipcMain.handle('recentFiles:remove', async (_event, filePath: string) => {
  const files = loadRecentFiles().filter((f) => f !== filePath);
  saveRecentFiles(files);
});

ipcMain.handle('file:exists', async (_event, filePath: string) => {
  return fs.existsSync(filePath);
});

// ── 窗口创建 ──────────────────────────────────────────────
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'DocKit',
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev()) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function isDev(): boolean {
  return !app.isPackaged;
}

// ── 应用生命周期 ──────────────────────────────────────────
app.whenReady().then(() => {
  createMenu();
  createWindow();

  // 处理 macOS 通过文件关联打开
  app.on('open-file', (event, filePath) => {
    event.preventDefault();
    if (mainWindow) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        addRecentFile(filePath);
        mainWindow.webContents.send('file:opened', { filePath, content });
      } catch { /* ignore */ }
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 处理 Windows 通过文件关联/命令行打开
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    if (mainWindow) {
      mainWindow.focus();
      // 从命令行参数中提取文件路径
      const args = commandLine.slice(1);
      for (const arg of args) {
        if (!arg.startsWith('-') && fs.existsSync(arg)) {
          try {
            const content = fs.readFileSync(arg, 'utf-8');
            addRecentFile(arg);
            mainWindow.webContents.send('file:opened', { filePath: arg, content });
          } catch { /* ignore */ }
        }
      }
    }
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
