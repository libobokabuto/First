import { contextBridge, ipcRenderer } from 'electron';

/**
 * 预加载脚本：通过 contextBridge 安全地向渲染进程暴露 Node.js / Electron API。
 * 渲染进程通过 `window.electronAPI` 访问这些方法。
 */

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  ext: string;
}

export interface ReadResult {
  data?: string;
  encoding?: 'utf-8' | 'base64';
  error?: string;
}

export interface WriteResult {
  success?: boolean;
  error?: string;
}

const electronAPI = {
  // 读取文件
  readFile: (filePath: string): Promise<ReadResult> =>
    ipcRenderer.invoke('fs:readFile', filePath),

  // 写入文件
  writeFile: (filePath: string, content: string): Promise<WriteResult> =>
    ipcRenderer.invoke('fs:writeFile', filePath, content),

  // 获取文件信息
  getFileInfo: (filePath: string): Promise<FileInfo | { error: string }> =>
    ipcRenderer.invoke('fs:getFileInfo', filePath),

  // 监听主进程事件
  onFileOpen: (callback: (filePath: string) => void) => {
    const handler = (_event: any, filePath: string) => callback(filePath);
    ipcRenderer.on('file:open', handler);
    return () => ipcRenderer.removeListener('file:open', handler);
  },

  onMenuSave: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu:save', handler);
    return () => ipcRenderer.removeListener('menu:save', handler);
  },

  onToggleDarkMode: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('menu:toggle-darkmode', handler);
    return () => ipcRenderer.removeListener('menu:toggle-darkmode', handler);
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
