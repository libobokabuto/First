import { useState, useCallback, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import { MarkdownAdapter } from '@shared/adapters/markdown';
import type { DocumentModel } from '@shared/model/types';
import { FileFormatEnum } from '@shared/model/types';
import './App.css';

const adapter = new MarkdownAdapter();

const defaultContent = `# 欢迎使用 DocKit

## 开始使用

这是一个基于 **CodeMirror 6** 的 Markdown 编辑器。

### 功能特性

- 左侧源码编辑 + 右侧实时预览
- 语法高亮
- GitHub Flavored Markdown 完整支持

\`\`\`typescript
const greeting: string = 'Hello, DocKit!';
console.log(greeting);
\`\`\`

> 在左侧编辑器中输入内容，右侧会实时渲染预览！

| 功能 | 状态 |
|------|------|
| 编辑器 | ✅ |
| 预览 | ✅ |
| 菜单栏 | ✅ |

- [x] 任务一：完成编辑器
- [x] 任务二：完成预览
- [ ] 任务三：后续迭代

~~删除线文本~~  **加粗**  *斜体*
`;

// CodeMirror 暗色主题
const darkEditorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#0d1117',
      color: '#c9d1d9',
      height: '100%',
    },
    '.cm-content': {
      caretColor: '#58a6ff',
      fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
      fontSize: '14px',
      lineHeight: '1.7',
      padding: '16px',
    },
    '.cm-gutters': {
      backgroundColor: '#0d1117',
      color: '#484f58',
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#161b22',
    },
    '.cm-activeLine': {
      backgroundColor: '#161b2240',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: '#58a6ff',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: '#264f78',
    },
    '.cm-cursor': {
      borderLeftColor: '#58a6ff',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: '#21262d',
      color: '#8b949e',
    },
  },
  { dark: true }
);

export default function App() {
  const [content, setContent] = useState(defaultContent);
  const [previewHtml, setPreviewHtml] = useState('');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // 实时渲染预览（使用 shared MarkdownAdapter）
  useEffect(() => {
    let cancelled = false;
    const doc: DocumentModel = {
      format: FileFormatEnum.MD,
      title: filePath
        ? filePath.split(/[\\/]/).pop()?.replace(/\.md$/i, '') ?? 'Untitled'
        : 'Untitled',
      content,
      metadata: {
        title: filePath ?? 'Untitled',
        modifiedAt: new Date(),
      },
    };
    adapter.renderToHtml(doc, { darkMode: true }).then((html) => {
      if (!cancelled) setPreviewHtml(html);
    });
    return () => {
      cancelled = true;
    };
  }, [content, filePath]);

  // 监听菜单动作
  useEffect(() => {
    const cleanup = window.electronAPI?.onMenuAction((action: string) => {
      switch (action) {
        case 'new':
          setContent('');
          setFilePath(null);
          setIsModified(false);
          break;
        case 'save':
          window.electronAPI?.saveFile(content, filePath ?? undefined).then((result) => {
            if (result?.success && result.filePath) {
              setFilePath(result.filePath);
              setIsModified(false);
            }
          });
          break;
      }
    });
    return () => cleanup?.();
  }, [content, filePath, isModified]);

  // 监听外部文件打开
  useEffect(() => {
    const cleanup = window.electronAPI?.onFileOpened(
      (data: { filePath: string; content: string }) => {
        setContent(data.content);
        setFilePath(data.filePath);
        setIsModified(false);
      }
    );
    return () => cleanup?.();
  }, []);

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
    setIsModified(true);
  }, []);

  // 分割线拖拽
  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pos = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPosition(Math.min(Math.max(pos, 20), 80));
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const lineCount = content.split(/\r?\n/).length;
  const charCount = content.length;
  const fileName = filePath ? filePath.split(/[\\/]/).pop() : 'Untitled.md';

  return (
    <div className="app">
      {/* 标题栏 */}
      <div className="titlebar">
        <span className="titlebar-file">
          {fileName}
          {isModified && <span className="titlebar-modified"> ●</span>}
        </span>
      </div>

      {/* 编辑器 + 预览 */}
      <div ref={containerRef} className="editor-container">
        <div className="editor-pane" style={{ width: `${splitPosition}%` }}>
          <CodeMirror
            value={content}
            height="100%"
            theme={darkEditorTheme}
            extensions={[
              markdown({ base: markdownLanguage, codeLanguages: languages }),
              EditorView.lineWrapping,
            ]}
            onChange={handleContentChange}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: true,
              foldGutter: true,
              autocompletion: true,
              bracketMatching: true,
              closeBrackets: true,
            }}
          />
        </div>

        <div className="divider" onMouseDown={handleMouseDown} />

        <div className="preview-pane" style={{ width: `${100 - splitPosition}%` }}>
          <iframe
            srcDoc={previewHtml}
            className="preview-iframe"
            title="预览"
            sandbox="allow-same-origin"
          />
        </div>
      </div>

      {/* 状态栏 */}
      <div className="statusbar">
        <span>{lineCount} 行</span>
        <span>{charCount} 字符</span>
        <span>Markdown</span>
        {isModified && <span className="statusbar-modified">未保存</span>}
      </div>
    </div>
  );
}
