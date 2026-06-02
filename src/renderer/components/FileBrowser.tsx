import React from 'react';
import type { FileTab } from '../../shared/types';
import { getDocCategory } from '../../shared/types';

interface FileBrowserProps {
  onOpenFile: (filePath: string) => void;
  openTabs: FileTab[];
  activeTabId: string | null;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

/** 根据文档类别返回图标 */
function getFileIcon(ext: string): string {
  const cat = getDocCategory(ext);
  switch (cat) {
    case 'markdown':
      return '📝';
    case 'text':
      return '📄';
    case 'word':
      return '📃';
    case 'pdf':
      return '📕';
    case 'excel':
      return '📊';
    case 'powerpoint':
      return '📽️';
    case 'ebook':
      return '📖';
    default:
      return '📎';
  }
}

const FileBrowser: React.FC<FileBrowserProps> = ({
  openTabs,
  activeTabId,
  onTabClick,
  onTabClose,
}) => {
  return (
    <div className="file-browser">
      <div className="file-browser-header">📂 已打开的文件</div>
      {openTabs.length === 0 ? (
        <div style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
          暂无打开的文件
          <br />
          使用 ⌘O / Ctrl+O 打开文件
        </div>
      ) : (
        openTabs.map((tab) => (
          <div
            key={tab.id}
            className={`file-browser-item ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => onTabClick(tab.id)}
            title={tab.path}
          >
            <span className="file-icon">{getFileIcon(tab.ext)}</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {tab.name}
            </span>
            {tab.dirty && <span style={{ color: 'var(--accent)', fontSize: '10px' }}>●</span>}
            <button
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '0 2px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              title="关闭"
            >
              ×
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default FileBrowser;
