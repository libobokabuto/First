import React, { useState, useCallback, useEffect } from 'react';
import type { FileTab, Theme } from '../shared/types';
import TabBar from './components/TabBar';
import FileBrowser from './components/FileBrowser';
import MarkdownEditor from './components/MarkdownEditor';
import WelcomeScreen from './components/WelcomeScreen';

const App: React.FC = () => {
  const [tabs, setTabs] = useState<FileTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 根据当前激活的标签页
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;

  // 打开文件
  const openFile = useCallback(
    async (filePath: string) => {
      // 检查是否已打开
      const existing = tabs.find((t) => t.path === filePath);
      if (existing) {
        setActiveTabId(existing.id);
        return;
      }

      // 获取文件信息
      const info = await window.electronAPI.getFileInfo(filePath);
      if ('error' in info) {
        console.error('获取文件信息失败:', info.error);
        return;
      }

      // 读取文件内容
      const result = await window.electronAPI.readFile(filePath);
      if ('error' in result || !result.data) {
        console.error('读取文件失败:', result.error);
        return;
      }

      const newTab: FileTab = {
        id: filePath,
        path: filePath,
        name: info.name,
        ext: info.ext,
        content: result.data,
        encoding: result.encoding ?? 'utf-8',
        dirty: false,
        size: info.size,
      };

      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
    },
    [tabs]
  );

  // 关闭标签页
  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === tabId);
        const next = prev.filter((t) => t.id !== tabId);
        // 如果关闭的是当前激活的标签，切换到相邻标签
        if (activeTabId === tabId && next.length > 0) {
          const newIdx = Math.min(idx, next.length - 1);
          setActiveTabId(next[newIdx].id);
        } else if (next.length === 0) {
          setActiveTabId(null);
        }
        return next;
      });
    },
    [activeTabId]
  );

  // 更新标签内容
  const updateTabContent = useCallback((tabId: string, content: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, content, dirty: true } : t))
    );
  }, []);

  // 保存当前标签
  const saveCurrentTab = useCallback(async () => {
    if (!activeTab || !activeTab.dirty) return;
    const result = await window.electronAPI.writeFile(activeTab.path, activeTab.content);
    if ('success' in result && result.success) {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTab.id ? { ...t, dirty: false } : t))
      );
    } else {
      console.error('保存失败:', (result as any).error);
    }
  }, [activeTab]);

  // 监听主进程事件
  useEffect(() => {
    const unsubFile = window.electronAPI.onFileOpen((filePath) => {
      openFile(filePath);
    });
    const unsubSave = window.electronAPI.onMenuSave(() => {
      saveCurrentTab();
    });
    const unsubDark = window.electronAPI.onToggleDarkMode(() => {
      setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    });

    return () => {
      unsubFile();
      unsubSave();
      unsubDark();
    };
  }, [openFile, saveCurrentTab]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentTab();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveCurrentTab]);

  // 应用主题到根元素
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // 渲染编辑器
  const renderEditor = () => {
    if (!activeTab) {
      return <WelcomeScreen onOpenFile={() => {}} />;
    }

    switch (activeTab.ext) {
      case '.md':
      case '.txt':
      case '.csv':
        return (
          <MarkdownEditor
            tab={activeTab}
            onContentChange={(content) => updateTabContent(activeTab.id, content)}
          />
        );
      default:
        return (
          <div className="placeholder-view">
            <p>📄 暂不支持编辑此格式: {activeTab.ext}</p>
            <p>文件大小: {(activeTab.size / 1024).toFixed(1)} KB</p>
          </div>
        );
    }
  };

  return (
    <div className={`app-layout theme-${theme}`}>
      {/* 侧边栏 */}
      {sidebarOpen && (
        <aside className="sidebar">
          <FileBrowser
            onOpenFile={openFile}
            openTabs={tabs}
            activeTabId={activeTabId}
            onTabClick={setActiveTabId}
            onTabClose={closeTab}
          />
        </aside>
      )}

      {/* 主区域 */}
      <div className="main-area">
        {/* 顶部工具栏 */}
        <header className="toolbar">
          <button
            className="toolbar-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="切换侧边栏"
          >
            ☰
          </button>
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onTabClick={setActiveTabId}
            onTabClose={closeTab}
          />
          <button
            className="toolbar-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="切换主题"
          >
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
        </header>

        {/* 编辑区域 */}
        <main className="editor-container">{renderEditor()}</main>

        {/* 底部状态栏 */}
        <footer className="statusbar">
          <span>{activeTab ? activeTab.path : '未打开文件'}</span>
          <span>{activeTab?.dirty ? '● 未保存' : ''}</span>
          <span>{theme === 'dark' ? '暗色模式' : '亮色模式'}</span>
        </footer>
      </div>
    </div>
  );
};

export default App;
