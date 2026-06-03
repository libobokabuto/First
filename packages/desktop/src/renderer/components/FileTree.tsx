import { useState } from 'react';

interface FileTreeProps {
  tree: FileTreeNode[] | null;
  folderPath: string | null;
  recentFiles: string[];
  onFileClick: (filePath: string) => void;
  onFolderOpen: () => void;
  onRecentFileRemove: (filePath: string) => void;
}

function getFileName(filePath: string): string {
  return filePath.split(/[\\/]/).pop() || filePath;
}

function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'md':
    case 'markdown':
    case 'mdx':
      return '📝';
    case 'pdf':
      return '📕';
    case 'docx':
      return '📘';
    case 'xlsx':
    case 'csv':
      return '📊';
    case 'pptx':
      return '📽';
    case 'txt':
      return '📄';
    default:
      return '📄';
  }
}

function TreeNode({
  node,
  depth,
  onFileClick,
}: {
  node: FileTreeNode;
  depth: number;
  onFileClick: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);

  if (node.isDirectory) {
    const hasChildren = node.children && node.children.length > 0;
    return (
      <div className="filetree-node">
        <div
          className="filetree-item filetree-dir"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => hasChildren && setExpanded(!expanded)}
        >
          <span className="filetree-arrow">{expanded ? '▼' : '▶'}</span>
          <span className="filetree-icon">📁</span>
          <span className="filetree-name">{node.name}</span>
        </div>
        {expanded && hasChildren && (
          <div className="filetree-children">
            {node.children!.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                onFileClick={onFileClick}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="filetree-node">
      <div
        className="filetree-item filetree-file"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onFileClick(node.path)}
      >
        <span className="filetree-arrow" style={{ visibility: 'hidden' }}>▶</span>
        <span className="filetree-icon">{getFileIcon(node.name)}</span>
        <span className="filetree-name">{node.name}</span>
      </div>
    </div>
  );
}

export default function FileTree({
  tree,
  folderPath,
  recentFiles,
  onFileClick,
  onFolderOpen,
  onRecentFileRemove,
}: FileTreeProps) {
  const [tab, setTab] = useState<'files' | 'recent'>('files');

  return (
    <div className="filetree">
      {/* 标签切换 */}
      <div className="filetree-tabs">
        <button
          className={`filetree-tab ${tab === 'files' ? 'active' : ''}`}
          onClick={() => setTab('files')}
        >
          文件
        </button>
        <button
          className={`filetree-tab ${tab === 'recent' ? 'active' : ''}`}
          onClick={() => setTab('recent')}
        >
          最近
        </button>
      </div>

      <div className="filetree-content">
        {tab === 'files' && (
          <div className="filetree-files">
            {!folderPath ? (
              <div className="filetree-empty">
                <p>尚未打开文件夹</p>
                <button className="filetree-open-btn" onClick={onFolderOpen}>
                  打开文件夹
                </button>
              </div>
            ) : (
              <>
                <div className="filetree-folder-path" title={folderPath}>
                  📂 {folderPath.split(/[\\/]/).pop() || folderPath}
                </div>
                {tree && tree.length > 0 ? (
                  tree.map((node) => (
                    <TreeNode
                      key={node.path}
                      node={node}
                      depth={0}
                      onFileClick={onFileClick}
                    />
                  ))
                ) : (
                  <div className="filetree-empty">
                    <p>该文件夹中没有支持的文档</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'recent' && (
          <div className="filetree-recent">
            {recentFiles.length === 0 ? (
              <div className="filetree-empty">
                <p>暂无最近打开的文件</p>
              </div>
            ) : (
              recentFiles.map((filePath) => (
                <div
                  key={filePath}
                  className="filetree-item filetree-recent-item"
                  onClick={() => onFileClick(filePath)}
                  title={filePath}
                >
                  <span className="filetree-icon">
                    {getFileIcon(getFileName(filePath))}
                  </span>
                  <span className="filetree-name">{getFileName(filePath)}</span>
                  <span className="filetree-recent-path">
                    {filePath.split(/[\\/]/).slice(0, -1).join('\\')}
                  </span>
                  <button
                    className="filetree-recent-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRecentFileRemove(filePath);
                    }}
                    title="移除"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
