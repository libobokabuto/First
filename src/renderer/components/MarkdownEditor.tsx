import React, { useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { FileTab } from '../../shared/types';

interface MarkdownEditorProps {
  tab: FileTab;
  onContentChange: (content: string) => void;
}

/** CodeMirror 暗色主题 */
const darkTheme = EditorView.theme(
  {
    '&': { backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' },
    '.cm-content': { caretColor: 'var(--text-primary)' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--text-primary)' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: 'var(--bg-active)',
    },
    '.cm-activeLine': { backgroundColor: 'var(--bg-hover)' },
    '.cm-gutters': {
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-muted)',
      borderRight: '1px solid var(--border-color)',
    },
    '.cm-foldPlaceholder': { color: 'var(--text-muted)' },
  },
  { dark: true }
);

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ tab, onContentChange }) => {
  const handleChange = useCallback(
    (value: string) => {
      onContentChange(value);
    },
    [onContentChange]
  );

  const extensions = useMemo(
    () => [markdown({ base: markdownLanguage, codeLanguages: languages }), darkTheme],
    []
  );

  return (
    <div className="md-editor">
      {/* 编辑面板 */}
      <div className="md-editor-pane">
        <CodeMirror
          value={tab.content}
          onChange={handleChange}
          extensions={extensions}
          height="100%"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            foldGutter: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
          }}
        />
      </div>

      {/* 预览面板 */}
      <div className="md-editor-pane md-preview">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{tab.content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownEditor;
