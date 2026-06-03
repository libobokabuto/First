// Electron API 类型声明

interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
}

interface TabData {
  id: string;
  title: string;
  filePath: string | null;
  content: string;
  isModified: boolean;
}

interface ElectronAPI {
  openFile: () => Promise<{ filePath: string; content: string } | null>;
  saveFile: (
    content: string,
    filePath?: string
  ) => Promise<{ success: boolean; filePath?: string }>;
  readFile: (filePath: string) => Promise<{ content: string | null }>;
  readDirectory: (dirPath: string) => Promise<FileTreeNode[]>;
  fileExists: (filePath: string) => Promise<boolean>;
  getRecentFiles: () => Promise<string[]>;
  addRecentFile: (filePath: string) => Promise<void>;
  removeRecentFile: (filePath: string) => Promise<void>;
  onMenuAction: (callback: (action: string) => void) => () => void;
  onFileOpened: (
    callback: (data: { filePath: string; content: string }) => void
  ) => () => void;
  onFolderOpened: (callback: (folderPath: string) => void) => () => void;
}

interface Window {
  electronAPI?: ElectronAPI;
}
