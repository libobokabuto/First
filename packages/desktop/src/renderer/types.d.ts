// Electron API 类型声明
interface ElectronAPI {
  openFile: () => Promise<{ filePath: string; content: string } | null>;
  saveFile: (
    content: string,
    filePath?: string
  ) => Promise<{ success: boolean; filePath?: string }>;
  onMenuAction: (callback: (action: string) => void) => () => void;
  onFileOpened: (
    callback: (data: { filePath: string; content: string }) => void
  ) => () => void;
}

interface Window {
  electronAPI?: ElectronAPI;
}
