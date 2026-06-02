import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import path from 'path';
import fs from 'fs';

// 判断是否为开发模式
const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'First - 全能文档阅读编辑器',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    // 窗口标题栏集成暗色模式
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  // 窗口准备好后再显示，避免白屏闪烁
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // 加载页面
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // 设置应用菜单
  setupMenu();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '打开文件...',
          accelerator: 'CmdOrCtrl+O',
          click: () => handleOpenFile(),
        },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:save'),
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
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
          label: '切换暗色模式',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: () => mainWindow?.webContents.send('menu:toggle-darkmode'),
        },
        { type: 'separator' },
        { label: '放大', accelerator: 'CmdOrCtrl+=', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: '重置缩放', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 First',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: '关于 First',
              message: 'First - 全能文档阅读编辑器',
              detail: `版本: ${app.getVersion()}\n一站式打开、阅读、编辑主流办公文档格式。\n\n作者: libobokabuto`,
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ========== IPC 处理 ==========

// 打开文件对话框
async function handleOpenFile(): Promise<void> {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: '打开文档',
    filters: [
      { name: '所有支持的文档', extensions: ['md', 'txt', 'docx', 'doc', 'pdf', 'xlsx', 'xls', 'csv', 'pptx', 'ppt', 'epub', 'rtf', 'odt', 'ods', 'odp'] },
      { name: 'Markdown', extensions: ['md'] },
      { name: '纯文本', extensions: ['txt'] },
      { name: 'Word 文档', extensions: ['docx', 'doc'] },
      { name: 'PDF 文档', extensions: ['pdf'] },
      { name: 'Excel 表格', extensions: ['xlsx', 'xls', 'csv'] },
      { name: 'PowerPoint 演示', extensions: ['pptx', 'ppt'] },
      { name: '所有文件', extensions: ['*'] },
    ],
    properties: ['openFile', 'multiSelections'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    for (const filePath of result.filePaths) {
      mainWindow?.webContents.send('file:open', filePath);
    }
  }
}

// 读取文件内容（渲染进程请求）
ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  try {
    const buffer = await fs.promises.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    // 文本类格式直接返回字符串
    const textExts = ['.md', '.txt', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts', '.jsx', '.tsx', '.yml', '.yaml', '.toml'];
    if (textExts.includes(ext)) {
      return { data: buffer.toString('utf-8'), encoding: 'utf-8' as const };
    }
    // 二进制格式返回 ArrayBuffer（通过 base64 中转）
    return { data: buffer.toString('base64'), encoding: 'base64' as const };
  } catch (err: any) {
    return { error: err.message };
  }
});

// 写入文件内容
ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
});

// 获取文件信息
ipcMain.handle('fs:getFileInfo', async (_event, filePath: string) => {
  try {
    const stat = await fs.promises.stat(filePath);
    return {
      name: path.basename(filePath),
      path: filePath,
      size: stat.size,
      ext: path.extname(filePath).toLowerCase(),
    };
  } catch (err: any) {
    return { error: err.message };
  }
});

// ========== 应用生命周期 ==========

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
