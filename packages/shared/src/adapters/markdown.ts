import type { DocumentModel, RenderOptions, EditorCapability } from '../model/types';
import { FileFormatEnum } from '../model/types';
import { FormatAdapterBase } from './base';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeHighlight from 'rehype-highlight';

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
   * 使用 unified + remark-gfm 管道做完整 GFM 渲染
   */
  async renderToHtml(model: DocumentModel, options?: RenderOptions): Promise<string> {
    const content = typeof model.content === 'string' ? model.content : '';
    const isDark = options?.darkMode ?? false;

    // unified 管道：parse → gfm → rehype → highlight → stringify
    const result = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeHighlight, { detect: true })
      .use(rehypeStringify)
      .process(content);

    const bodyHtml = String(result.value);

    const themeCss = getThemeCss(isDark);
    const highlightCss = getHighlightCss(isDark);

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
${themeCss}
${highlightCss}
</style>
</head>
<body>
<div class="markdown-body">
${bodyHtml}
</div>
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

/** 生成 Markdown 主题 CSS（亮色/暗色） */
function getThemeCss(isDark: boolean): string {
  const bg = isDark ? '#0d1117' : '#ffffff';
  const fg = isDark ? '#c9d1d9' : '#24292f';
  const border = isDark ? '#30363d' : '#d0d7de';
  const codeBg = isDark ? '#161b22' : '#f6f8fa';
  const quoteBorder = isDark ? '#3fb950' : '#0969da';
  const quoteFg = isDark ? '#8b949e' : '#57606a';
  const thBg = isDark ? '#21262d' : '#f6f8fa';
  const hrColor = isDark ? '#21262d' : '#d0d7de';
  const linkColor = isDark ? '#58a6ff' : '#0969da';

  return `
* { box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', sans-serif;
  line-height: 1.6;
  padding: 0;
  margin: 0;
  color: ${fg};
  background: ${bg};
  word-wrap: break-word;
}
.markdown-body {
  padding: 16px;
  max-width: 100%;
}
.markdown-body h1, .markdown-body h2, .markdown-body h3,
.markdown-body h4, .markdown-body h5, .markdown-body h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
  color: ${fg};
}
.markdown-body h1 { font-size: 2em; border-bottom: 1px solid ${border}; padding-bottom: .3em; }
.markdown-body h2 { font-size: 1.5em; border-bottom: 1px solid ${border}; padding-bottom: .3em; }
.markdown-body h3 { font-size: 1.25em; }
.markdown-body h4 { font-size: 1em; }
.markdown-body p { margin-top: 0; margin-bottom: 16px; }
.markdown-body a { color: ${linkColor}; text-decoration: none; }
.markdown-body strong { font-weight: 600; }
.markdown-body del { color: ${isDark ? '#6e7681' : '#656d76'}; }
.markdown-body img { max-width: 100%; box-sizing: border-box; }
.markdown-body hr {
  height: .25em;
  padding: 0;
  margin: 24px 0;
  background-color: ${hrColor};
  border: 0;
}
.markdown-body blockquote {
  margin: 0 0 16px 0;
  padding: 0 1em;
  color: ${quoteFg};
  border-left: .25em solid ${quoteBorder};
}
.markdown-body blockquote > :first-child { margin-top: 0; }
.markdown-body blockquote > :last-child { margin-bottom: 0; }
.markdown-body ul, .markdown-body ol { padding-left: 2em; margin-bottom: 16px; }
.markdown-body li + li { margin-top: .25em; }
.markdown-body li > p { margin-bottom: 8px; }

/* 任务列表 */
.markdown-body input[type="checkbox"] {
  margin-right: 0.5em;
  vertical-align: middle;
}

/* 代码 */
.markdown-body code {
  font-family: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 85%;
  padding: .2em .4em;
  margin: 0 .1em;
  background-color: ${codeBg};
  border-radius: 6px;
  color: ${isDark ? '#d2a8ff' : '#cf222e'};
}
.markdown-body pre {
  background: ${codeBg};
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 16px;
  line-height: 1.45;
}
.markdown-body pre code {
  background: none;
  padding: 0;
  margin: 0;
  font-size: 100%;
  color: ${fg};
  border-radius: 0;
}

/* 表格 */
.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
  display: block;
  overflow-x: auto;
}
.markdown-body th, .markdown-body td {
  border: 1px solid ${border};
  padding: 6px 13px;
  text-align: left;
}
.markdown-body th {
  font-weight: 600;
  background: ${thBg};
}
.markdown-body tr:nth-child(even) { background: ${isDark ? '#161b22' : '#f6f8fa'}; }
.markdown-body tr:nth-child(odd) { background: ${bg}; }
`;
}

