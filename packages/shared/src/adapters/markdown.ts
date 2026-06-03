import type { DocumentModel, RenderOptions, EditorCapability } from '../model/types';
import { FileFormatEnum } from '../model/types';
import { FormatAdapterBase } from './base';

/**
 * Markdown 格式适配器
 *
 * 核心适配器，手机和桌面端都需要。
 * 手机端：编辑 + 预览
 * 桌面端：CodeMirror 编辑 + 实时预览
 */
export class MarkdownAdapter extends FormatAdapterBase {
  readonly name = 'Markdown';
  readonly format = FileFormatEnum.MD;
  readonly extensions = ['.md', '.markdown', '.mdx'];
  readonly capability: EditorCapability = {
    canEdit: true,
    canEditOnMobile: true,
    editDescription: '源码编辑 + 所见即所得预览',
  };

  async read(buffer: ArrayBuffer, fileName?: string): Promise<DocumentModel> {
    const decoder = new TextDecoder('utf-8');
    const markdown = decoder.decode(buffer);

    return {
      format: FileFormatEnum.MD,
      title: fileName?.replace(/\.(md|markdown|mdx)$/i, '') ?? 'Untitled',
      content: markdown,
      metadata: {
        title: fileName ?? 'Untitled',
        modifiedAt: new Date(),
      },
    };
  }

  async write(model: DocumentModel): Promise<ArrayBuffer> {
    const markdown = typeof model.content === 'string'
      ? model.content
      : '';
    const encoder = new TextEncoder();
    return encoder.encode(markdown).buffer as ArrayBuffer;
  }

  /**
   * 将 Markdown 渲染为 HTML
   *
   * MVP 阶段：简单返回带样式的文本。
   * Phase 2：接入 unified/remark/rehype 管道做完整渲染。
   */
  async renderToHtml(model: DocumentModel, options?: RenderOptions): Promise<string> {
    const content = typeof model.content === 'string' ? model.content : '';
    const isDark = options?.darkMode ?? false;

    // 简易 HTML 包装，后续接入 unified 管道
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    padding: 16px;
    margin: 0;
    color: ${isDark ? '#e0e0e0' : '#333'};
    background: ${isDark ? '#1a1a2e' : '#fff'};
    max-width: ${options?.maxWidth ?? '100%'};
    word-wrap: break-word;
  }
  pre { background: ${isDark ? '#16213e' : '#f5f5f5'}; padding: 12px; border-radius: 6px; overflow-x: auto; }
  code { font-family: 'Fira Code', 'Courier New', monospace; font-size: 14px; }
  blockquote { border-left: 3px solid #6c63ff; margin: 0; padding-left: 12px; color: ${isDark ? '#aaa' : '#666'}; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid ${isDark ? '#444' : '#ddd'}; padding: 8px; text-align: left; }
  img { max-width: 100%; }
  a { color: #6c63ff; }
</style>
</head>
<body>
<pre>${escapeHtml(content)}</pre>
</body>
</html>`;
  }

  toMarkdown(model: DocumentModel): string {
    return typeof model.content === 'string' ? model.content : '';
  }

  fromMarkdown(markdown: string, title?: string): DocumentModel {
    return {
      format: FileFormatEnum.MD,
      title: title ?? 'Untitled',
      content: markdown,
      metadata: {
        title: title ?? 'Untitled',
        modifiedAt: new Date(),
      },
    };
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
