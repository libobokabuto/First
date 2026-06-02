/** 文件标签页模型 */
export interface FileTab {
  /** 唯一标识（使用文件路径） */
  id: string;
  /** 文件路径 */
  path: string;
  /** 文件名 */
  name: string;
  /** 文件扩展名（含点） */
  ext: string;
  /** 文件内容（文本格式直接存，二进制存 base64） */
  content: string;
  /** 编码方式 */
  encoding: 'utf-8' | 'base64';
  /** 是否已修改 */
  dirty: boolean;
  /** 文件大小（字节） */
  size: number;
}

/** 应用主题 */
export type Theme = 'light' | 'dark';

/** 应用全局状态 */
export interface AppState {
  /** 当前打开的标签页列表 */
  tabs: FileTab[];
  /** 当前激活的标签页 ID */
  activeTabId: string | null;
  /** 主题 */
  theme: Theme;
  /** 侧边栏是否展开 */
  sidebarOpen: boolean;
}

/** 支持的文档格式分类 */
export type DocCategory =
  | 'markdown'
  | 'text'
  | 'word'
  | 'pdf'
  | 'excel'
  | 'powerpoint'
  | 'ebook'
  | 'unknown';

/** 根据扩展名判断文档类别 */
export function getDocCategory(ext: string): DocCategory {
  const map: Record<string, DocCategory> = {
    '.md': 'markdown',
    '.txt': 'text',
    '.rtf': 'text',
    '.csv': 'excel',
    '.docx': 'word',
    '.doc': 'word',
    '.odt': 'word',
    '.pdf': 'pdf',
    '.xlsx': 'excel',
    '.xls': 'excel',
    '.ods': 'excel',
    '.pptx': 'powerpoint',
    '.ppt': 'powerpoint',
    '.odp': 'powerpoint',
    '.epub': 'ebook',
  };
  return map[ext] ?? 'unknown';
}