/** highlight.js 主题 CSS（亮色用 github，暗色用 github-dark） */
function getHighlightCss(isDark: boolean): string {
  if (isDark) {
    return `
/* github-dark 风格 */
.hljs { color: #c9d1d9; background: #161b22; }
.hljs-doctag, .hljs-keyword, .hljs-meta .hljs-keyword, .hljs-template-tag, .hljs-template-variable, .hljs-type, .hljs-variable.language_ { color: #ff7b72; }
.hljs-title, .hljs-title.class_, .hljs-title.class_.inherited__, .hljs-title.function_ { color: #d2a8ff; }
.hljs-attr, .hljs-attribute, .hljs-literal, .hljs-meta, .hljs-number, .hljs-operator, .hljs-selector-attr, .hljs-selector-class, .hljs-selector-id, .hljs-variable { color: #79c0ff; }
.hljs-meta .hljs-string, .hljs-regexp, .hljs-string { color: #a5d6ff; }
.hljs-built_in, .hljs-symbol { color: #ffa657; }
.hljs-code, .hljs-comment, .hljs-formula { color: #8b949e; }
.hljs-name, .hljs-quote, .hljs-selector-pseudo, .hljs-selector-tag { color: #7ee787; }
.hljs-subst { color: #c9d1d9; }
.hljs-section { color: #1f6feb; font-weight: bold; }
.hljs-bullet { color: #f2cc60; }
.hljs-emphasis { font-style: italic; }
.hljs-strong { font-weight: bold; }
.hljs-addition { color: #aff5b4; background-color: #033a16; }
.hljs-deletion { color: #ffdcd7; background-color: #67060c; }
`;
  }
  return `
/* github 风格 */
.hljs { color: #24292f; background: #f6f8fa; }
.hljs-doctag, .hljs-keyword, .hljs-meta .hljs-keyword, .hljs-template-tag, .hljs-template-variable, .hljs-type, .hljs-variable.language_ { color: #cf222e; }
.hljs-title, .hljs-title.class_, .hljs-title.class_.inherited__, .hljs-title.function_ { color: #8250df; }
.hljs-attr, .hljs-attribute, .hljs-literal, .hljs-meta, .hljs-number, .hljs-operator, .hljs-selector-attr, .hljs-selector-class, .hljs-selector-id, .hljs-variable { color: #0550ae; }
.hljs-meta .hljs-string, .hljs-regexp, .hljs-string { color: #0a3069; }
.hljs-built_in, .hljs-symbol { color: #953800; }
.hljs-code, .hljs-comment, .hljs-formula { color: #656d76; }
.hljs-name, .hljs-quote, .hljs-selector-pseudo, .hljs-selector-tag { color: #116329; }
.hljs-subst { color: #24292f; }
.hljs-section { color: #8250df; font-weight: bold; }
.hljs-bullet { color: #953800; }
.hljs-emphasis { font-style: italic; }
.hljs-strong { font-weight: bold; }
.hljs-addition { color: #1a7f37; background-color: #dafbe1; }
.hljs-deletion { color: #cf222e; background-color: #ffebe9; }
`;
}
