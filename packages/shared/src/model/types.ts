// ============================================================
// DocKit 统一数据模型 & 适配器接口
// ============================================================

/** 支持的文档格式枚举 */
export enum FileFormatEnum {
  MD = 'md',
  TXT = 'txt',
  PDF = 'pdf',
  DOCX = 'docx',
  XLSX = 'xlsx',
  CSV = 'csv',
  PPTX = 'pptx',
  EPUB = 'epub',
}

/** 文件格式元信息 */
export interface FileFormat {
  readonly format: FileFormatEnum;
  readonly extensions: string[];
  readonly displayName: string;
  readonly mimeTypes: string[];
}

/** 编辑能力描述 */
export interface EditorCapability {
  readonly canEdit: boolean;
  readonly canEditOnMobile: boolean;
  readonly editDescription: string;
}

/** 文档元数据 */
export interface DocumentMeta {
  title: string;
  author?: string;
  createdAt?: Date;
  modifiedAt?: Date;
  fileSize?: number;
  pageCount?: number;
}

/** 统一文档模型 */
export interface DocumentModel {
  /** 文档格式类型 */
  format: FileFormatEnum;
  /** 文档标题（通常取文件名） */
  title: string;
  /** 格式相关的结构化内容 */
  content: unknown;
  /** 文档元数据 */
  metadata: DocumentMeta;
}

/** 格式适配器接口 —— 跨端共享核心 */
export interface FormatAdapter {
  /** 适配器名称 */
  readonly name: string;
  /** 支持的格式 */
  readonly format: FileFormatEnum;
  /** 支持的文件扩展名 */
  readonly extensions: string[];
  /** 编辑能力 */
  readonly capability: EditorCapability;

  /**
   * 从二进制数据解析为统一文档模型
   * @param buffer 文件二进制数据
   * @param fileName 文件名（用于提取标题等）
   */
  read(buffer: ArrayBuffer, fileName?: string): Promise<DocumentModel>;

  /**
   * 将统一文档模型写回二进制数据
   * @param model 文档模型
   */
  write(model: DocumentModel): Promise<ArrayBuffer>;

  /**
   * 将文档模型渲染为 HTML 字符串（跨端通用）
   * 手机端用 WebView 渲染，桌面端可嵌入 DOM
   * @param model 文档模型
   * @param options 渲染选项
   */
  renderToHtml(model: DocumentModel, options?: RenderOptions): Promise<string>;

  /**
   * 获取用于编辑器的 Markdown 表示
   * 仅 Markdown 适配器有效实现
   * @param model 文档模型
   */
  toMarkdown?(model: DocumentModel): string;

  /**
   * 从 Markdown 源码创建文档模型
   * @param markdown Markdown 源码
   * @param title 文档标题
   */
  fromMarkdown?(markdown: string, title?: string): DocumentModel;
}

/** HTML 渲染选项 */
export interface RenderOptions {
  /** 暗色模式 */
  darkMode?: boolean;
  /** 内容宽度（CSS 值，如 "100%" 或 "800px"） */
  maxWidth?: string;
  /** 是否注入基础样式 */
  injectBaseStyles?: boolean;
}
