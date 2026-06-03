import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // 打开文件对话框
  openFile: () => ipcRenderer.invoke('dialog:openFile'),

  // 保存文件
  saveFile: (content: string, filePath?: string) =>
    ipcRenderer.invoke('file:save', content, filePath),

  // 读取文件内容
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),

  // 读取目录结构
  readDirectory: (dirPath: string) => ipcRenderer.invoke('dir:read', dirPath),

  // 检查文件是否存在
  fileExists: (filePath: string) => ipcRenderer.invoke('file:exists', filePath),

  // 最近文件
  getRecentFiles: () => ipcRenderer.invoke('recentFiles:get'),
  addRecentFile: (filePath: string) => ipcRenderer.invoke('recentFiles:add', filePath),
  removeRecentFile: (filePath: string) => ipcRenderer.invoke('recentFiles:remove', filePath),

  // 监听菜单动作
  onMenuAction: (callback: (action: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, action: string) =>
      callback(action);
    ipcRenderer.on('menu:action', handler);
    return () => ipcRenderer.removeListener('menu:action', handler);
  },

  // 监听文件打开事件
  onFileOpened: (callback: (data: { filePath: string; content: string }) => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      data: { filePath: string; content: string }
    ) => callback(data);
    ipcRenderer.on('file:opened', handler);
    return () => ipcRenderer.removeListener('file:opened', handler);
  },

  // 监听文件夹打开事件
  onFolderOpened: (callback: (folderPath: string) => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      folderPath: string
    ) => callback(folderPath);
    ipcRenderer.on('folder:opened', handler);
    return () => ipcRenderer.removeListener('folder:opened', handler);
  },
});
