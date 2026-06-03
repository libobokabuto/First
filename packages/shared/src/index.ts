// DocKit Shared — 跨端共享层入口

// 类型
export type {
  FormatAdapter,
  DocumentModel,
  DocumentMeta,
  EditorCapability,
  FileFormat,
} from './model/types';

export {
  FileFormatEnum,
} from './model/types';

// 适配器
export { createAdapterRegistry, getAdapterForFile } from './adapters/registry';
export { FormatAdapterBase } from './adapters/base';
export { MarkdownAdapter } from './adapters/markdown';
export { TextAdapter } from './adapters/text';
