import { useState, useCallback, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import { MarkdownAdapter } from '@shared/adapters/markdown';
import type { DocumentModel } from '@shared/model/types';
import { FileFormatEnum } from '@shared/model/types';
import TabBar from './components/TabBar';
import FileTree from './components/FileTree';
import WelcomePage from './components/WelcomePage';
import './App.css';

const adapter = new MarkdownAdapter();

let tabIdCounter = 0;
function generateTabId(): string {
  return `tab_${++tabIdCounter}`;
}

function getTitle(filePath: string | null): string {
  return filePath ? filePath.split(/[\\/]/).pop() || 'Untitled.md' : 'Untitled.md';
}

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
  // 标签页状态
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');

  // 侧栏 & 文件树
  const [showSidebar, setShowSidebar] = useState(false);
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileTreeNode[] | null>(null);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);

  // 编辑器
  const [splitPosition, setSplitPosition] = useState(50);
  const [previewHtml, setPreviewHtml] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // 获取当前活跃标签
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

  // 初始化：加载最近文件
  useEffect(() => {
    window.electronAPI?.getRecentFiles().then(setRecentFiles);
  }, []);

  // 实时渲染预览（activeTab 内容变化时）
  useEffect(() => {
    if (!activeTab) {
      setPreviewHtml('');
      return;
    }
    let cancelled = false;
    const doc: DocumentModel = {
      format: FileFormatEnum.MD,
      title: activeTab.title,
      content: activeTab.content,
      metadata: {
        title: activeTab.filePath ?? 'Untitled',
        modifiedAt: new Date(),
      },
    };
    adapter.renderToHtml(doc, { darkMode: true }).then((html) => {
      if (!cancelled) setPreviewHtml(html);
    });
    return () => {
      cancelled = true;
    };
  }, [activeTab?.content, activeTab?.filePath, activeTab]);

  // ── 标签操作 ──────────────────────────────────────────
  const newTab = useCallback((filePath?: string, content?: string) => {
    const id = generateTabId();
    const tab: TabData = {
      id,
      title: getTitle(filePath ?? null),
      filePath: filePath ?? null,
      content: content ?? '',
      isModified: false,
    };
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(id);
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);
      if (id === activeTabId) {
        // 切换到相邻标签
        if (next.length > 0) {
          const newIdx = Math.min(idx, next.length - 1);
          setActiveTabId(next[newIdx].id);
        } else {
          setActiveTabId('');
        }
      }
      return next;
    });
  }, [activeTabId]);

  const switchTab = useCallback((id: string) => {
    setActiveTabId(id);
  }, []);

  const reorderTabs = useCallback((fromIndex: number, toIndex: number) => {
    setTabs((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const closeCurrentTab = useCallback(() => {
    if (activeTabId) closeTab(activeTabId);
  }, [activeTabId, closeTab]);

  // 更新当前标签内容
  const updateActiveContent = useCallback((content: string) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, content, isModified: true } : t
      )
    );
  }, [activeTabId]);

  // ── 打开文件 ──────────────────────────────────────────
  const openFileInTab = useCallback(async (filePath: string) => {
    // 先检查文件是否已经打开
    const existing = tabs.find((t) => t.filePath === filePath);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }

    // 读取文件内容
    const result = await window.electronAPI?.readFile(filePath);
    if (result?.content !== null && result?.content !== undefined) {
      newTab(filePath, result.content);
      window.electronAPI?.addRecentFile(filePath);
      // 刷新最近文件列表
      window.electronAPI?.getRecentFiles().then(setRecentFiles);
    }
  }, [tabs, newTab]);

  const handleOpenFileDialog = useCallback(async () => {
    const result = await window.electronAPI?.openFile();
    if (result?.filePath && result?.content !== null) {
      newTab(result.filePath, result.content);
      window.electronAPI?.getRecentFiles().then(setRecentFiles);
    }
  }, [newTab]);

  const handleOpenFolder = useCallback(async () => {
    // 通过菜单发送事件触发
    // 直接调用 IPC 不可用，需要通过菜单
    // 变通：从主进程读取目录
    // 这里我们用 Ctrl+Shift+O 会触发菜单事件
    const result = await window.electronAPI?.readDirectory('');
    if (result) {
      // 要求用户先通过菜单选择文件夹
      // onFolderOpened 会设置 folderPath
    }
  }, []);

  // ── 保存当前标签 ──────────────────────────────────────
  const saveCurrentTab = useCallback(async () => {
    if (!activeTab) return;
    const result = await window.electronAPI?.saveFile(
      activeTab.content,
      activeTab.filePath ?? undefined
    );
    if (result?.success && result.filePath) {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                filePath: result.filePath!,
                title: getTitle(result.filePath!),
                isModified: false,
              }
            : t
        )
      );
      if (result.filePath) {
        window.electronAPI?.getRecentFiles().then(setRecentFiles);
      }
    }
  }, [activeTab, activeTabId]);

  // ── 菜单动作监听 ──────────────────────────────────────
  useEffect(() => {
    const cleanup = window.electronAPI?.onMenuAction((action: string) => {
      switch (action) {
        case 'new':
          newTab();
          break;
        case 'save':
          saveCurrentTab();
          break;
        case 'closeTab':
          closeCurrentTab();
          break;
        case 'toggleSidebar':
          setShowSidebar((prev) => !prev);
          break;
      }
    });
    return () => cleanup?.();
  }, [newTab, saveCurrentTab, closeCurrentTab]);

  // ── 外部文件打开监听 ──────────────────────────────────
  useEffect(() => {
    const cleanup = window.electronAPI?.onFileOpened(
      (data: { filePath: string; content: string }) => {
        // 检查是否已打开
        const existing = tabs.find((t) => t.filePath === data.filePath);
        if (existing) {
          setActiveTabId(existing.id);
          return;
        }
        newTab(data.filePath, data.content);
        window.electronAPI?.getRecentFiles().then(setRecentFiles);
      }
    );
    return () => cleanup?.();
  }, [tabs, newTab]);

  // ── 文件夹打开监听 ────────────────────────────────────
  useEffect(() => {
    const cleanup = window.electronAPI?.onFolderOpened(async (folderPath: string) => {
      setFolderPath(folderPath);
      setShowSidebar(true);
      const tree = await window.electronAPI?.readDirectory(folderPath);
      setFileTree(tree ?? []);
    });
    return () => cleanup?.();
  }, []);

  // ── 拖拽文件到窗口打开 ────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Electron 的 File 对象有 path 属性
        const filePath = (file as unknown as { path?: string }).path;
        if (filePath) {
          openFileInTab(filePath);
        }
      }
    }
  }, [openFileInTab]);

  // ── 分割线拖拽 ──────────────────────────────────────────
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

  // ── 文件树点击文件 ──────────────────────────────────────
  const handleFileTreeClick = useCallback((filePath: string) => {
    openFileInTab(filePath);
  }, [openFileInTab]);

  // ── 最近文件移除 ────────────────────────────────────────
  const handleRecentFileRemove = useCallback(async (filePath: string) => {
    await window.electronAPI?.removeRecentFile(filePath);
    setRecentFiles((prev) => prev.filter((f) => f !== filePath));
  }, []);

  // ── 状态栏数据 ──────────────────────────────────────────
  const lineCount = activeTab ? activeTab.content.split(/\r?\n/).length : 0;
  const charCount = activeTab ? activeTab.content.length : 0;

  return (
    <div
      className="app"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 标签栏 */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSwitch={switchTab}
        onTabClose={closeTab}
        onTabReorder={reorderTabs}
        onNewTab={() => newTab()}
      />

      <div className="app-body">
        {/* 文件树侧栏 */}
        {showSidebar && (
          <FileTree
            tree={fileTree}
            folderPath={folderPath}
            recentFiles={recentFiles}
            onFileClick={handleFileTreeClick}
            onFolderOpen={handleOpenFolder}
            onRecentFileRemove={handleRecentFileRemove}
          />
        )}

        {/* 主内容区 */}
        <div className="app-main">
          {!activeTab ? (
            <WelcomePage
              onNewTab={() => newTab()}
              onOpenFile={handleOpenFileDialog}
              onOpenFolder={handleOpenFolder}
            />
          ) : (
            <>
              {/* 编辑器 + 预览 */}
              <div ref={containerRef} className="editor-container">
                <div className="editor-pane" style={{ width: `${splitPosition}%` }}>
                  <CodeMirror
                    value={activeTab.content}
                    height="100%"
                    theme={darkEditorTheme}
                    extensions={[
                      markdown({ base: markdownLanguage, codeLanguages: languages }),
                      EditorView.lineWrapping,
                    ]}
                    onChange={updateActiveContent}
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
                {activeTab.isModified && (
                  <span className="statusbar-modified">未保存</span>
                )}
                {activeTab.filePath && (
                  <span className="statusbar-path">{activeTab.filePath}</span>
                )}
                <span className="statusbar-spacer" />
                <span className="statusbar-tabcount">
                  标签 {tabs.findIndex((t) => t.id === activeTabId) + 1}/{tabs.length}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
