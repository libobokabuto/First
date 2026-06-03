import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // 打开文件对话框
  openFile: () => ipcRenderer.invoke('dialog:openFile'),

  // 保存文件
  saveFile: (content: string, filePath?: string) =>
    ipcRenderer.invoke('file:save', content, filePath),

  // 监听菜单动作（新建 / 保存）
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
});
