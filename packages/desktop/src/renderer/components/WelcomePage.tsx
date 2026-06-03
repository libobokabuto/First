export default function WelcomePage({
  onNewTab,
  onOpenFile,
  onOpenFolder,
}: {
  onNewTab: () => void;
  onOpenFile: () => void;
  onOpenFolder: () => void;
}) {
  return (
    <div className="welcome">
      <div className="welcome-content">
        <h1 className="welcome-title">DocKit</h1>
        <p className="welcome-subtitle">Markdown 文档编辑器</p>

        <div className="welcome-shortcuts">
          <div className="welcome-shortcut" onClick={onNewTab}>
            <span className="welcome-shortcut-icon">📝</span>
            <div>
              <div className="welcome-shortcut-label">新建文档</div>
              <div className="welcome-shortcut-key">Ctrl + N</div>
            </div>
          </div>
          <div className="welcome-shortcut" onClick={onOpenFile}>
            <span className="welcome-shortcut-icon">📂</span>
            <div>
              <div className="welcome-shortcut-label">打开文件</div>
              <div className="welcome-shortcut-key">Ctrl + O</div>
            </div>
          </div>
          <div className="welcome-shortcut" onClick={onOpenFolder}>
            <span className="welcome-shortcut-icon">📁</span>
            <div>
              <div className="welcome-shortcut-label">打开文件夹</div>
              <div className="welcome-shortcut-key">Ctrl + Shift + O</div>
            </div>
          </div>
        </div>

        <p className="welcome-hint">
          或将 Markdown 文件拖拽到窗口即可打开
        </p>
      </div>
    </div>
  );
}
