import type { FormatAdapter, DocumentModel, RenderOptions, EditorCapability } from '../model/types';
import type { FileFormatEnum } from '../model/types';

/**
 * 格式适配器抽象基类
 * 提供默认的空实现，子类按需覆写
 */
export abstract class FormatAdapterBase implements FormatAdapter {
  abstract readonly name: string;
  abstract readonly format: FileFormatEnum;
  abstract readonly extensions: string[];
  abstract readonly capability: EditorCapability;

  abstract read(buffer: ArrayBuffer, fileName?: string): Promise<DocumentModel>;
  abstract write(model: DocumentModel): Promise<ArrayBuffer>;
  abstract renderToHtml(model: DocumentModel, options?: RenderOptions): Promise<string>;

  // ---- 可选覆写 ----

  toMarkdown?(model: DocumentModel): string;
  fromMarkdown?(markdown: string, title?: string): DocumentModel;
}
