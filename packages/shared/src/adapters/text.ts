import type { DocumentModel, RenderOptions, EditorCapability } from '../model/types';
import { FileFormatEnum } from '../model/types';
import { FormatAdapterBase } from './base';

/**
 * 纯文本格式适配器
 */
export class TextAdapter extends FormatAdapterBase {
  readonly name = 'Plain Text';
  readonly format = FileFormatEnum.TXT;
  readonly extensions = ['.txt', '.text', '.log'];
  readonly capability: EditorCapability = {
    canEdit: true,
    canEditOnMobile: true,
    editDescription: '纯文本编辑',
  };

  async read(buffer: ArrayBuffer, fileName?: string): Promise<DocumentModel> {
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(buffer);

    return {
      format: FileFormatEnum.TXT,
      title: fileName ?? 'Untitled',
      content: text,
      metadata: {
        title: fileName ?? 'Untitled',
        modifiedAt: new Date(),
      },
    };
  }

  async write(model: DocumentModel): Promise<ArrayBuffer> {
    const text = typeof model.content === 'string' ? model.content : '';
    const encoder = new TextEncoder();
    return encoder.encode(text).buffer as ArrayBuffer;
  }

  async renderToHtml(model: DocumentModel, options?: RenderOptions): Promise<string> {
    const content = typeof model.content === 'string' ? model.content : '';
    const isDark = options?.darkMode ?? false;

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body {
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.6;
    padding: 16px;
    margin: 0;
    color: ${isDark ? '#e0e0e0' : '#333'};
    background: ${isDark ? '#1a1a2e' : '#fff'};
    white-space: pre-wrap;
    word-wrap: break-word;
  }
</style>
</head>
<body>${escapeHtml(content)}</body>
</html>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
